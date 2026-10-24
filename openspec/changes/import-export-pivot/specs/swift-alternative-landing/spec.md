# Delta for swift-alternative-landing

## ADDED Requirements

### Requirement: English agency-facing landing page

The landing page MUST be fully in English and oriented to import/export agencies rather than
the prior wholesale/WhatsApp positioning.

#### Scenario: English agency-facing hero

- GIVEN a visitor loads the landing page
- WHEN the page renders
- THEN the hero and all copy are English and address import/export agencies

### Requirement: SWIFT-to-USDC storytelling

The landing page MUST tell the SWIFT-alternative story, contrasting SWIFT with USDC
settlement.

#### Scenario: Outcome comparison presented

- GIVEN a visitor reads the landing page
- WHEN the product value section renders
- THEN SWIFT and USDC settlement are contrasted on speed, cost, and visibility

### Requirement: Payment-to-document value proposition

The landing page MUST communicate that settling an order in USDC releases that order's
commercial documents.

#### Scenario: Binding communicated

- GIVEN a visitor reads the landing page
- WHEN the product flow is described
- THEN the connection between USDC payment and commercial document release is stated

### Requirement: English copy only

No Spanish copy MAY appear on the landing page. The title, meta, and OpenGraph copy SHOULD be
English.

#### Scenario: No Spanish on landing

- GIVEN the landing page at any viewport
- WHEN the copy is inspected
- THEN all copy is English

### Requirement: Stablecoin rail abroad, local bank payout at destination

The landing page MUST present settlement as a stablecoin rail for the cross-border leg combined with a
regulated liquidity partner at destination delivering a local bank transfer (SEPA Instant or ACH) to the
supplier, whose bank deposit produces the interbank receipt used for customs payment closure. The landing
MUST NOT claim that the platform performs customs clearance or guarantees full customs compliance; the
customs claim is limited to that interbank receipt supporting payment closure.

#### Scenario: Bank last-mile stated, customs claim bounded

- GIVEN a visitor reads the landing page
- WHEN the settlement flow and the payment-to-document story are described
- THEN the local bank payout at destination and the supplier's bank deposit producing the interbank receipt are stated
- AND no copy claims the platform performs customs clearance or guarantees full customs compliance

## Assumptions

- The landing page reuses the existing luxe-dark design tokens from DESIGN.md.
- Stale "WhatsApp"/"Vendify" positioning is removed.
