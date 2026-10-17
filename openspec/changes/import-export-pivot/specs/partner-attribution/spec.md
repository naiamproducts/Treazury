# Delta for partner-attribution

## ADDED Requirements

### Requirement: Attribution at signup

The system MUST allow a signup to be attributed to a partner tenant, recording the
attribution on the new tenant's membership.

#### Scenario: Attributed signup

- GIVEN a valid partner attribution reference
- WHEN a new tenant signs up through it
- THEN the new tenant's membership records `attributed_partner_tenant_id`

#### Scenario: Unattributed signup

- GIVEN no partner attribution reference
- WHEN a tenant signs up
- THEN attribution stays null and signup proceeds normally

### Requirement: Visible partner fee

The system MUST display the partner fee applicable to referred tenants before it is
charged. The fee is a percentage of settled volume.

#### Scenario: Fee visible

- GIVEN an authenticated partner tenant
- WHEN the partner opens the panel
- THEN the applicable fee percentage is shown

### Requirement: Agency volume and commission panel

The system MUST show a partner tenant its attributed signups, settled volume, and accrued
commission.

#### Scenario: Panel totals

- GIVEN a partner tenant with attributed tenants and settled payments
- WHEN the partner opens the panel
- THEN attributed signup count, settled volume, and commission are shown

#### Scenario: No attributed data

- GIVEN a partner tenant with no attributed signups
- WHEN the partner opens the panel
- THEN zeros are shown without error

### Requirement: Agency equals tenant with no cross-tenant access

A partner MUST operate as a tenant, and a partner tenant MUST NOT read or write another
tenant's data; existing tenant RLS MUST be preserved with no cross-tenant relaxation.

#### Scenario: Partner cannot cross tenant boundary

- GIVEN partner tenant A and a referred tenant B
- WHEN A queries B's orders, charges, or commercial documents
- THEN no rows are returned

### Requirement: Direct buyer-to-seller settlement

Funds MUST settle directly from buyer to seller; the system MUST NOT route agency payments
through an agency-held account or custody funds on the agency's behalf.

#### Scenario: No agency passthrough

- GIVEN an order between a buyer and a seller attributed to a partner
- WHEN the USDC charge settles
- THEN funds reach the seller's wallet directly and no agency wallet holds them

## Assumptions

- The partner fee is a percentage of settled volume; the exact rate is configuration, not
  fixed in code.
- `attributed_partner_tenant_id` is a nullable column on `tenant_members`.
