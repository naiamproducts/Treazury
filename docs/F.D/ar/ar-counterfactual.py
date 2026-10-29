#!/usr/bin/env python3
"""
Treazury — AR counterfactual engine (F.D/ar)
============================================
Companion to docs/F.D/ar/ar-counterfactual.md. Extends corridor-model.py
(params loaded from it, never duplicated as facts) with scenario toggles:

  S1  no export-surrender duty  -> AR payer settles from USDC proceeds:
       onramp AR -> 0, official-gap -> 0  (exporter keeps USDC, TO 7.1 gone)
  S2  single free FX rate       -> official-gap -> 0 (brecha collapses;
       both rails measured against ONE mid; bank fx markup kept as-is)
  S3  no PSAV/licensing friction-> NO rail-cost change (capital/feasibility
       effects are quantified in the .md, not here)
  S4  all of the above (S1+S2+S3)

Variants (honest sensitivities, labelled in the .md):
  S1-native   S1 + payee accepts USDC directly (no fiat off-ramp)
  S1-wire-bis S1 but the SWIFT alternative is a USD wire WITHOUT an AR FX
              conversion (payer already holds USDC -> convert to USD at ~1:1,
              case-B arithmetic from corridor-audit.py)
  S4-compact  S4 + competitive compression of the AR bank fx markup to a
              fintech-class 0.60% (ASSUMED — BIS WP 1385 fintech all-in
              40-150bps; not a measured AR post-liberalisation spread)

Every scenario output is INFORMATIONAL by construction (model output under
stated parameters). Run:  python3 docs/F.D/ar/ar-counterfactual.py
"""

import io
import os
import contextlib
import importlib.util

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "..", "global", "corridor-model.py")

spec = importlib.util.spec_from_file_location("cm", SRC)
cm = importlib.util.module_from_spec(spec)
with contextlib.redirect_stdout(io.StringIO()):
    spec.loader.exec_module(cm)

P, CORRIDORS = cm.P, cm.CORRIDORS
pct = cm.pct
CAPITAL_COST, DAYS_PER_YEAR = cm.CAPITAL_COST, cm.DAYS_PER_YEAR

TICKETS = (25_000, 100_000)
FOCUS = ("AR->CN", "AR->US")          # no AR->MX row exists in the model: UNVALIDATED

# refreshed, SOURCED 2026-10-27 (corridor-economics.md:152; tn.com.ar 09:24,
# valordolarblue.ar): dolar cripto 1,672.88-1,675.37 vs oficial venta 1,560.
# Used only to cross-check the model's 3% mid gap against the live 7.2-7.4%.
LIVE_GAP_PCT = 7.345   # mid of 7.24-7.45, vs BCRA promedio venta 1,559.94


# ---------------------------------------------------------------------------
# cost functions with explicit overrides (formulas mirror corridor-model.py
# :117-139; baseline equality is asserted below)
# ---------------------------------------------------------------------------
def swift_cost(amount, sender, payee, days_key, gmf, band="mid", fx_pct=None):
    i = {"low": 0, "mid": 1, "high": 2}[band]
    s = P["swift"]
    fx_key = "US_OUT" if sender == "US" else sender
    fx = pct(s["fx_pct"][fx_key][i] if fx_pct is None else fx_pct)
    days = s["days"][days_key][i]
    variable = fx + (pct(P["usdc"]["gmf_pct"]) if gmf else 0.0)
    fixed = (s["sender_fee"][sender][i] + s["intermediary"][i]
             + s["beneficiary"][payee][i] + s["repair"][i])
    float_pct = days * CAPITAL_COST / DAYS_PER_YEAR
    return fixed + amount * (variable + float_pct), fixed, variable + float_pct


def usdc_cost(amount, sender, payee, gmf, band="mid",
              onramp_pct=None, onramp_spread=None, gap_pct=None,
              offramp_pct=None):
    i = {"low": 0, "mid": 1, "high": 2}[band]
    u = P["usdc"]
    on = pct(u["onramp_pct"][sender][i] if onramp_pct is None else onramp_pct)
    on_sp = pct(u["onramp_spread_pct"][sender][i]
                if onramp_spread is None else onramp_spread)
    gp = pct(u["ar_official_gap_pct"][i] if gap_pct is None else gap_pct) \
        if sender == "AR" else 0.0
    off = pct(u["offramp_pct"][payee][i] if offramp_pct is None else offramp_pct)
    variable = on + on_sp + gp + pct(u["treazury_pct"]) + off \
        + (pct(u["gmf_pct"]) if gmf else 0.0)
    fixed = u["onramp_fixed"][sender] + u["chain"] + u["offramp_fixed"][payee]
    return fixed + amount * variable, fixed, variable


