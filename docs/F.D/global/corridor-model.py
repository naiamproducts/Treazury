#!/usr/bin/env python3
"""
Treazury — corridor cost model (F.D/global)
Reproduces every number in corridor-economics.md.

Every parameter is labelled in PARAMS:
  CITED    -> has a URL/path:line in the doc's source table
  ASSUMED  -> INFORMATIONAL estimate, range given

Run: python3 docs/F.D/global/corridor-model.py
"""

TICKETS = (25_000, 100_000)
CAPITAL_COST = 0.10          # ASSUMED: annual cost of capital for an SME payer
DAYS_PER_YEAR = 365

# ---------------------------------------------------------------------------
# PARAMS: (low, mid, high)
# ---------------------------------------------------------------------------
P = {
    "swift": {
        # sender bank outgoing international wire, USD (CITED low end: BofA $45,
        # Chase $40, Wells $30; LatAm bank schedules assumed similar or higher)
        "sender_fee": {
            "AR": (35, 45, 60),
            "MX": (25, 35, 50),
            "CO": (30, 40, 60),
            "US": (30, 45, 60),
        },
        # FX margin charged by the bank on the conversion. CITED range 2-4%
        # (banks), 1.5-3% major pairs, 3-5% USD/MXN; AR official market tighter.
        "fx_pct": {
            "AR": (0.5, 1.5, 3.0),
            "MX": (1.5, 2.25, 3.0),
            "CO": (2.0, 3.0, 4.0),
            "US_OUT": (1.5, 2.5, 4.0),   # USD -> MXN/COP/ARS at beneficiary bank
        },
        # correspondent / intermediary bank, USD, usually DEDUCTED from principal
        # under SHA (CITED: charge-bearer mechanics; amount is ASSUMED)
        "intermediary": (0, 20, 40),
        # beneficiary bank incoming international wire fee (CITED: BofA $15 incoming)
        "beneficiary": {
            "US": (0, 15, 25),
            "CN": (7, 18, 30),
            "MX": (0, 15, 25),
            "CO": (0, 15, 25),
            "AR": (0, 15, 25),
        },
        # settlement days used for float cost (BIS: median <2h fast routes,
        # >2 days slow routes).  ASSUMED per corridor.
        "days": {
            "AR_CN": (2, 3, 5),
            "AR_US": (1.5, 2, 4),
            "MX_US": (1.5, 2, 4),
            "CO_US": (1.5, 2, 4),
            "US_MX": (1.5, 2.5, 5),
            "US_CO": (1.5, 2.5, 5),
            "US_AR": (2, 3, 6),
        },
        # payment repairs / shortfall gross-up when the invoice must arrive in
        # full (OUR) or the supplier re-invoices. ASSUMED.
        "repair": (0, 30, 80),
    },
    "usdc": {
        # local-currency -> USDC at a licensed exchange/VASP, published retail
        # taker schedule (CITED: bitso.com/fees, accessed 2026-10-25)
        "onramp_pct": {
            "AR": (0.45, 0.45, 0.60),    # 24-81M ARS tier at $25k; 0.60% <$1k
            "MX": (0.585, 0.728, 0.780),  # floor 0.585% >5M MXN, 0.728% 0.5-1M MXN
            "CO": (0.170, 0.470, 0.650),  # 0.47% at 75-150M COP
            "US": (0.0, 0.0, 0.0),        # Circle Mint: no fee to tokenize USD (CITED)
        },
        # market spread around the exchange quote (not published). ASSUMED.
        "onramp_spread_pct": {"AR": (0.05, 0.15, 0.30), "MX": (0.05, 0.15, 0.30),
                              "CO": (0.10, 0.20, 0.40), "US": (0.0, 0.0, 0.0)},
        # AR only: USDC is bought at the "dolar cripto" rate, not the official
        # MULC rate.  Live gap 2026-10-25: 1640.38 vs 1550.00 = 5.83% (CITED).
        # Range starts at 0 for payers with no MULC access (counterfactual = CCL).
        "ar_official_gap_pct": (0.0, 3.0, 5.83),
        "onramp_fixed": {"AR": 0, "MX": 0, "CO": 0, "US": 15},  # USD wire into Circle
        "chain": 0.02,          # ASSUMED L2/Arc-mainnet-equivalent gas per transfer
        "treazury_pct": 1.5,    # CITED src/modules/payments/providers/usdc-arc.ts:52-53
        "gmf_pct": 0.4,         # CO only, CITED DIAN art.870-881 — applies to BOTH paths
        # off-ramp to the destination account: partner fee + spread, blended
        "offramp_pct": {
            "US": (0.0, 0.05, 0.30),   # Circle standard 0% / express 0.05% (CITED)
            "CN": (0.40, 0.80, 1.50),  # no CN VASP at scale; HK/offshore USD route. ASSUMED
            "MX": (0.130, 0.260, 0.728),  # Bitso MXN taker by volume + SPEI free (CITED)
            "CO": (0.170, 0.470, 0.650),  # Bitso COP taker (CITED) + local rail
            "AR": (0.200, 0.450, 0.600),  # Bitso ARS taker (CITED)
        },
        "offramp_fixed": {"US": 5, "CN": 15, "MX": 0, "CO": 2, "AR": 2},
    },
}

