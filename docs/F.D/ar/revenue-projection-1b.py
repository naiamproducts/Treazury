#!/usr/bin/env python3
"""Revenue projection on USD 1,000M/yr of AR import payments — reproduces
every table in docs/F.D/ar/revenue-projection-1b.md (aven).

All model cells are INFORMATIONAL by construction: they are arithmetic over
STATED distributions and the founder-ratified P3 schedule. Inputs carry their
tag in the report's input ledger.

Run: python3 docs/F.D/ar/revenue-projection-1b.py
"""

# ---------------------------------------------------------------- P3 (ratified)
# corridor-economics.md:291 — $75 per settlement <= $50k, $150 above.
P3_LOW, P3_HIGH, TIER = 75.0, 150.0, 50_000.0
P3_COUNTERFACTUAL = 0.015  # 1.5% fee-on-value — NOT lawful in AR; counterfactual only

# ------------------------------------------------- ticket distributions (stated)
# A: ICP-typical (corridors.md:179-182 range $15k-200k), mean pinned near $50k
DIST_A = [  # (count share, low $, high $, bucket mean $)
    (0.30, 15_000, 30_000, 22_000),
    (0.35, 30_000, 50_000, 38_000),
    (0.25, 50_000, 100_000, 70_000),
    (0.10, 100_000, 200_000, 125_000),
]
# B: small-ticket heavy (stress case, extends below the ICP floor)
DIST_B = [
    (0.45, 3_000, 15_000, 8_000),
    (0.30, 15_000, 30_000, 22_000),
    (0.20, 30_000, 50_000, 40_000),
    (0.05, 50_000, 150_000, 85_000),
]

VOLUMES = [250e6, 500e6, 1_000e6]

# --------------------------------------------------------------- market sizing
INDEC_IMPORTS_2025 = 75_791e6        # SOURCED INDEC ICA 2026-01-20
INDEC_JAN_SEP_2026 = 56_069e6        # SOURCED INDEC ICA 2026-10-19
INDEC_OCT_DEC_2025 = (7_150 + 5_598 + 5_556) * 1e6  # SOURCED ICA monthly table
MULC_2025 = sum([6_189, 4_800, 5_752, 5_908, 6_149, 5_745,
                 6_289, 5_755, 5_850, 6_067, 4_353, 5_692]) * 1e6  # BCRA via monitorargy
MULC_JAN_AUG_2026 = sum([4_800, 4_048, 5_592, 5_380, 4_975,
                          6_420, 5_997, 5_618]) * 1e6               # BCRA via monitorargy
IMPORT_OPS_12M = 1_917_471            # SUSPICIOUS — aimport.ar (ARCA-derived), Oct25-Sep26
IMPORTS_12M = INDEC_OCT_DEC_2025 + INDEC_JAN_SEP_2026

# ------------------------------------------------------------------ cost inputs
FIXED_OPEX = {"low": 60_000, "mid": 180_000, "high": 400_000}   # ASSUMED range
VAR = {"gas": 0.02, "compliance_low": 0.08, "compliance_high": 1.00,
       "support": 0.14}                                          # benchmark/ASSUMED
DEV_FEE_BPS, PARTNER_FEE_BPS = 50, 100    # SOURCED usdc-arc.ts:52-53, AGENTS.md:154
CAP_NET_WORTH = (35_000, 75_000, 150_000)  # SOURCED L.D/ar/profile.md:71 (RG 1172/2026)
CAP_CHARGE_RATE = 0.10                    # ASSUMED (corridor-model.py:14)


def mean_of(dist):
    return sum(s * m for s, _, _, m in dist)


def p3_revenue(volume, dist):
    """P3 revenue = count of payments x blended fixed fee. Returns breakdown."""
    mean = mean_of(dist)
    n = volume / mean
    lo = sum(s for s, _, hi, _ in dist if hi <= TIER)   # share <= $50k
    hi = 1.0 - lo
    n_lo, n_hi = n * lo, n * hi
    rev_lo, rev_hi = n_lo * P3_LOW, n_hi * P3_HIGH
    blended = rev_lo + rev_hi
    return dict(mean=mean, n=n, share_lo=lo, share_hi=hi, n_lo=n_lo, n_hi=n_hi,
                rev=blended, blended_fee=blended / n, take=blended / volume)


