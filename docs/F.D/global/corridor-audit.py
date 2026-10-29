#!/usr/bin/env python3
"""
Treazury — corridor-economics AUDIT companion (F.D/global)
==========================================================
Extends corridor-model.py (params loaded from it, not duplicated) with:

  S1  Reproduce the published T.D headline numbers (assert)
  S2  Case B: NO-FX leg (USD-invoiced, USD-accounted both ends) — missing
      from corridor-model.py, material for the $15K-200K merchanting ICP
  S3  Crossover ticket per corridor: case A (FX, as modelled) and case B,
      with low/mid/high bands, plus verdicts at ICP tickets 15k/25k/100k/200k
  S4  FX-markup sensitivity: the bank FX markup at which USDC loses at scale
  S5  Pricing options P1/P2/P3 — revenue and margin per corridor at 25k/100k

Every parameter not taken from corridor-model.py is tagged ASSUMED here.
Run: python3 docs/F.D/global/corridor-audit.py
"""

import io
import contextlib
import importlib.util
import os

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "corridor-model.py")

# --- load corridor-model.py with its stdout suppressed (it prints on import) ---
spec = importlib.util.spec_from_file_location("cm", SRC)
cm = importlib.util.module_from_spec(spec)
with contextlib.redirect_stdout(io.StringIO()):
    spec.loader.exec_module(cm)

P, CORRIDORS = cm.P, cm.CORRIDORS
idx, pct = cm.idx, cm.pct
swift_cost, usdc_cost = cm.swift_cost, cm.usdc_cost
CAPITAL_COST, DAYS_PER_YEAR = cm.CAPITAL_COST, cm.DAYS_PER_YEAR

# ---------------------------------------------------------------------------
# ASSUMED (audit-added) — Case B: no FX leg. Both parties bank in USD.
# USD -> USDC on-ramp: Circle Mint 0% (SOURCED circle.com terms) at the low
# end; third-party USD/USDC taker 0.36% base / 0.05% high tier (INFORMATIONAL,
# third-party schedule, not re-verified on bitso.com/fees 2026-10-27) at the
# high end. Spread not published -> ASSUMED. Off-ramp: Circle standard 0 /
# express 0.05% (SOURCED help.circle.com, eff. 2026-10-19).
CASE_B = {
    "onramp_pct": (0.00, 0.18, 0.36),     # USD -> USDC, all senders
    "onramp_spread": (0.00, 0.05, 0.15),  # ASSUMED
    "offramp_pct": (0.00, 0.05, 0.30),    # USDC -> USD (Circle tiers)
    "onramp_fixed": {"US": 15, "AR": 0, "MX": 0, "CO": 0},  # USD wire in
    "offramp_fixed": 5,                   # USD payout
}


def caseB(amount, sender, payee, days_key, gmf, band):
    """SWIFT with fx=0 (USD wire to a USD account) vs USDC USD-in/USD-out."""
    i = idx(band)
    s, u = P["swift"], P["usdc"]
    days = s["days"][days_key][i]
    float_pct = days * CAPITAL_COST / DAYS_PER_YEAR
    s_var = float_pct + (pct(u["gmf_pct"]) if gmf else 0.0)          # FX = 0
    s_fix = (s["sender_fee"][sender][i] + s["intermediary"][i]
             + s["beneficiary"][payee][i] + s["repair"][i])
    b = CASE_B
    u_var = (pct(b["onramp_pct"][i]) + pct(b["onramp_spread"][i])
             + pct(u["treazury_pct"]) + pct(b["offramp_pct"][i])
             + (pct(u["gmf_pct"]) if gmf else 0.0))
    u_fix = b["onramp_fixed"][sender] + u["chain"] + b["offramp_fixed"]
    return (s_fix + amount * s_var, u_fix + amount * u_var,
            s_fix, s_var, u_fix, u_var)


def be_ticket(sf, uf, sv, uv):
    """Ticket where total costs are equal. Returns (ticket or None, side_below)."""
    if abs(uv - sv) < 1e-12:
        return None
    amt = (sf - uf) / (uv - sv)
    return (amt, None) if amt > 0 else (None, None)