# ---------------------------------------------------------------------------
# scenario definitions — each is a dict of overrides (None = model default)
# ---------------------------------------------------------------------------
SCENARIOS = {
    "baseline (current regime)": {},
    "S1 no surrender duty": {"onramp_pct": 0.0, "onramp_spread": 0.0,
                             "gap_pct": 0.0},
    "S2 single free FX rate": {"gap_pct": 0.0},
    "S3 no PSAV/licensing": {},          # rail costs unchanged by design
    "S4 full free regime": {"onramp_pct": 0.0, "onramp_spread": 0.0,
                            "gap_pct": 0.0},
    "S4-compact (bank fx 0.60%)": {"onramp_pct": 0.0, "onramp_spread": 0.0,
                                   "gap_pct": 0.0, "swift_fx_pct": 0.60},
}
VARIANTS = {
    "S1-native (payee takes USDC)": {"onramp_pct": 0.0, "onramp_spread": 0.0,
                                     "gap_pct": 0.0, "offramp_pct": 0.0},
    "S1-wire-bis (alt = USD wire, no AR fx)": {
        "onramp_pct": 0.0, "onramp_spread": 0.0, "gap_pct": 0.0,
        "swift_fx_pct": 0.0},
}

CORR = {name: (sender, payee, dk, gmf) for name, sender, payee, dk, gmf in CORRIDORS}


# ---------------------------------------------------------------------------
# 0. baseline equality vs corridor-model.py (arithmetic CONFIRMED)
# ---------------------------------------------------------------------------
ok = True
for name in FOCUS:
    sender, payee, dk, gmf = CORR[name]
    for t in TICKETS:
        m = cm.usdc_cost(t, sender, payee, gmf, "mid")[0]
        c = usdc_cost(t, sender, payee, gmf)[0]
        ms = cm.swift_cost(t, sender, payee, dk, gmf, "mid")[0]
        cs = swift_cost(t, sender, payee, dk, gmf)[0]
        if abs(m - c) > 1e-6 or abs(ms - cs) > 1e-6:
            ok = False
print("BASELINE EQUALITY vs corridor-model.py:", "CONFIRMED" if ok else "FAIL")
assert ok


def run(name, ov):
    sender, payee, dk, gmf = CORR[name]
    kw = {k: v for k, v in ov.items() if k != "swift_fx_pct"}
    kw_s = {k: v for k, v in ov.items() if k == "swift_fx_pct"}
    rows = []
    for t in TICKETS:
        s_tot, s_fix, s_var = swift_cost(
            t, sender, payee, dk, gmf, fx_pct=kw_s.get("swift_fx_pct"))
        u_tot, u_fix, u_var = usdc_cost(t, sender, payee, gmf, **kw)
        rows.append((t, s_tot, u_tot))
    # break-even slope math at amount=1
    s1t, s_fix, s_var = swift_cost(1, sender, payee, dk, gmf,
                                   fx_pct=kw_s.get("swift_fx_pct"))
    u1t, u_fix, u_var = usdc_cost(1, sender, payee, gmf, **kw)
    be = None
    if abs(u_var - s_var) > 1e-12:
        cand = (s_fix - u_fix) / (u_var - s_var)
        be = cand if cand > 0 else None
    if be is None:
        direction = ("USDC wins EVERY size" if u_var < s_var
                     else "SWIFT wins EVERY size")
    else:
        direction = ("USDC wins BELOW, SWIFT above" if u_var > s_var
                     else "USDC wins ABOVE, SWIFT below")
    return rows, be, direction, u_var, s_var


# ---------------------------------------------------------------------------
# 1. scenario table
# ---------------------------------------------------------------------------
BASE_USDC = {}
for name in FOCUS:
    sender, payee, dk, gmf = CORR[name]
    for t in TICKETS:
        BASE_USDC[(name, t)] = usdc_cost(t, sender, payee, gmf)[0]

print()
print("=" * 118)
print("SCENARIO TABLE — AR corridors, mid band, $25k/$100k (all INFORMATIONAL; "
      "arithmetic CONFIRMED by reproduction)")
print("=" * 118)
hdr = (f"{'scenario':<32}{'corridor':<9}{'ticket':>8}{'SWIFT $':>9}{'SWIFT %':>8}"
       f"{'USDC $':>9}{'USDC %':>8}{'d vs SWIFT':>11}{'d vs base USDC':>15}  verdict")
print(hdr)
for sname, ov in SCENARIOS.items():
    for name in FOCUS:
        rows, be, direction, uv, sv = run(name, ov)
        for (t, s_tot, u_tot) in rows:
            d_sw = s_tot - u_tot                       # + = USDC cheaper
            d_base = BASE_USDC[(name, t)] - u_tot      # improvement vs current
            v = ("USDC" if d_sw > 0 else "SWIFT") if abs(d_sw) > max(25, 0.0005 * t) else "TIE"
            print(f"{sname:<32}{name:<9}{t:>8,}{s_tot:>9,.0f}"
                  f"{100*s_tot/t:>7.2f}%{u_tot:>9,.0f}{100*u_tot/t:>7.2f}%"
                  f"{d_sw:>+11,.0f}{d_base:>+15,.0f}  {v}")
        print(f"{'':<32}{name:<9}   break-even: "
              + (f"${be:,.0f} ({direction})" if be else direction))