def contribution(dist, regime):
    """Per-payment contribution under three fee-stack regimes (regime A = pass-through)."""
    mean = mean_of(dist)
    lo = sum(s for s, _, hi, _ in dist if hi <= TIER)
    fee = lo * P3_LOW + (1 - lo) * P3_HIGH
    var_low = VAR["gas"] + VAR["compliance_low"] + VAR["support"]
    var_high = VAR["gas"] + VAR["compliance_high"] + VAR["support"]
    if regime == "A":          # invoiced P3 fee, rails pass-through, stack restructured
        return fee - var_high, fee - var_low
    if regime == "A_stack":    # P3 fee BUT router sweep kept: dev 0.5% on value
        c = fee - var_low - mean * DEV_FEE_BPS / 10_000
        return c, c
    if regime == "A_referred":  # dev 0.5% + partner 1.0% both on value
        c = fee - var_low - mean * (DEV_FEE_BPS + PARTNER_FEE_BPS) / 10_000
        return c, c
    if regime == "B":          # rails absorbed (on-ramp 0.45-0.60% + off-ramp 0.05-0.30%)
        rail_lo = mean * (0.0045 + 0.0005)
        rail_hi = mean * (0.0060 + 0.0030)
        return fee - var_low - rail_hi, fee - var_low - rail_lo
    raise ValueError(regime)