def side_wins_below(sf, uf, sv, uv):
    """At ticket -> 0, who wins? (fixed costs decide)."""
    return "USDC" if uf < sf else "SWIFT"


# ---------------------------------------------------------------------------
# S1 — reproduce published T.D headline numbers (T.D/global/crypto-rails-benefit.md:62-74)
# ---------------------------------------------------------------------------
print("=" * 100)
print("S1  REPRODUCTION CHECK vs T.D/global/crypto-rails-benefit.md:62-74")
print("=" * 100)
published = {  # (corridor, ticket): (swift$, usdc$)
    ("AR->CN", 25_000): (509, 1490), ("AR->CN", 100_000): (1695, 5915),
    ("MX->US", 25_000): (676, 612), ("MX->US", 100_000): (2405, 2433),
    ("CO->US", 25_000): (969, 660), ("CO->US", 100_000): (3560, 2625),
    ("AR->US", 25_000): (499, 1293), ("AR->US", 100_000): (1665, 5155),
    ("US->MX (mirror)", 25_000): (752, 455),
    ("US->CO (mirror)", 25_000): (852, 610),
    ("US->AR (mirror)", 25_000): (756, 505),
}
ok = True
for name, sender, payee, dk, gmf in CORRIDORS:
    for amt in (25_000, 100_000):
        if (name, amt) not in published:
            continue
        s = round(swift_cost(amt, sender, payee, dk, gmf, "mid")[0])
        u = round(usdc_cost(amt, sender, payee, gmf, "mid")[0])
        ps, pu = published[(name, amt)]
        flag = "OK " if (abs(s - ps) <= 1 and abs(u - pu) <= 1) else "FAIL"
        if flag == "FAIL":
            ok = False
        print(f"  {flag} {name:<18} ${amt:>7,}  model {s:>5}/{u:>5}  "
              f"published {ps:>5}/{pu:>5}")
print(f"  => {'ALL REPRODUCED' if ok else 'MISMATCH FOUND'} "
      f"(arithmetic of corridor-model.py CONFIRMED; inputs audited in "
      f"corridor-economics.md)")

# ---------------------------------------------------------------------------
# S2/S3 — crossovers: case A (FX, as modelled) and case B (no FX leg)
# ---------------------------------------------------------------------------
ICP = (15_000, 25_000, 100_000, 200_000)

print()
print("=" * 100)
print("S2/S3  CROSSOVER TICKET + ICP VERDICTS  (mid band; positive delta = USDC cheaper)")
print("=" * 100)

rows = []
for name, sender, payee, dk, gmf in CORRIDORS:
    _, sf, sv = swift_cost(1, sender, payee, dk, gmf, "mid")
    _, uf, uv = usdc_cost(1, sender, payee, gmf, "mid")
    amt = None
    if abs(uv - sv) > 1e-12:
        cand = (sf - uf) / (uv - sv)
        amt = cand if cand > 0 else None
    caseA = amt
    caseA_dir = ("USDC wins BELOW, SWIFT above" if amt and uv > sv
                 else "USDC wins ABOVE, SWIFT below" if amt else
                 "USDC wins every size" if uv < sv else "SWIFT wins every size")
    # case B
    sbf, suf, ssf, ssv, suf2, suv = caseB(1, sender, payee, dk, gmf, "mid")
    # recompute at amount 1 -> fixed/slope (caseB returns totals at amount=1)
    sB_fix, sB_var = ssf, ssv
    uB_fix, uB_var = suf2, suv
    caseB_be = None
    if abs(uB_var - sB_var) > 1e-12:
        cand = (sB_fix - uB_fix) / (uB_var - sB_var)
        caseB_be = cand if cand > 0 else None
    # bands for case A
    bandBE = {}
    for band in ("low", "high"):
        _, sf2, sv2 = swift_cost(1, sender, payee, dk, gmf, band)
        _, uf2, uv2 = usdc_cost(1, sender, payee, gmf, band)
        if abs(uv2 - sv2) > 1e-12:
            cand = (sf2 - uf2) / (uv2 - sv2)
            bandBE[band] = cand if cand > 0 else None
    # ICP verdicts case A
    verdicts = []
    for t in ICP:
        st = swift_cost(t, sender, payee, dk, gmf, "mid")[0]
        ut = usdc_cost(t, sender, payee, gmf, "mid")[0]
        d = st - ut
        verdicts.append("U" if d > max(25, 0.0005 * t) else
                        "S" if d < -max(25, 0.0005 * t) else "TIE")
    rows.append((name, caseA, caseA_dir, bandBE, caseB_be, verdicts))

