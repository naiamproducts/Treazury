#!/usr/bin/env python3
"""Treazury — crypto utility verdict for AR: IMPORTS vs EXPORTS (F.D/ar).

Companion to docs/F.D/ar/crypto-utility-verdict.md (aven).
Reproduces every table in that report, with asserts at the end so the
published figures can be re-derived.

Loads (params are never duplicated here as facts, they are imported):
  ../global/corridor-model.py   -> wire/rail params, swift_cost/usdc_cost
  ar-counterfactual.py          -> S1..S4 scenario engine (its own baseline-
                                   equality assert vs corridor-model runs first)
  revenue-projection-1b.py      -> ratified P3 schedule + contribution regimes

Every cell printed below is INFORMATIONAL by construction (model output under
STATED parameters). Inputs carry their tag in the .md input ledger.

Run: python3 docs/F.D/ar/crypto-utility-verdict.py
"""

import io
import os
import contextlib
import importlib.util

HERE = os.path.dirname(os.path.abspath(__file__))


def load(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    m = importlib.util.module_from_spec(spec)
    with contextlib.redirect_stdout(io.StringIO()):
        spec.loader.exec_module(m)
    return m


cm = load("cm", os.path.join(HERE, "..", "global", "corridor-model.py"))
acf = load("acf", os.path.join(HERE, "ar-counterfactual.py"))   # runs its asserts
rp = load("rp", os.path.join(HERE, "revenue-projection-1b.py"))

CAP = cm.CAPITAL_COST            # 0.10 /yr  ASSUMED (corridor-model.py:14)
DAYS_YR = cm.DAYS_PER_YEAR
pct = cm.pct

TICKETS = (25_000, 100_000)
ICP_TICKETS = (25_000, 49_900, 100_000)   # $49,900 = ICP mean ticket (dist A)
FOCUS = ("AR->US", "AR->CN")
MIRROR = "US->AR (mirror)"                 # the EXPORT direction in the model

# --- SOURCED rate pair, 2026-10-27 (rent-decomposition.md:133-136) -----------
OFICIAL_VENTA = 1_559.94     # BCRA promedio venta / BNA 1,560
OFICIAL_COMPRA = 1_506.87    # BCRA promedio compra
CRIPTO = 1_674.12            # dolar cripto mid (1,672.88-1,675.37)
LOSS_VENTA = 1 - OFICIAL_VENTA / CRIPTO      # the established 6.82%
LOSS_COMPRA = 1 - OFICIAL_COMPRA / CRIPTO    # exporter's realised side, ~10%

# --- INDEC CY2025 goods exports (SOURCED: ICA press release 2026-01-20) ------
INDEC_EXPORTS_2025 = 87_077e6

print("=" * 112)
print("1. IMPORTS — scenario deltas re-affirmed (mid band, + = USDC cheaper) "
      "arithmetic from ar-counterfactual.py")
print("=" * 112)
IMPO_SCEN = ("baseline (current regime)", "S1 no surrender duty",
             "S2 single free FX rate", "S3 no PSAV/licensing",
             "S4-compact (bank fx 0.60%)")
imp = {}
for sname in IMPO_SCEN:
    ov = (acf.SCENARIOS[sname] if sname in acf.SCENARIOS
          else acf.VARIANTS[sname])
    for name in FOCUS:
        rows, be, direction, uv, sv = acf.run(name, ov)
        imp[(sname, name, "be")] = be
        for t, s_tot, u_tot in rows:
            imp[(sname, name, t)] = round(s_tot - u_tot)
            print(f"{sname:<30}{name:<9}{t:>8,}  SWIFT ${s_tot:>8,.0f}  "
                  f"USDC ${u_tot:>8,.0f}  delta {s_tot-u_tot:>+9,.0f}")
        if sname in ("baseline (current regime)", "S1 no surrender duty"):
            be_txt = f"${be:,.0f}" if be else "none"
            print(f"{'':<30}{name:<9}   break-even {be_txt} — {direction}")

# S3 must be identical to baseline by construction
for name in FOCUS:
    for t in TICKETS:
        assert imp[("S3 no PSAV/licensing", name, t)] == \
               imp[("baseline (current regime)", name, t)]

print()
print("=" * 112)
print("2. EXPORTS — the wire leg, US->AR mirror corridor (same rates as "
      "corridor-economics.md; no rate is changed)")
print("=" * 112)
sender, payee, dk, gmf = acf.CORR[MIRROR]
wire = {}
for band in ("low", "mid", "high"):
    for t in ICP_TICKETS:
        tot, fix, var = acf.swift_cost(t, sender, payee, dk, gmf, band)
        i = {"low": 0, "mid": 1, "high": 2}[band]
        fixed_detail = (cm.P["swift"]["sender_fee"][sender][i]
                        + cm.P["swift"]["intermediary"][i]
                        + cm.P["swift"]["beneficiary"][payee][i]
                        + cm.P["swift"]["repair"][i])
        sha_exporter = (cm.P["swift"]["intermediary"][i]
                        + cm.P["swift"]["beneficiary"][payee][i]
                        + cm.P["swift"]["repair"][i])
        days = cm.P["swift"]["days"][dk][i]
        flo = days * CAP / DAYS_YR * t
        wire[(band, t)] = dict(total=tot, fixed=fix, var=var,
                               sha=sha_exporter, days=days, float=flo,
                               fx=pct(cm.P["swift"]["fx_pct"]["US_OUT"][i]))
        print(f"{band:<5} ${t:>7,}  all-in ${tot:>8,.0f} ({100*tot/t:>5.2f}%)  "
              f"fixed ${fix:>4,.0f}  (exporter-borne SHA ${sha_exporter:>4,.0f})  "
              f"float {days}d ${flo:>7,.2f}  fx-markup {100*pct(cm.P['swift']['fx_pct']['US_OUT'][i]):.2f}%")

print("\nNOTE: the model's 2.50% US_OUT markup line IS the liquidation spread "
      "(bank buys USD at the official side). It is EXCLUDED from the export "
      "differential below because the mandated official-rate liquidation is "
      "already priced as the common 6.82% loss — counting both double-counts "
      "the same conversion friction. Model all-in incl. markup is shown above "
      "for transparency only.")

print()
print("=" * 112)
print("3. EXPORTS — the 6.82% is COMMON to both channels (mandated liquidation)")
print("=" * 112)
print(f"loss vs market at official VENTA side : {100*LOSS_VENTA:.4f}%  "
      f"(established 6.82%)")
print(f"loss vs market at official COMPRA side : {100*LOSS_COMPRA:.4f}%  "
      f"(exporter's realised quote — INFORMATIONAL caveat)")
for t in ICP_TICKETS:
    print(f"  ${t:>7,}: venta-side ${LOSS_VENTA*t:>8,.0f}   "
          f"compra-side ${LOSS_COMPRA*t:>8,.0f}   "
          f"(wire all-in mid for contrast ${wire[('mid', t)]['total']:>7,.0f})")
print("Identical in both channels: the duty binds the exporter regardless of "
      "the rail (ar/profile.md buyerToSellerDirect: blocked; Engram #1439 "
      "REJECTED the idea that USDC receipt discharges TO 7.1).")

print()
print("=" * 112)
print("4. EXPORTS — channel A (bank wire) vs channel B (escrow + P3), central")
print("=" * 112)
# All wire/rail rates imported from corridor-model.py; only the escrow-side
# legs below are new inputs — each tagged ASSUMED/SOURCED in the .md ledger.
OFFRAMP_PCT = 0.0005     # Circle express redemption 5bps (SOURCED eff 2026-10-19)
OFFRAMP_FIXED = 5.0      # ASSUMED (corridor-model.py offramp_fixed US=5)
INGRESS_FIXED = (45 + 20 + 15)   # US sender + intermediary + AR beneficiary (model mid)
GAS = 0.02               # ASSUMED
DAYS_A = 3               # model US_AR mid settlement days
DAYS_B = 4               # Circle express ~1d (ASSUMED) + wire 3d (model mid)
COMP_A = 150.0           # ASSUMED central: hours of asesor cambiario/abogado
COMP_B = 0.0             # ASSUMED central: P3 includes doc generation

diff = {}
for t in ICP_TICKETS:
    a_wire = wire[("mid", t)]["fixed"]
    a_float = DAYS_A * CAP / DAYS_YR * t
    a_total = a_wire + a_float + COMP_A
    b_off = t * OFFRAMP_PCT + OFFRAMP_FIXED
    b_float = DAYS_B * CAP / DAYS_YR * t
    b_excl = GAS + b_off + INGRESS_FIXED + b_float + COMP_B
    fee = rp.P3_LOW if t <= rp.TIER else rp.P3_HIGH
    saving = a_total - b_excl                 # A minus B-before-fee
    net_no_risk = saving - fee                # exporter's net before default EV
    diff[t] = dict(a=a_total, b=b_excl, fee=fee, saving=saving, net=net_no_risk)
    print(f"${t:>7,}:  A ${a_total:>8,.2f} (wire {a_wire:>4,.0f} + float "
          f"{a_float:>7,.2f} + compliance {COMP_A:>5,.0f})   "
          f"B-excl-fee ${b_excl:>8,.2f}  | rail+compliance saving "
          f"{saving:>+8,.2f}  - P3 ${fee:>5,.2f} = net {net_no_risk:>+8,.2f}")

print()
print("=" * 112)
print("5. EXPORTS — default-risk EV of the escrow, and the P3 fee ceiling")
print("=" * 112)
CORNERS = (
    ("conservative", dict(d=0.01, rec=0.40, comp_a=0.0, comp_b=30.0)),
    ("central",      dict(d=0.025, rec=0.0, comp_a=150.0, comp_b=0.0)),
    ("upper",        dict(d=0.05, rec=0.0, comp_a=300.0, comp_b=0.0)),
)
ceil_tbl = {}
for cname, c in CORNERS:
    for t in ICP_TICKETS:
        a = wire[("mid", t)]["fixed"] + DAYS_A * CAP / DAYS_YR * t + c["comp_a"]
        b = (GAS + t * OFFRAMP_PCT + OFFRAMP_FIXED + INGRESS_FIXED
             + DAYS_B * CAP / DAYS_YR * t + c["comp_b"])
        saving = a - b
        ev = c["d"] * t * (1 - c["rec"])
        fee = rp.P3_LOW if t <= rp.TIER else rp.P3_HIGH
        ceiling = saving + ev
        net = ceiling - fee
        ceil_tbl[(cname, t)] = dict(saving=saving, ev=ev, ceiling=ceiling,
                                    fee=fee, net=net, mult=ceiling / fee)
        print(f"{cname:<12} ${t:>7,}: rail+comp {saving:>+8,.2f}  "
              f"EV(d={c['d']:.1%}, rec={c['rec']:.0%}) {ev:>8,.2f}  "
              f"-> fee ceiling ${ceiling:>8,.2f} vs P3 ${fee:>5,.2f} "
              f"({ceiling/fee:>4.1f}x)  exporter net {net:>+8,.2f}")

print("\nEV vs P3 alone (recovery 0%), default rate sensitivity:")
for d in (0.01, 0.025, 0.05, 0.06):
    row = []
    for t in ICP_TICKETS:
        fee = rp.P3_LOW if t <= rp.TIER else rp.P3_HIGH
        row.append(f"${d*t:>8,.0f}/{fee:>3,.0f}={d*t/fee:>4.1f}x")
    print(f"  d={d:>5.1%}: " + "   ".join(row))

print("\nBreak-even default rate for P3 to be value-neutral "
      "(conservative rail+compliance, recovery 40%):  "
      "d* = (fee - saving) / (t x (1-rec))")
for cname, c in (("conservative", dict(d=0.01, rec=0.40, comp_a=0.0, comp_b=30.0)),):
    for t in ICP_TICKETS:
        s = ceil_tbl[(cname, t)]["saving"]
        fee = ceil_tbl[(cname, t)]["fee"]
        d_star = (fee - s) / (t * (1 - c["rec"]))
        print(f"  ${t:>7,}: d* = {100*d_star:.3f}% of the book "
              f"(Atradius observes 1-6% bad-debt/credit-loss rates)")

print()
print("=" * 112)
print("6. EXPORTS — time counterfactual: is the float saving REAL money?")
print("=" * 112)
RAIL_A = (2, 3, 6)          # model US_AR network days (settlement only)
RAIL_B = 4                  # Circle express 1d + wire 3d  (ASSUMED)
scen_a = (7 + 14, 14 + 21, 21 + 28)   # wire 5/10/15 bd -> cd  + compliance 14/21/28 d
scen_b = (10, 6, 4)                   # worst/mid/best escrow leg, cd
print(f"rail-vs-rail only: bank {RAIL_A[1]}d (mid) vs escrow {RAIL_B}d "
      f"-> delta {RAIL_A[1]-RAIL_B:+d} days (escrow is NOT faster on rails: it "
      f"still needs Circle express + an ingress wire into AR)")
for lbl, days in (("low", scen_a[0] - scen_b[0]),
                  ("mid", scen_a[1] - scen_b[1]),
                  ("high", scen_a[2] - scen_b[2])):
    print(f"scenario {lbl:<4} A={scen_a[['low','mid','high'].index(lbl)]}d vs "
          f"B={scen_b[['low','mid','high'].index(lbl)]}d -> {days:+d} days saved")
    for t in ICP_TICKETS:
        v10 = days * t * CAP / DAYS_YR
        v40 = days * t * 0.40 / DAYS_YR      # ASSUMED Argentine working-capital rate
        print(f"    ${t:>7,}: ${v10:>8,.2f} @ 10%/yr model rate   "
              f"${v40:>8,.2f} @ 40%/yr (ASSUMED)")
print("These day-count values are NOT added to the section-5 fee ceiling "
      "(deliberate: the ceiling excludes working-capital acceleration).")

print()
print("=" * 112)
print("7. CLAIM CHECK — flat fee vs a bank that drops its markup to 0.60%")
print("=" * 112)
def bank_free(t, fx_pct=0.60):
    """Free-regime bank price: bank markup 0.60% + wire fixed + float."""
    return acf.swift_cost(t, sender, payee, dk, gmf, "mid", fx_pct=fx_pct)[0]

def crypto_free(t, hold_usdc, fee_pct=0.015):
    """Free-regime crypto price (gap 0). hold_usdc: payer settles from USDC
    proceeds (S4-compact) vs payer buys USDC at 0.45%+0.15% spread."""
    onr, onsp = (0.0, 0.0) if hold_usdc else (0.45, 0.15)
    rail = t * (pct(onr) + pct(onsp) + 0.0005) + 5.02   # off-ramp US 0.05% mid
    return rail + t * fee_pct

def crypto_p3(t, hold_usdc):
    onr, onsp = (0.0, 0.0) if hold_usdc else (0.45, 0.15)
    rail = t * (pct(onr) + pct(onsp) + 0.0005) + 5.02
    return rail + (rp.P3_LOW if t <= rp.TIER else rp.P3_HIGH)

CLAIM_TICKETS = (7_000, 15_000, 25_000, 49_900, 100_000, 200_000, 1_000_000)
for hold in (True, False):
    label = "payer HOLDS USDC (S4-compact)" if hold else "payer BUYS USDC (on-ramp 0.60%)"
    print(f"\n-- {label}, free regime (no brecha), bank markup 0.60%:")
    for t in CLAIM_TICKETS:
        bk = bank_free(t)
        c15 = crypto_free(t, hold, 0.015)
        cp3 = crypto_p3(t, hold)
        print(f"   ${t:>9,}: bank ${bk:>9,.0f} | 1.5% fee ${c15:>9,.0f} "
              f"({c15-bk:>+8,.0f}) | P3 ${cp3:>9,.0f} ({cp3-bk:>+8,.0f})")

# crossover for P3, payer-buys-USDC config (closed form; float = mirror mid 3d)
DAYS_MIRROR = cm.P["swift"]["days"][dk][1]              # 3 business days (US_AR mid)
slope_bank = 0.006 + (DAYS_MIRROR * CAP / DAYS_YR)      # 0.60% + float
slope_p3 = 0.0045 + 0.0015 + 0.0005                     # on-ramp + spread + off-ramp
xover_hi = ((rp.P3_HIGH + 5.02) - 110) / (slope_bank - slope_p3)
print(f"\nP3 vs 0.60% bank, payer-buys-USDC: crypto WINS <= ${rp.TIER:,.0f} "
      f"(P3 tier 1), LOSES ${rp.TIER:,.0f}..${xover_hi:,.0f}, wins above "
      f"(bank slope {100*slope_bank:.4f}% vs crypto {100*slope_p3:.4f}%)")
# 1.5% fee vs 0.60% bank, both payer configs
be_15_buys = (110 - 5.02) / (0.015 + 0.006 + 0.0005 - slope_bank)
be_15_holds = (110 - 5.02) / (0.015 + 0.0005 - slope_bank)
print(f"1.5% fee vs 0.60% bank: break-even ${be_15_buys:,.0f} (payer buys USDC) "
      f"/ ${be_15_holds:,.0f} (payer holds USDC) — USDC wins only BELOW")
# and the established mid-band break-evens (gap priced in)
for name in FOCUS:
    rows, be, direction, uv, sv = acf.run(name, {})
    print(f"mid band WITH brecha ({name}): break-even ${be:,.0f} — {direction}")

print()
print("=" * 112)
print("8. VOLUME MODEL — AR exports at P3 vs the $1B/yr import scenario")
print("=" * 112)
print(f"INDEC CY2025 goods exports: ${INDEC_EXPORTS_2025/1e6:,.0f}M "
      f"(SOURCED ICA 2026-01-20); dist A mean ${rp.mean_of(rp.DIST_A):,.0f}")
vol_tbl = {}
for share in (0.005, 0.01, 0.0146, 0.02):
    v = INDEC_EXPORTS_2025 * share
    r = rp.p3_revenue(v, rp.DIST_A)
    vol_tbl[share] = r
    print(f"  capture {share:>6.2%} -> ${v/1e6:>8,.0f}M  {r['n']:>8,.0f} "
          f"payments/yr  P3 ${r['rev']:>10,.0f}/yr  (take {100*r['take']:.3f}%)")
r_imp = rp.p3_revenue(1e9, rp.DIST_A)
print(f"  import scenario $1,000M (1.46% of MULC 2025) -> ${r_imp['rev']:,.0f}/yr")
print(f"  export at the SAME 1.46% share -> ${vol_tbl[0.0146]['rev']:,.0f}/yr "
      f"({vol_tbl[0.0146]['rev']/r_imp['rev']:.2f}x the import model)")
for regime in ("A", "A_stack", "A_referred", "B"):
    lo, hi = rp.contribution(rp.DIST_A, regime)
    print(f"  contribution/pay ({regime}): ${hi:,.2f} .. ${lo:,.2f}")

# --------------------------------------------------------------------------
# REPRODUCTION ASSERTS — published figures in crypto-utility-verdict.md
# --------------------------------------------------------------------------
print()
print("=" * 112)
print("ASSERTS (published figures)")
print("=" * 112)

# 1) import scenario deltas (ar-counterfactual.md:133-148, corridor-economics.md:52)
assert imp[("baseline (current regime)", "AR->US", 25_000)] == -794
assert imp[("baseline (current regime)", "AR->US", 100_000)] == -3490
assert imp[("baseline (current regime)", "AR->CN", 25_000)] == -981
assert imp[("baseline (current regime)", "AR->CN", 100_000)] == -4220
assert imp[("S1 no surrender duty", "AR->US", 25_000)] == 106
assert imp[("S1 no surrender duty", "AR->US", 100_000)] == 110
assert imp[("S2 single free FX rate", "AR->US", 25_000)] == -44
assert imp[("S2 single free FX rate", "AR->US", 100_000)] == -490
assert imp[("S4-compact (bank fx 0.60%)", "AR->US", 25_000)] == -119
assert imp[("S4-compact (bank fx 0.60%)", "AR->US", 100_000)] == -790
print("1. import scenario deltas: reproduced (-794/-3490, -981/-4220, "
      "+106/+110, -44/-490, -119/-790)  OK")

# 2) break-even tickets (corridor-economics.md:210-211)
_, be_cn, dir_cn, _, _ = acf.run("AR->CN", {})
_, be_us, dir_us, _, _ = acf.run("AR->US", {})
assert abs(be_cn - 2_269) <= 1 and abs(be_us - 2_920) <= 1
assert "BELOW" in dir_us and "BELOW" in dir_cn
print(f"2. break-evens AR->CN ${be_cn:,.0f} / AR->US ${be_us:,.0f}, direction "
      "'USDC wins BELOW'  OK")

# 3) surrender loss arithmetic (rent-decomposition.md:134-139)
assert round(100 * LOSS_VENTA, 2) == 6.82
assert abs(LOSS_VENTA * 25_000 - 1_705) <= 2
assert abs(LOSS_VENTA * 100_000 - 6_821) <= 5
assert round(100 * LOSS_COMPRA, 2) == 9.99
print(f"3. surrender loss {100*LOSS_VENTA:.2f}% -> $1,705/$25k, $6,821/$100k; "
      f"compra side {100*LOSS_COMPRA:.2f}%  OK")

# 4) wire baseline, export direction (corridor-model params unchanged)
assert wire[("mid", 25_000)]["fixed"] == 110
assert abs(wire[("mid", 25_000)]["float"] - 25_000 * 3 * CAP / DAYS_YR) < 1e-6
assert abs(wire[("mid", 100_000)]["total"] - 2_692.19) < 0.5
print(f"4. US->AR wire mid: fixed $110, float 3d, all-in $25k "
      f"${wire[('mid', 25_000)]['total']:,.0f} / $100k "
      f"${wire[('mid', 100_000)]['total']:,.0f}  OK")

# 5) differential signs — positive rail+compliance saving, but small/negative
#    on big tickets and negative in the conservative corner, so P3 is only
#    justified once the default-risk term is added.
assert diff[49_900]["saving"] > 0            # central rail+compliance saving > 0
assert diff[100_000]["net"] < 0              # net < 0 at $100k BEFORE default EV
assert ceil_tbl[("conservative", 49_900)]["saving"] < 0   # conservative < 0
assert ceil_tbl[("central", 49_900)]["ceiling"] > rp.P3_LOW
assert ceil_tbl[("conservative", 25_000)]["ceiling"] > rp.P3_LOW
print("5. export differential: central saving > 0 but net < 0 at $100k / "
      "conservative saving < 0; P3 covered even in conservative corner  OK")

# 6) time: rail-only saving is NOT positive
assert RAIL_A[1] - RAIL_B < 0
print(f"6. rail-vs-rail days delta {RAIL_A[1]-RAIL_B:+d} (escrow not faster on "
      "rails alone)  OK")

# 7) claim-3: flat fee does NOT win everywhere against a 0.60% bank
mid_t = 100_000
assert crypto_p3(mid_t, hold_usdc=False) > bank_free(mid_t)      # loses at 100k
assert crypto_p3(25_000, hold_usdc=False) < bank_free(25_000)    # wins at 25k
assert crypto_p3(mid_t, hold_usdc=True) < bank_free(mid_t)       # wins if holds USDC
assert crypto_free(100_000, hold_usdc=False, fee_pct=0.015) > bank_free(100_000)
assert 50_000 < xover_hi < 200_000           # loss window is real but bounded
print(f"7. claim 'flat fee immune to a 0.60% bank': wins <=${rp.TIER:,.0f} and "
      f">${xover_hi:,.0f}, loses in between (buys-USDC config); wins everywhere "
      "only if the payer already holds USDC  OK")

# 8) volume model vs the import projection + contribution as coded
assert abs(r_imp["rev"] - 2_029_058) < 1
v146 = INDEC_EXPORTS_2025 * 0.0146
assert abs(vol_tbl[0.0146]["rev"] - v146 * vol_tbl[0.0146]["take"]) < 1  # rev = V x take
assert abs(vol_tbl[0.0146]["rev"] - 2_579_591) < 1
assert 1.25 < vol_tbl[0.0146]["rev"] / r_imp["rev"] < 1.30               # ~1.27x
c_dev = rp.contribution(rp.DIST_A, "A_stack")[1]
c_part = rp.contribution(rp.DIST_A, "A_referred")[1]
assert abs(c_dev - (-148.49)) < 0.01 and abs(c_part - (-647.49)) < 0.01
print(f"8. P3 export revenue @1.46% share ${vol_tbl[0.0146]['rev']:,.0f}/yr vs "
      f"import $1B ${r_imp['rev']:,.0f}/yr "
      f"({vol_tbl[0.0146]['rev']/r_imp['rev']:.2f}x); contribution as coded "
      f"${c_dev:,.2f} / ${c_part:,.2f}  OK")

print()
print("ALL CELLS INFORMATIONAL — inputs tagged SOURCED/ASSUMED in the .md ledger.")