def main():
    print("=" * 78, "\n1. MARKET SIZING (arithmetic over SOURCED inputs)\n", "=" * 78)
    print(f"INDEC goods imports 2025:            ${INDEC_IMPORTS_2025/1e9:,.3f}B")
    print(f"INDEC goods imports Jan-Sep 2026:    ${INDEC_JAN_SEP_2026/1e9:,.3f}B (-2.5% y/y)")
    print(f"INDEC goods imports Oct25-Sep26:     ${IMPORTS_12M/1e9:,.3f}B "
          f"(= {INDEC_OCT_DEC_2025/1e9:.3f} + {INDEC_JAN_SEP_2026/1e9:.3f})")
    print(f"2026 annualised (Jan-Sep x 12/9):    ${INDEC_JAN_SEP_2026/9*12/1e9:,.3f}B")
    print(f"MULC import payments 2025 (sum):     ${MULC_2025/1e9:,.3f}B")
    print(f"MULC import payments Jan-Aug 2026:   ${MULC_JAN_AUG_2026/1e9:,.3f}B "
          f"-> annualised ${MULC_JAN_AUG_2026/8*12/1e9:,.3f}B")
    print(f"USD 1000M as share of MULC 2025:     {1e9/MULC_2025*100:,.2f}%")
    print(f"USD 1000M as share of 12m goods imp: {1e9/IMPORTS_12M*100:,.2f}%")
    print(f"USD 1000M as share of 2026 MULC ann: {1e9/(MULC_JAN_AUG_2026/8*12)*100:,.2f}%")
    print(f"SUSPICIOUS cross-check: {IMPORT_OPS_12M:,} ARCA import ops over the same "
          f"12m ->\n  implied avg operation ${IMPORTS_12M/IMPORT_OPS_12M:,.0f} "
          f"(${IMPORTS_12M/1e6/IMPORT_OPS_12M*1e6:,.0f} FOB per op)")

    for name, dist in (("A", DIST_A), ("B", DIST_B)):
        print("=" * 78, f"\n2. WATERFALL + P3 REVENUE — distribution {name}\n", "=" * 78)
        print(f"mean ticket ${mean_of(dist):,.0f} | share <=$50k "
              f"{sum(s for s,_,hi,_ in dist if hi <= TIER)*100:.0f}%")
        print(f"{'volume':>10} {'payments':>10} {'<=50k n':>10} {'>50k n':>9} "
              f"{'P3 rev':>10} {'$/pay':>7} {'eff%':>7} {'1.5% ctf':>10}")
        for v in VOLUMES:
            r = p3_revenue(v, dist)
            print(f"${v/1e6:>7,.0f}M {r['n']:>10,.0f} {r['n_lo']:>10,.0f} "
                  f"{r['n_hi']:>9,.0f} ${r['rev']:>9,.0f} ${r['blended_fee']:>6,.2f} "
                  f"{r['take']*100:>6.3f}% ${v*P3_COUNTERFACTUAL:>9,.0f}")
            assert abs(r["rev"] - (r["n_lo"]*P3_LOW + r["n_hi"]*P3_HIGH)) < 1e-6
        # explicit worked example at $1000M
        r = p3_revenue(1e9, dist)
        print(f"worked: 1e9/{mean_of(dist):,.0f} = {r['n']:,.0f} pay; "
              f"{r['n']:,.0f}x({r['share_lo']*100:.0f}%x$75 + {r['share_hi']*100:.0f}%x$150) "
              f"= {r['n']:,.0f}x${r['blended_fee']:,.2f} = ${r['rev']:,.0f}")

    print("=" * 78, "\n3. COUNTERFactual + headline checks\n", "=" * 78)
    r = p3_revenue(1e9, DIST_A)
    print(f"P3 at $1000M dist A: ${r['rev']:,.0f}/yr = {r['rev']/15e6*100:.1f}% of the "
          f"$15,000,000 a 1.5% fee would have produced (NOT lawful in AR)")
    r = p3_revenue(1e9, DIST_B)
    print(f"P3 at $1000M dist B: ${r['rev']:,.0f}/yr = {r['rev']/15e6*100:.1f}% of ctf")
    # volume needed for $10M/yr under A
    fee_a = 0.65*P3_LOW + 0.35*P3_HIGH
    n10 = 10e6 / fee_a
    print(f"$10M/yr at P3 needs dist-A blended fee ${fee_a:,.2f} -> {n10:,.0f} payments/yr"
          f" -> ${n10*mean_of(DIST_A)/1e9:,.3f}B volume "
          f"({n10*mean_of(DIST_A)/IMPORTS_12M*100:.1f}% of 12m AR imports)")

    print("=" * 78, "\n4. COST / CONTRIBUTION / BREAK-EVEN\n", "=" * 78)
    for name, dist in (("A", DIST_A), ("B", DIST_B)):
        mean = mean_of(dist)
        print(f"-- dist {name} (mean ${mean:,.0f})")
        for regime in ("A", "A_stack", "A_referred", "B"):
            c_hi, c_lo = contribution(dist, regime)   # (worst, best)
            tag = {"A": "restructured pass-through",
                   "A_stack": "pass-through + dev 0.5% sweep kept",
                   "A_referred": "pass-through + dev 0.5% + partner 1.0%",
                   "B": "rails absorbed"}[regime]
            print(f"   {regime:<11} contribution/pay ${c_lo:>9,.2f} .. ${c_hi:>9,.2f}  ({tag})")
        c_best, _ = contribution(dist, "A")           # (worst var, best var)
        c_mid = (c_best + contribution(dist, "A")[1]) / 2
        for k, fixed in FIXED_OPEX.items():
            pay_needed = fixed / (fee := contribution(dist, "A")[1])
            be_vol = pay_needed * mean
            print(f"   break-even fixed={k} ${fixed:,}: {pay_needed:,.0f} payments/yr"
                  f" -> ${be_vol/1e6:,.1f}M volume (best-case var ${fee:,.2f}/pay)")
        # as-coded stack break-even: contribution <= 0 -> none
        assert contribution(dist, "A_stack")[1] < 0 and contribution(dist, "A_referred")[1] < 0
        print("   as-coded stacks: contribution < 0 -> NO break-even at any volume")
        # PSAV capital charge
        for floor in CAP_NET_WORTH:
            print(f"   PSAV net-worth floor ${floor:,} @ {CAP_CHARGE_RATE:.0%}/yr"
                  f" = ${floor*CAP_CHARGE_RATE:,.0f}/yr = "
                  f"{floor*CAP_CHARGE_RATE/1e9*100:.5f}% of $1000M volume "
                  f"({floor*CAP_CHARGE_RATE/p3_revenue(1e9, dist)['rev']*100:.2f}% of P3 revenue)")

    print("=" * 78, "\n5. SENSITIVITY (others held at mid; dist A base)\n", "=" * 78)
    print("(1) mean ticket at $1000M volume, tier mix held at 65/35:")
    for m in (25_000, 50_000, 100_000):
        n = 1e9 / m
        blended = 0.65*P3_LOW + 0.35*P3_HIGH
        print(f"    mean ${m:>7,} -> {n:>8,.0f} payments -> ${n*blended:>10,.0f}/yr")
    print("(2) tier mix at $1000M volume, mean held at ~$50k (N=20,040):")
    for lo_share in (0.40, 0.65, 0.95):
        blended = lo_share*P3_LOW + (1-lo_share)*P3_HIGH
        print(f"    <=$50k share {lo_share:.0%} -> blended ${blended:>6,.2f} "
              f"-> ${20_040*blended:>10,.0f}/yr")
    print("(3) fee-stack realization, contribution per payment at mean $49.9k:")
    for regime in ("A", "A_stack", "A_referred", "B"):
        c = contribution(DIST_A, regime)
        print(f"    {regime:<11} ${c[1]:>9,.2f} .. ${c[0]:>9,.2f} per payment")
    print("\nALL CELLS INFORMATIONAL — arithmetic over stated inputs; inputs tagged in .md")


if __name__ == "__main__":
    main()