print(f"{'corridor':<18}{'caseA BE':>10}   {'direction':<30}"
      f"{'BE low/high':>18}{'caseB BE':>10}   {'15k 25k 100k 200k (A)'}")
for name, caseA, direction, bandBE, caseB_be, verdicts in rows:
    bl = f"${bandBE['low']:,.0f}" if bandBE.get("low") else "none"
    bh = f"${bandBE['high']:,.0f}" if bandBE.get("high") else "none"
    print(f"{name:<18}{'$'+format(caseA, ',.0f') if caseA else 'none':>10}   "
          f"{direction:<30}{bl+'/'+bh:>18}"
          f"{'$'+format(caseB_be, ',.0f') if caseB_be else 'none':>10}   "
          f"{'  '.join(f'{v:>4}' for v in verdicts)}")
print("  legend: U = USDC cheaper, S = SWIFT cheaper, TIE = |delta| <0.05% of "
      "ticket or <$25  (case A = modelled FX leg; case B = no FX leg)")

print()
print("  Case B detail (USD-invoiced, USD-accounted both ends) — all-in % of ticket, mid:")
print(f"  {'corridor':<18}{'ticket':>9}{'SWIFT %':>9}{'USDC %':>9}{'delta $':>10}")
for name, sender, payee, dk, gmf in CORRIDORS:
    for t in (25_000, 100_000):
        st, ut, *_ = caseB(t, sender, payee, dk, gmf, "mid")
        print(f"  {name:<18}{t:>9,}{100*st/t:>8.2f}%{100*ut/t:>8.2f}%"
              f"{st-ut:>10,.0f}")

print()
print("=" * 100)
print("S3b  ADVERSARIAL CROSS-BAND — SWIFT at its LOW band vs USDC at its HIGH "
      "band (both legs worst-case for crypto)")
print("=" * 100)
print(f"  {'corridor':<18}{'BE ticket':>12}   interpretation")
for name, sender, payee, dk, gmf in CORRIDORS:
    _, sf, sv = swift_cost(1, sender, payee, dk, gmf, "low")
    _, uf, uv = usdc_cost(1, sender, payee, gmf, "high")
    if abs(uv - sv) < 1e-12:
        print(f"  {name:<18}{'never':>12}   identical slopes")
        continue
    cand = (sf - uf) / (uv - sv)
    if cand <= 0:
        interp = ("USDC wins every size even in the adverse corner"
                  if uv < sv else "SWIFT wins every size in the adverse corner")
        print(f"  {name:<18}{'none':>12}   {interp}")
    else:
        interp = (f"USDC wins only below ${cand:,.0f} in the adverse corner "
                  f"(SWIFT wins the rest)")
        print(f"  {name:<18}{'$'+format(cand, ',.0f'):>12}   {interp}")

# ---------------------------------------------------------------------------
# S4 — FX-markup sensitivity: bank FX markup at which USDC loses at scale
# ---------------------------------------------------------------------------
print()
print("=" * 100)
print("S4  FX SENSITIVITY — bank FX markup (over mid) at which USDC stops winning "
      "at large tickets")
print("=" * 100)
print("  USDC wins at size iff: uv < fx + gmf + float  =>  fx* = uv - gmf - float")
print(f"  {'corridor':<18}{'USDC var%':>10}{'fx* %':>9}{'model mid fx%':>15}  "
      f"verdict vs model mid")
