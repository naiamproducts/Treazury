#!/usr/bin/env python3
"""
Treazury — rent decomposition engine (F.D/ar)
=============================================
Companion to docs/F.D/ar/rent-decomposition.md. Decomposes the CURRENT-regime
all-in SWIFT/correspondent cost of the AR corridors (mid band) into:

  (a) genuine service cost  — processing, compliance, fraud, technology,
      capital required by the architecture/regulation
  (b) rent / margin capture  — correspondent markup, nostro float premium,
      FX spread above the COMPETITIVE benchmark, fee margin

Benchmarks (all SOURCED — see the .md sources block):
  BIS WP 1385 (Du/Huang/Scharfstein, 2026-10-19, bis.org):
    - bank FX markup alone ~200-400 bps even on liquid pairs (Adrian and Yogo
      discussions, BIS Annual Conference 2026-06); sample range 2-4.7%
    - fintech MTO all-in 40-150 bps, bottom of range at >= $10k tickets
    - Wise marginal cost table (WP 1385 Table 14, via blindpay.com):
      GBP->EUR fixed marginal cost GBP 0.24 = rail (bank fees+treasury+FX)
      GBP 0.02 + support GBP 0.11 + compliance GBP 0.06; variable 0.06%
    - wholesale FX major pairs 6-9 bps (BIS RT survey 2025 via Yogo)

The split of each modelled component into service vs rent uses stated
ASSUMPTIONS (benchmarked, not measured for AR banks) — every dollar here is
INFORMATIONAL. The SCRIPT only makes the arithmetic reproducible.

Run:  python3 docs/F.D/ar/rent-decomposition.py
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

P = cm.P
pct = cm.pct
CAPITAL_COST, DAYS_PER_YEAR = cm.CAPITAL_COST, cm.DAYS_PER_YEAR

TICKETS = (25_000, 100_000)

# --- ASSUMED benchmarks (see .md for why each is defensible) ---------------
FX_SERVICE_BPS = 60      # competitive all-in conversion benchmark: fintech MTO
                         # low end at >=$10k tickets (BIS WP 1385 via
                         # poundsterlinglive 2026-10-22). Includes the
                         # operator's normal margin, i.e. "rent-free" price.
WIRE_FEE_SERVICE = 20.0  # $ of the $45 sender fee treated as true marginal
                         # processing+compliance recovery (Wise marginal cost
                         # is GBP 0.24 fixed + 0.06%; banks' fixed fees carry
                         # large margin). ASSUMED split.
INTERMEDIARY_SERVICE = 10.0   # of the $20 mid intermediary: processing share;
                              # markup share is rent (BIS: fees accumulate
                              # at every intermediary). ASSUMED 50/50.
BENEFICIARY_SERVICE = 8.0     # of the $15 beneficiary fee. ASSUMED.
# float and repair stay ENTIRELY on the service/cost side (capital cost of
# the correspondent architecture; expected-value friction of failed payments).
# That is a deliberate, generous-to-banks choice — sensitivity below shows the
# opposite corner.

# --- SOURCED rates for the off-wire brecha transfer (2026-10-27) -----------
# BCRA promedio venta 1,559.939 (cotizacion-dolar.com.ar, 2026-10-27);
# BNA venta 1,560.00 (same); dolar cripto 1,672.88-1,675.37 (tn.com.ar
# 2026-10-27 09:24; valordolarblue.ar). Mid cripto 1,674.13.
OFICIAL_VENTA = 1_559.939
cripto_lo, cripto_hi = 1_672.88, 1_675.37
CRIPTO_MID = (cripto_lo + cripto_hi) / 2

CORR = {
    "AR->US": ("AR", "US", "AR_US", False),
    "AR->CN": ("AR", "CN", "AR_CN", False),
}


def decompose(name, amount):
    sender, payee, days_key, gmf = CORR[name]
    i = 1  # mid
    s = P["swift"]
    fx = amount * pct(s["fx_pct"][sender][i])
    wire = s["sender_fee"][sender][i]
    inter = s["intermediary"][i]
    benef = s["beneficiary"][payee][i]
    repair = s["repair"][i]
    days = s["days"][days_key][i]
    flt = amount * days * CAPITAL_COST / DAYS_PER_YEAR
    total = fx + wire + inter + benef + repair + flt

    fx_service = amount * FX_SERVICE_BPS / 10_000
    fx_rent = fx - fx_service
    service = fx_service + WIRE_FEE_SERVICE + INTERMEDIARY_SERVICE \
        + BENEFICIARY_SERVICE + repair + flt
    rent = fx_rent + (wire - WIRE_FEE_SERVICE) \
        + (inter - INTERMEDIARY_SERVICE) + (benef - BENEFICIARY_SERVICE)
    assert abs(service + rent - total) < 1e-6
    return dict(total=total, fx=fx, wire=wire, inter=inter, benef=benef,
                repair=repair, flt=flt, service=service, rent=rent,
                days=days)


print("=" * 100)
print("A. WIRE-STACK DECOMPOSITION — CURRENT REGIME, mid band "
      "(all INFORMATIONAL; benchmarks SOURCED — see .md)")
print("=" * 100)
print(f"{'corridor':<8}{'ticket':>9}{'total $':>9}{'total %':>8}"
      f"{'service $':>11}{'service %':>10}{'rent $':>10}{'rent %':>8}")
res = {}
for name in CORR:
    for t in TICKETS:
        d = decompose(name, t)
        res[(name, t)] = d
        print(f"{name:<8}{t:>9,}{d['total']:>9,.0f}{100*d['total']/t:>7.2f}%"
              f"{d['service']:>11,.0f}{100*d['service']/t:>9.1f}%"
              f"{d['rent']:>10,.0f}{100*d['rent']/t:>7.1f}%")

print()
print("component detail (mid band):")
for name in CORR:
    for t in TICKETS:
        d = res[(name, t)]
        print(f"  {name} ${t:>7,}: fx ${d['fx']:>6,.0f} (svc "
              f"${d['fx']*FX_SERVICE_BPS/150:,.0f}/rent "
              f"${d['fx']-d['fx']*FX_SERVICE_BPS/150:,.0f})  wire "
              f"${d['wire']:.0f}  interm ${d['inter']:.0f}  benef "
              f"${d['benef']:.0f}  float ${d['flt']:.1f} ({d['days']}d @10%/yr)"
              f"  repair ${d['repair']:.0f}")

# ---------------------------------------------------------------------------
print()
print("=" * 100)
print("B. SENSITIVITY — SERVICE share of the all-in (rent = 100% - service; "
      "corners differ in where the FX markup and fee margins land)")
print("=" * 100)
variants = {
    "central (fx-svc=60bps; float+repair=cost)": (60, 20.0, 10.0, 8.0, True, True),
    "all fx markup = rent; wire/interm/benef = service": (0, 45.0, 20.0, 15.0, False, False),
    "fx-svc=wholesale 8bps; fees fully service": (8, 45.0, 20.0, 15.0, False, False),
    "fx-svc=150bps (fintech top); fees fully service": (150, 45.0, 20.0, 15.0, False, False),
}
print(f"{'variant':<54}{'AR->US 25k':>11}{'AR->US 100k':>13}"
      f"{'AR->CN 25k':>11}{'AR->CN 100k':>13}")
for label, (fxs, wsvc, isvc, bsvc, flt_svc, rep_svc) in variants.items():
    cells = []
    for name in CORR:
        for t in TICKETS:
            d = decompose(name, t)
            fx_svc = t * fxs / 10_000
            svc = fx_svc + wsvc + isvc + bsvc
            if flt_svc:
                svc += d["flt"]
            if rep_svc:
                svc += d["repair"]
            cells.append(100 * svc / d["total"])
    print(f"{label:<54}{cells[0]:>10.0f}%{cells[1]:>12.0f}%"
          f"{cells[2]:>10.0f}%{cells[3]:>12.0f}%")

# ---------------------------------------------------------------------------
print()
print("=" * 100)
print("C. THE OFF-WIRE RENT — brecha transfer under the current regime "
      "(SOURCED rates, 2026-10-27; mapping INFORMATIONAL)")
print("=" * 100)
brecha_vs_oficial = 100 * (CRIPTO_MID / OFICIAL_VENTA - 1)
surrender_loss = 100 * (1 - OFICIAL_VENTA / CRIPTO_MID)
print(f"  oficial venta {OFICIAL_VENTA:,.2f}  |  cripto mid "
      f"{CRIPTO_MID:,.2f} ({cripto_lo:.2f}-{cripto_hi:.2f})")
print(f"  brecha cripto vs oficial: +{brecha_vs_oficial:.2f}% "
      f"(oficial-denominated convention — the quoted 'brecha')")
print(f"  exporter surrender loss (share of market USD value given up when "
      f"liquidating at oficial): {surrender_loss:.2f}%")
for t in TICKETS:
    print(f"    on a ${t:>7,} export collection: ${t*surrender_loss/100:>8,.0f} "
          f"of market value surrendered to the official-rate channel "
          f"(vs ${t*brecha_vs_oficial/100:,.0f} in the +brecha convention)")
print("  vs the wire-stack rent above (fx-rent + fee margins):")
for name in CORR:
    d = res[(name, TICKETS[0])]
    print(f"    {name} $25k wire rent = ${d['rent']:,.0f} "
          f"({100*d['rent']/TICKETS[0]:.2f}% of ticket)")
print("  => the off-wire brecha transfer (~6.8-7.4% of notional) is ~5-10x "
      "the on-wire rent — but it is an OPPORTUNITY COST of the exporter "
      "(and a SUBSIDY to official-rate access holders), not a fee on the "
      "wire line. Invisible in any SWIFT-cost table.")