print()
print("VARIANTS (honest sensitivities)")
print(hdr)
for sname, ov in VARIANTS.items():
    for name in FOCUS:
        rows, be, direction, uv, sv = run(name, ov)
        for (t, s_tot, u_tot) in rows:
            d_sw = s_tot - u_tot
            d_base = BASE_USDC[(name, t)] - u_tot
            v = ("USDC" if d_sw > 0 else "SWIFT") if abs(d_sw) > max(25, 0.0005 * t) else "TIE"
            print(f"{sname:<32}{name:<9}{t:>8,}{s_tot:>9,.0f}"
                  f"{100*s_tot/t:>7.2f}%{u_tot:>9,.0f}{100*u_tot/t:>7.2f}%"
                  f"{d_sw:>+11,.0f}{d_base:>+15,.0f}  {v}")
        print(f"{'':<32}{name:<9}   break-even: "
              + (f"${be:,.0f} ({direction})" if be else direction))

# ---------------------------------------------------------------------------
# 2. live-gap cross-check: model 3% mid vs SOURCED 7.24-7.45% (2026-10-27)
# ---------------------------------------------------------------------------
print()
print("=" * 118)
print("GAP CROSS-CHECK — model mid 3.0% vs live brecha 7.24-7.45% (SOURCED "
      "2026-10-27): baseline USDC cost under the LIVE gap")
print("=" * 118)
for name in FOCUS:
    sender, payee, dk, gmf = CORR[name]
    for t in TICKETS:
        base = BASE_USDC[(name, t)]
        live = usdc_cost(t, sender, payee, gmf, gap_pct=LIVE_GAP_PCT)[0]
        print(f"  {name} ${t:>7,}: model-mid USDC ${base:>8,.0f} "
              f"({100*base/t:.2f}%)   live-gap USDC ${live:>8,.0f} "
              f"({100*live/t:.2f}%)   understatement ${live-base:>+8,.0f}")

# ---------------------------------------------------------------------------
# 3. S1 slope anatomy — the win is fixed-fee, not variable-cost
# ---------------------------------------------------------------------------
print()
print("=" * 118)
print("S1 ANATOMY — variable slopes under S1 (AR->US)")
print("=" * 118)
rows, be, direction, uv, sv = run("AR->US", SCENARIOS["S1 no surrender duty"])
print(f"  USDC slope {100*uv:.4f}%  vs  SWIFT slope {100*sv:.4f}%  "
      f"(delta {100*(sv-uv):+.4f}pp — razor thin)")
print(f"  fixed: USDC $5.02 vs SWIFT $110 -> the S1 win (~$105 at both "
      f"tickets) is the FIXED-FEE advantage, not a variable-cost advantage.")
print(f"  At $1,000,000 the S1 win shrinks to "
      f"${(110-5.02) - 1_000_000*(uv-sv):,.0f} (slopes nearly tied).")

# ---------------------------------------------------------------------------
# 4. settlement-time matrix (model days; no scenario changes network days)
# ---------------------------------------------------------------------------
print()
print("=" * 118)
print("TIME — model settlement days (corridor-model.py:51-59, ASSUMED bands); "
      "no scenario toggle changes network time")
print("=" * 118)
for name in FOCUS:
    sender, payee, dk, gmf = CORR[name]
    d = P["swift"]["days"][dk]
    print(f"  {name}: SWIFT {d[0]}-{d[2]} business days (mid {d[1]}). "
          f"USDC chain leg: minutes (CONFIRMED on testnet); end-to-end with "
          f"bank payout: UNKNOWN — no LicensedRail contracted "
          f"(quarantine the '2-6h' claim).")
print("  Regime add-ons (SOURCED): current regime adds the ingreso/liquidacion "
      "tail (TO 7.1 / Com A 8417: 15/30/180d, up to 365d) and MCF-channel "
      "steps; S1/S4 remove that tail. It is a compliance tail, not settlement "
      "delay per se — tagged INFORMATIONAL as a cost-of-capital/ops burden.")

# ---------------------------------------------------------------------------
# 5. AR->MX note
# ---------------------------------------------------------------------------
print()
print("AR->MX: no corridor row exists in corridor-model.py -> UNVALIDATED, "
      "not modelled in any scenario (would need an ARS->MXN stack + MX "
      "off-ramp quote; owner F.D if the founder wants it).")