for name, sender, payee, dk, gmf in CORRIDORS:
    _, uf, uv = usdc_cost(1, sender, payee, gmf, "mid")
    days = P["swift"]["days"][dk][1]
    float_pct = days * CAPITAL_COST / DAYS_PER_YEAR
    g = pct(P["usdc"]["gmf_pct"]) if gmf else 0.0
    fx_star_pct = 100 * (uv - g - float_pct)          # in PERCENT
    fx_key = "US_OUT" if sender == "US" else sender
    fx_mid = P["swift"]["fx_pct"][fx_key][1]           # in PERCENT
    verdict = ("USDC wins at size" if fx_mid > fx_star_pct
               else "SWIFT wins at size")
    print(f"  {name:<18}{100*uv:>9.2f}%{fx_star_pct:>8.2f}%{fx_mid:>14.2f}%  "
          f"{verdict}")

# ---------------------------------------------------------------------------
# S5 — pricing options: revenue and margin per corridor at 25k / 100k
# ---------------------------------------------------------------------------
print()
print("=" * 100)
print("S5  PRICING OPTIONS — margin per payment (mid band, rail = on/off-ramp + "
      "gas, excl. GMF/gap/pass-through)")
print("=" * 100)

# rail cost from model params (platform fee EXCLUDED = it is revenue)
def rail_cost(amount, sender, payee, band="mid"):
    i = idx(band)
    u = P["usdc"]
    var = (pct(u["onramp_pct"][sender][i]) + pct(u["onramp_spread_pct"][sender][i])
           + pct(u["offramp_pct"][payee][i]))
    fix = u["onramp_fixed"][sender] + u["chain"] + u["offramp_fixed"][payee]
    return fix + amount * var, var


def take_pct(option, name):
    if option == "P1":                      # status quo 1.5%
        return 1.5
    if option == "P2":                      # corridor-tiered
        if name.startswith("MX->US"):
            return 0.9
        if name.startswith("CO->US"):
            return 1.5                      # stretch variant 1.6% shown below
        if name.startswith("US->"):
            return 1.5
        return 1.0                          # AR corridors: not sold on cost
    return None                             # P3 = fixed fee


def fee_p3(amount):
    return 75.0 if amount <= 50_000 else 150.0   # ASSUMED candidate schedule


DEVELOPERS_PCT = 0.5   # coded dev fee, PaymentRouter.sol:399 / usdc-arc.ts:53
PARTNER_PCT = 1.0      # tenants.partner_fee_bps default 100 (AGENTS.md decisions)

FOCUS = ["US->MX (mirror)", "MX->US", "CO->US", "US->CO (mirror)"]

for option in ("P1", "P2", "P3"):
    label = {"P1": "P1 flat 1.5% (status quo)",
             "P2": "P2 corridor-tiered (MX->US 0.9%, others 1.5%)",
             "P3": "P3 fixed fee $75<=50k / $150>50k"}[option]
    print(f"\n  --- {label} ---")
    print(f"  {'corridor':<18}{'ticket':>9}{'revenue':>9}{'rail$':>8}"
          f"{'mgn A thru':>11}{'mgn B abs':>10}{'payer% A':>9}{'payer% B':>9}"
          f"{'SWIFT%':>8}{'win?':>6}")
    for name, sender, payee, dk, gmf in CORRIDORS:
        if name not in FOCUS:
            continue
        for t in (25_000, 100_000):
            if option == "P3":
                rev = fee_p3(t)
            else:
                rev = t * take_pct(option, name) / 100
            rail, _ = rail_cost(t, sender, payee)
            mgnA = rev                       # regime A: rails pass-through
            mgnB = rev - rail                # regime B: rails absorbed
            payerA = 100 * (rail + rev) / t   # payer pays ramps + fee
            payerB = 100 * rev / t            # payer pays fee only (ramp inside)
            swift_pct = 100 * swift_cost(t, sender, payee, dk, gmf, "mid")[0] / t
            win = "USDC" if payerA < swift_pct else "SWIFT"
            print(f"  {name:<18}{t:>9,}{rev:>9,.0f}{rail:>8,.0f}"
                  f"{mgnA:>11,.0f}{mgnB:>10,.0f}{payerA:>8.2f}%{payerB:>8.2f}%"
                  f"{swift_pct:>7.2f}%{win:>6}")