CORRIDORS = [
    # name, sender ccy, payer country, payee country (off-ramp target), days key, gmf?
    ("AR->CN", "AR", "CN", "AR_CN", False),
    ("MX->US", "MX", "US", "MX_US", False),
    ("CO->US", "CO", "US", "CO_US", True),
    ("AR->US", "AR", "US", "AR_US", False),
    # mirror: US payer -> LatAm exporter (the direction Treazury's landing sells)
    ("US->MX (mirror)", "US", "MX", "US_MX", False),
    ("US->CO (mirror)", "US", "CO", "US_CO", True),
    ("US->AR (mirror)", "US", "AR", "US_AR", False),
]


def idx(k):
    return {"low": 0, "mid": 1, "high": 2}[k]


def pct(v):
    return v / 100.0


def swift_cost(amount, sender, payee, days_key, gmf, band):
    i = idx(band)
    s = P["swift"]
    fx_key = "US_OUT" if sender == "US" else sender
    fx = pct(s["fx_pct"][fx_key][i])
    days = s["days"][days_key][i]
    variable = fx + (pct(P["usdc"]["gmf_pct"]) if gmf else 0.0)
    fixed = s["sender_fee"][sender][i] + s["intermediary"][i] + s["beneficiary"][payee][i] + s["repair"][i]
    float_pct = days * CAPITAL_COST / DAYS_PER_YEAR
    total = fixed + amount * (variable + float_pct)
    return total, fixed, variable + float_pct


def usdc_cost(amount, sender, payee, gmf, band):
    i = idx(band)
    u = P["usdc"]
    onramp = pct(u["onramp_pct"][sender][i]) + pct(u["onramp_spread_pct"][sender][i])
    gap = pct(u["ar_official_gap_pct"][i]) if sender == "AR" else 0.0
    offramp = pct(u["offramp_pct"][payee][i])
    variable = onramp + gap + pct(u["treazury_pct"]) + offramp + (pct(u["gmf_pct"]) if gmf else 0.0)
    fixed = u["onramp_fixed"][sender] + u["chain"] + u["offramp_fixed"][payee]
    total = fixed + amount * variable
    return total, fixed, variable


def fmt(x):
    return f"{x:,.0f}"


print("=" * 96)
print("ALL-IN COST — mid assumptions (USD, and % of ticket)")
print("=" * 96)
print(f"{'corridor':<18}{'ticket':>9}{'SWIFT $':>11}{'SWIFT %':>9}{'USDC $':>10}{'USDC %':>8}"
      f"{'delta $':>10}{'delta pp':>10}")
rows = []
for name, sender, payee, dk, gmf in CORRIDORS:
    for amount in TICKETS:
        s_tot, s_fix, s_var = swift_cost(amount, sender, payee, dk, gmf, "mid")
        u_tot, u_fix, u_var = usdc_cost(amount, sender, payee, gmf, "mid")
        s_p, u_p = 100 * s_tot / amount, 100 * u_tot / amount
        rows.append((name, amount, s_tot, s_p, u_tot, u_p, s_tot - u_tot, s_p - u_p))
        print(f"{name:<18}{fmt(amount):>9}{fmt(s_tot):>11}{s_p:>8.2f}%{fmt(u_tot):>10}{u_p:>7.2f}%"
              f"{fmt(s_tot - u_tot):>10}{s_p - u_p:>+9.2f}")

print()
print("=" * 96)
print("LOW/HIGH BANDS (all-in % of ticket)")
print("=" * 96)
print(f"{'corridor':<18}{'ticket':>9}   {'SWIFT low-mid-high':<24}{'USDC low-mid-high':<24}{'verdict'}")
for name, sender, payee, dk, gmf in CORRIDORS:
    for amount in TICKETS:
        sp = [100 * swift_cost(amount, sender, payee, dk, gmf, b)[0] / amount for b in ("low", "mid", "high")]
        up = [100 * usdc_cost(amount, sender, payee, gmf, b)[0] / amount for b in ("low", "mid", "high")]
        d = sp[1] - up[1]          # positive => USDC cheaper on mid
        if up[2] < sp[0] - 0.10:
            v = "USDC wins in every band"
        elif up[0] > sp[2] + 0.10:
            v = "SWIFT wins in every band"
        elif abs(d) < 0.35:
            v = "TIE on mid"
        elif d > 0:
            v = "USDC cheaper on mid (bands overlap)"
        else:
            v = "SWIFT cheaper on mid (bands overlap)"
        print(f"{name:<18}{fmt(amount):>9}   "
              f"{sp[0]:.2f}/{sp[1]:.2f}/{sp[2]:.2f}%".ljust(24) +
              f"{up[0]:.2f}/{up[1]:.2f}/{up[2]:.2f}%".ljust(24) + v)

