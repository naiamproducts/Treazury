# Delta for commercial-documents

## ADDED Requirements

### Requirement: Order-triggered commercial document generation

On order confirmation the system MUST auto-generate one DRAFT commercial invoice and one
DRAFT packing list linked to that order.

#### Scenario: Drafts created on order confirmation

- GIVEN a confirmed order with at least one line item for a tenant
- WHEN the order is persisted
- THEN one DRAFT commercial invoice and one DRAFT packing list exist linked to the order

#### Scenario: No duplicate drafts on re-confirmation

- GIVEN an order that already has a DRAFT commercial invoice and packing list
- WHEN the order is confirmed again
- THEN no additional commercial document is created

### Requirement: Editable commercial fields

The system MUST let the tenant edit HS code, Incoterm, country of origin, buyer and seller
details, line weight (net/gross), and package counts before release, and MUST persist the
edits to the document snapshot.

#### Scenario: Edit persists to snapshot

- GIVEN a DRAFT commercial document
- WHEN the tenant edits HS code, Incoterm, origin, buyer/seller, weight, or packages and saves
- THEN the snapshot reflects the edits after reload

#### Scenario: Invalid weight rejected

- GIVEN a DRAFT commercial document
- WHEN the tenant enters a non-numeric or negative weight
- THEN the save is rejected with a validation error

### Requirement: PDF primary export

The system MUST export a released commercial document as a PDF as the primary format.

#### Scenario: PDF export

- GIVEN a released commercial document
- WHEN the tenant requests PDF export
- THEN a PDF containing all document fields is produced

### Requirement: CSV secondary export

The system MUST offer CSV export of tabular document data as a secondary format. Excel
(xlsx) export is not required.

#### Scenario: CSV export of line items

- GIVEN a released commercial document with line items
- WHEN the tenant requests CSV export
- THEN a CSV with one row per line item and its fields is produced

### Requirement: Commercial-not-customs disclaimer

Every generated commercial document MUST display the disclaimer: "Commercial document. Not
a customs declaration or transport document. Customs clearance requires a licensed broker."

#### Scenario: Disclaimer on every document

- GIVEN any generated commercial invoice or packing list, in any export format
- WHEN the document is rendered or exported
- THEN the disclaimer text is present

### Requirement: Fiscal numbering isolation

Commercial documents MUST use their own numbering sequence and MUST NOT consume or alter
fiscal invoice numbers from `next_invoice_number()`.

#### Scenario: Fiscal sequence untouched

- GIVEN a commercial document is generated
- WHEN its number is assigned
- THEN `next_commercial_doc_number()` advances and `next_invoice_number()` is not called

### Requirement: Tenant isolation of commercial documents

Commercial documents MUST be readable and writable only by their owning tenant under the
existing tenant RLS.

#### Scenario: Cross-tenant read denied

- GIVEN tenant A owns a commercial document and tenant B is authenticated
- WHEN tenant B queries that document
- THEN no row is returned

## Assumptions

- PDF and CSV are generated client-side first; a server-side renderer is deferred.
- Incoterm is captured at document header level; HS code, country of origin, and weight are
  line-level.
- Weight is captured per line as net/gross in kg plus package counts, totalled at document
  level.
- Commercial documents live in a separate `commercial_docs` table; the fiscal `invoices`
  table is not extended.
- The rendered PDF file path is stored in `pdf_path`; `invoices.pdf_url`/`xml_url` remain
  fiscal-only.