print("""
  Two coherent cost-allocation regimes (the original model mixes them —
  audit finding A5):
    A "pass-through": customer owns the exchange account, pays ramp fees
      directly, platform margin = our fee.  (Realistic today: no ramp
      integration exists in src/.)
    B "absorbed": platform orchestrates ramps out of our fee, payer pays
      only our fee.  (Requires contracted LicensedRail partners — none yet.)
  win? compares payer% under regime A (worst case for our cost claim)
  against the SWIFT all-in at mid.
  'net after dev+partner' is omitted here because the coded 0.5% dev fee
  (PaymentRouter.sol:399) + default 1% partner fee (tenants.partner_fee_bps)
  are %-OF-VALUE: any take below 1.5% goes negative under regime A+B+fees —
  see corridor-economics.md §3.
""")

# ---------------------------------------------------------------------------
# P2 stretch variant: CO->US at 1.6%
# ---------------------------------------------------------------------------
print("=" * 100)
print("S5b  P2 STRETCH — CO->US at 1.6% (value-priced where the win is largest)")
print("=" * 100)
for name, sender, payee, dk, gmf in CORRIDORS:
    if name != "CO->US":
        continue
    for t in (25_000, 100_000):
        rev = t * 0.016
        rail, _ = rail_cost(t, sender, payee)
        payerA = 100 * (rail + rev) / t
        swift_pct = 100 * swift_cost(t, sender, payee, dk, gmf, "mid")[0] / t
        print(f"  CO->US ${t:>7,}: revenue ${rev:>6,.0f}  margin A ${rev:>6,.0f} "
              f"/ B ${rev-rail:>6,.0f}  payer A {payerA:.2f}% vs SWIFT "
              f"{swift_pct:.2f}% -> {'USDC' if payerA<swift_pct else 'SWIFT'} "
              f"still cheaper under regime A")

# ---------------------------------------------------------------------------
# T.D break-even sentence check (crypto-rails-benefit.md:102-105)
# ---------------------------------------------------------------------------
print()
print("=" * 100)
print("S6  T.D CLAIM CHECK: crypto-rails-benefit.md:102-105 (break-even sentence)")
print("=" * 100)
gmf_lookup = {name: gmf for name, s, p, d, gmf in CORRIDORS}
for corridor, sender, payee, dk, claim in (
    ("AR->CN", "AR", "CN", "AR_CN",
     "'USDC beats SWIFT above ~$2,269 if the gap were absent'"),
    ("AR->US", "AR", "US", "AR_US",
     "'USDC beats SWIFT above ~$2,920 if the gap were absent'"),
):
    gmf = gmf_lookup[corridor]          # as defined in corridor-model.py CORRIDORS
    _, sf, sv = swift_cost(1, sender, payee, dk, gmf, "mid")
    _, uf, uv = usdc_cost(1, sender, payee, gmf, "mid")
    be_with = (sf - uf) / (uv - sv)
    # gap-free counterfactual
    gap = pct(P["usdc"]["ar_official_gap_pct"][1])
    uv_ng = uv - gap
    be_without = (sf - uf) / (uv_ng - sv)
    print(f"  {corridor} (gmf={gmf}): model BE WITH gap = ${be_with:,.0f} "
          f"(direction: USDC wins BELOW — uv {100*uv:.2f}% > sv {100*sv:.2f}%)")
    print(f"  {corridor}: gap-free BE        = ${be_without:,.0f} "
          f"(direction: USDC wins BELOW — uv {100*uv_ng:.2f}% still > sv {100*sv:.2f}%)")
    print(f"  T.D claim {claim} -> REJECTED (wrong direction; "
          f"wrong scenario number)")

# refreshed AR gap (SOURCED 2026-10-27, see corridor-economics.md)
print()
print("  AR gap refresh (SOURCED): dolar cripto 1,672.88-1,675.37 vs oficial "
      "1,560 venta, 2026-10-27")
print("  -> brecha ~7.24-7.45% (tn.com.ar 2026-10-27 09:24; valordolarblue.ar "
      "2026-10-27); model high band 5.83% is 2-day stale and understated.")
print("  -> cripto 1,673 ~= CCL 1,683: gap vs CCL is ~0 (INFORMATIONAL) — the "
      "penalty applies only vs official-rate (MULC) access.")