print()
print("=" * 96)
print("BREAK-EVEN TICKET (where USDC all-in % == SWIFT all-in %) — mid bands")
print("=" * 96)
for name, sender, payee, dk, gmf in CORRIDORS:
    _, sf, sv = swift_cost(1, sender, payee, dk, gmf, "mid")
    _, uf, uv = usdc_cost(1, sender, payee, gmf, "mid")
    if abs(uv - sv) < 1e-9:
        print(f"{name:<18} never (identical slopes)")
        continue
    amt = (sf - uf) / (uv - sv)
    if amt <= 0:
        print(f"{name:<18} no positive break-even (USDC % is {'higher' if uv>sv else 'lower'} at every size)")
    else:
        print(f"{name:<18} ${fmt(amt)}")

print()
print("=" * 96)
print("FIXED-COMPONENT NOISE FLOOR: ticket at which fixed fees fall below 0.10%")
print("=" * 96)
for name, sender, payee, dk, gmf in CORRIDORS:
    s_tot, s_fix, _ = swift_cost(1, sender, payee, dk, gmf, "mid")
    u_tot, u_fix, _ = usdc_cost(1, sender, payee, gmf, "mid")
    print(f"{name:<18} SWIFT fixed ${s_fix:>5.0f} -> ${fmt(s_fix/0.001):>10}"
          f"   USDC fixed ${u_fix:>6.2f} -> ${fmt(u_fix/0.001):>10}")

print()
print("=" * 96)
print("TREAZURY MARGIN PER PAYMENT (mid) — revenue 1.5%, partner commission 1% scenarios")
print("=" * 96)
for amount in TICKETS:
    rev = amount * 0.015
    print(f"\nticket ${fmt(amount)}: gross platform revenue ${fmt(rev)}")
    for corr, cost in (("USD-holder -> MX (best)", 0.26 + 0.10 + 0.02),
                       ("USD-holder -> AR", 0.45 + 0.10 + 0.02),
                       ("local-ccy -> US (MX on-ramp)", 0.728 + 0.15 + 0.05 + 0.02),
                       ("local-ccy -> CN", 0.45 + 0.15 + 0.80 + 0.02)):
        partner_cost = amount * cost / 100
        gm = rev - partner_cost
        partner_comm = amount * 0.01
        print(f"  {corr:<34} rail cost ${fmt(partner_cost):>7} "
              f"({cost:.2f}%)  GM ${fmt(gm):>7} ({100*gm/amount:.2f}%)"
              f"  | after 1% partner commission ${fmt(gm - partner_comm):>7}"
              f" ({100*(gm-partner_comm)/amount:.2f}%)")

print()

print()
print("=" * 96)
print("AR STRESS: payer WITHOUT MULC access (official-rate gap removed)")
print("=" * 96)
for name, sender, payee, dk, gmf in CORRIDORS:
    if sender != "AR":
        continue
    for amount in TICKETS:
        u_tot, _, _ = usdc_cost(amount, sender, payee, gmf, "mid")
        gap = amount * pct(P["usdc"]["ar_official_gap_pct"][1])
        u_no_gap = u_tot - gap
        s_tot, _, _ = swift_cost(amount, sender, payee, dk, gmf, "mid")
        print(f"{name:<12} ${fmt(amount):>7}  SWIFT {100*s_tot/amount:>5.2f}%  "
              f"USDC-with-gap {100*u_tot/amount:>5.2f}%  USDC-no-gap {100*u_no_gap/amount:>5.2f}%")

print()
print("=" * 96)
print("EFFECT OF DEDUCTING THE FEE FROM PRINCIPAL (invoice must arrive in full)")
print("=" * 96)
for take in (1.5, 2.5):
    print(f"take {take}% deducted -> gross-up {100*take/(100-take):.3f}% of ticket")

print()
print("=" * 96)
print("PRICE STRUCTURE E — rail cost pass-through + 0.4% + $20")
print("=" * 96)
for label, cost_pct in (("US->MX  (rail 0.38%)", 0.38), ("US->AR  (rail 0.57%)", 0.57),
                        ("MX->US  (rail 0.95%)", 0.95), ("AR->CN  (rail 1.42%)", 1.42)):
    for amount in TICKETS:
        charge = amount * (cost_pct + 0.4) / 100 + 20
        print(f"{label:<22} ${fmt(amount):>7}  payer pays ${fmt(charge):>7} "
              f"({100*charge/amount:>5.2f}%)  Treazury gross ${fmt(amount*0.004+20):>6}")

print("=" * 96)
print("PRICE STRUCTURE SCENARIOS — revenue and margin per payment")
print("=" * 96)
structs = {
    "A flat 1.5%": lambda a: a * 0.015,
    "B tiered 1.5/1.0/0.6% (<=10k/10-50k/>50k)": lambda a: a * (0.015 if a <= 10_000 else 0.010 if a <= 50_000 else 0.006),
    "C 0.45% + $25 fixed": lambda a: a * 0.0045 + 25,
    "D 0.9% with $40 floor / $450 cap": lambda a: max(40, min(a * 0.009, 450)),
}
for amount in (5_000, 25_000, 100_000):
    print(f"\nticket ${fmt(amount)}")
    for label, fn in structs.items():
        r = fn(amount)
        print(f"  {label:<44} ${fmt(r):>7}  ({100*r/amount:.2f}%)")
