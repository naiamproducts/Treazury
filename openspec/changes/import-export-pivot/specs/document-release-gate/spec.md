# Delta for document-release-gate

## ADDED Requirements

### Requirement: Release gated on paid order

Commercial documents MUST NOT be visible, exportable, or moved beyond draft state until
their order reaches `orders.status = 'paid'`.

#### Scenario: Blocked before paid

- GIVEN an order whose status is not paid
- WHEN the tenant opens the documents view for that order
- THEN its commercial documents are unavailable for release or export

#### Scenario: Released when paid

- GIVEN an order whose status becomes paid
- WHEN the release gate evaluates it
- THEN its commercial documents become exportable

### Requirement: Explicit USDC payment-to-document binding

The system MUST bind commercial document release to the USDC charge settlement for the
order, so that documents are released only by the same paid event that settles the charge.

#### Scenario: Payment and document tied to one event

- GIVEN an order with an active USDC charge
- WHEN that charge is settled and the order becomes paid
- THEN the bound commercial documents are released

#### Scenario: Unsettled charge does not release

- GIVEN an order whose USDC charge is still pending
- WHEN the documents are requested
- THEN the documents remain unreleased

### Requirement: Idempotent release

The release operation MUST be idempotent; repeated paid signals for the same order MUST NOT
create duplicate releases, documents, or side effects.

#### Scenario: Duplicate paid signal

- GIVEN an order that is already released
- WHEN a second paid signal arrives for the same order
- THEN no new release, document, or state change occurs

### Requirement: Attach points for release

The release gate MUST be triggered at both attach points, the store `markChargePaid` flow
and the `verify-payment` edge function, with identical idempotent behavior.

#### Scenario: Store release path

- GIVEN a merchant confirms a charge paid through `markChargePaid`
- WHEN the order transitions to paid
- THEN the release gate runs from the store path

#### Scenario: Edge function release path

- GIVEN the on-chain verifier settles a charge through `verify-payment`
- WHEN the order transitions to paid
- THEN the release gate runs from the edge function path with the same idempotent result

## Assumptions

- The uniqueness key (order_id, doc_type) provides release idempotency.
- The edge function runs with service_role and MUST NOT bypass tenant scoping on reads.
