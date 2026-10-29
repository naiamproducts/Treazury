---
dept: L.D
scope: global
kind: analysis
status: draft
as_of: 2026-10-28
sources:
 - https://www.bcra.gob.ar/archivos/Pdfs/Texord/t-excbio.pdf # BCRA TO Exterior y Cambios al 14/09/2026 (Com A 8481) — read 2026-10-28
 - https://www.pbc.gov.cn/tiaofasi/144941/3581332/2026020619591971323/index.html # 银发〔2026〕42号 — read 2026-10-28
 - repo: docs/L.D/global/flow-matrix.md:40; docs/L.D/ar/profile.md:65-66; docs/L.D/ar/regulatory-rent-map.md:48-58; docs/F.D/global/corridor-economics.md:152; docs/F.D/ar/ar-counterfactual.md:71
---

# Global — Profile corrections + corridor status snapshot

Decision-support for counsel; not a binding opinion. Findings from the
2026-10-28 pass (AR export-flow/escrow analysis
`docs/L.D/ar/export-flow-escrow.md`, CN profile `docs/L.D/cn/profile.md`)
that touch files beyond a single country folder. All edits to other
profiles remain proposals — this file only flags them.

## Corrections / precision addenda

1. **CN supersession (founder briefings, not repo).** 银发〔2021〕237号 is
 **repealed** by 银发〔2026〕42号 (2026-02-06, express repeal clause, read
 2026-10-28 on pbc.gov.cn). No repo file cites the 2021 notice (grep
 2026-10-28, INFORMATIONAL absence), but any deck/brief that explains the
 China block from the 2021 notice must be re-based on 42号 — the newer
 text additionally bans RWA onshore, bars VC as collateral (42号 (六)),
 bars offshore RMB-pegged stablecoin issuance, and adds the (十八)
 onshore-helper liability. Verdict: **CONFIRMED (supersession)**.
2. **`flow-matrix.md:40` AR cell oversimplifies the deadline.** The cell
 reads "MCF / SECOEX, 180 days"; the operative rule is 30/60/180/365
 calendar days from cumplido de embarque **plus an independent 20 business
 days from fecha de cobro** (TO §7.1.1-§7.1.2, read 2026-10-28) — the full
 citation already exists at `docs/L.D/ar/profile.md:65-66` and
 `regulatory-rent-map.md:48-54`. Proposal: matrix footnote "180 = default
 category only; see ar/profile.md". Verdict: **UNVALIDATED as a summary
 cell / CONFIRMED detail in ar/profile**.
3. **The 20-bd rule is a money-movement deadline, not a documentation
 window.** Precision addendum to `regulatory-rent-map.md:52`: the
 20-business-day term appears twice as a substantive ingress+liquidation
 limit — for *all* export collections (TO §7.1.1 ¶2, "independientemente
 de los plazos máximos", `t-excbio.txt:4703-4712`) and for
 anticipos/prefinancing from fecha de cobro/desembolso (§7.1.3 `:4817`).
 Documentation is a separate *gate*: certification requires commercial
 docs as *requisito excluyente* (§8.4.1 `:6537-6541`), vencimiento =
 cumplido + table (§8.4.2 `:6543`), denuncia de incumplido within 10 bd
 (§8.4.5 `:6633`). A brief claiming "20 días hábiles de prórroga para
 documentación" does not match the primary text — REJECTED as stated
 (see `export-flow-escrow.md` Part B, claim 4). Verdict:
 **CONFIRMED (primary) / REJECTED (brief characterization)**.
4. **Never label the 6.82% a legal figure.** It is an F.D model output
 (1,559.94 vs 1,674.12 on 2026-10-27, `ar-counterfactual.md:71`),
 refreshed to brecha 7.24–7.45% on 2026-10-27 (`corridor-economics.md:152`).
 What is legal: mandatory MCF liquidation of the export contravalor for
 legal-person goods exporters (Decreto 609/2019 art. 1; TO §7.1.1), with
 enumerated exceptions (§7.1.5, §2.6.1/§2.2.2.2, §2.7, §14.1).
 Verdict: **CONFIRMED (duty) / REJECTED (percentage as law)**.
5. **No zona-franca export carve-out found.** Search of TO §§2.7, 7.1, 7.5
 this pass found no export-liquidation exemption for zona franca exporters
 (absence = INFORMATIONAL; §10.2.5 is import-side). Flagged as open
 question before any such claim — counsel to confirm.

## Corridor country summary (status snapshot, 2026-10-28)

One line each — direct-payment verdict and why the not-permitted ones fail:

| Country | buyerToSellerDirect | One-line basis |
|---|---|---|
| US | permitted | Wallet-to-wallet with no platform acceptance/transmission sits outside the MSB definition (`us/profile.md:29-32`). |
| MX | permitted | No FX surrender duty for exporters; virtual assets are not divisas (`mx/profile.md:27-30`). |
| EU | conditional | P2P is outside the TFR, but any execution/transmission for clients is a CASP service needing authorisation (`eu/profile.md:33-37`). |
| VE | conditional | Clean only with OFAC 31 CFR 591 screening plus BCV/CENCOEX declaration through an authorised FX operator (`ve/profile.md:31-35`). |
| BR | conditional | **Fails as a simple corridor**: currency may cross only via BCB-authorised FX institutions and custody is SPSAV-reserved (Res. BCB 520/2025, art. 23 localisation clock) — no rails or custody available to Treazury (`br/profile.md:30-40`). |
| CL | conditional | **Fails as a simple corridor**: BC Circular 768 bank reporting before doc release, but the profile is provisional — only an excerpt was read and custody verdicts remain `unknown` (`cl/profile.md:5, :31-46`). |
| CO | blocked | Export proceeds must pass the FX market (IMC/compensation account); reintegro outside it is not authorised (`co/profile.md:25-33`). |
| AR | blocked | Surrender duty: USDC receipt does not discharge it (Decreto 609/2019 art. 1; TO §7.1) (`flow-matrix.md:40`; `red-lines.md:57`). |
| CN | blocked | 银发〔2026〕42号: onshore VC business illegal, offshore providers barred from serving onshore subjects, no crypto-fiat licence exists (`cn/profile.md`, read 2026-10-28). |
