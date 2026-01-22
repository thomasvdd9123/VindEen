# Peppol Invoice Integration - Belgium B2B Compliance

## Overview

As of **January 1, 2026**, Belgium requires all B2B transactions between VAT-registered companies to use Peppol-compliant e-invoicing. Your platform must send invoices via the Peppol network, not just PDF invoices.

**Source:** [Belgium Peppol e-invoicing 2026 compliance](https://www.gep.com/blog/technology/belgium-peppol-e-invoicing-2026-compliance)

---

## What is Peppol?

- **Peppol** (Pan-European Public Procurement Online) is a network for electronic invoicing
- **Peppol BIS 3.0** / **UBL 2.1** is the required XML format
- Invoices must be sent via a **certified Peppol Access Point (AP)**
- Both sender and receiver need **Peppol Participant IDs**

---

## Recommended Service Providers

### 1. Peppol Box (Flexina) ⭐ Recommended for MVP
**Pricing:**
- ~€7/month for receive-only
- ~€10/month for send+receive (up to ~300 docs/year)
- Scales with volume

**Pros:**
- Belgian-based, certified Access Point
- Simple setup, API + UI options
- Affordable for MVP/low volume
- Good support for Belgian compliance

**Link:** [Peppol Box Pricing](https://www.peppol-box.be/en/tarifs)

**Best for:** MVP with low-moderate invoice volume

---

### 2. e-invoice.be
**Pricing:**
- ~€0.25 per invoice (no subscription required)
- Volume discounts available

**Pros:**
- Pay-per-use (no monthly fees)
- REST API with JSON support
- UBL XML generation
- Good for low volume/high variability

**Link:** [e-invoice.be Peppol API](https://e-invoice.be/peppol-api)

**Best for:** Low volume, unpredictable invoicing patterns

---

### 3. Recommand.eu
**Pricing:**
- Free tier: 25 documents/month
- Starter: €29/month for 200 documents
- Professional: €99/month for 1,000 documents

**Pros:**
- Generous free tier for testing/MVP
- Clear pricing model
- API-first approach
- Good for scaling

**Link:** [Recommand.eu](https://recommand.eu)

**Best for:** MVP testing or predictable growth

---

## Implementation Strategy

### Phase 1: Choose Provider (MVP)
**Recommendation: Peppol Box or e-invoice.be**

- **Peppol Box**: If you want predictable monthly costs (~€10/month)
- **e-invoice.be**: If volume is very low (pay per invoice, ~€0.25 each)

### Phase 2: Integration

1. **Register your company**
   - Get your Peppol Participant ID via chosen provider
   - Register company VAT number (KBO/BCE number)

2. **Collect customer Peppol IDs**
   - During profile creation, ask for customer's Peppol ID (optional initially)
   - Store in `profiles` table: `peppol_participant_id` field

3. **Invoice Generation**
   - When subscription payment succeeds (Mollie webhook)
   - Generate invoice data (amount, VAT, company details)
   - Convert to Peppol BIS 3.0 / UBL 2.1 format via provider API

4. **Send Invoice**
   - Send via provider's API to Peppol network
   - Track status (sent, delivered, rejected)
   - Store invoice reference in `payments` table

### Phase 3: Database Schema Updates

**Add to `payments` table:**
```sql
peppol_invoice_id VARCHAR(255),
peppol_invoice_status VARCHAR(50), -- sent, delivered, rejected
peppol_invoice_sent_at TIMESTAMP,
peppol_rejection_reason TEXT
```

**Add to `profiles` table:**
```sql
peppol_participant_id VARCHAR(255), -- Customer's Peppol ID (optional)
company_vat_number VARCHAR(50) -- Required for invoicing
```

---

## Integration Code Structure

### File: `lib/peppol/client.ts`

```typescript
// Example structure (implementation depends on chosen provider)
export class PeppolClient {
  // Initialize client with API key
  constructor(apiKey: string, apiUrl: string) {}
  
  // Generate and send Peppol invoice
  async sendInvoice(invoiceData: InvoiceData): Promise<PeppolResponse> {}
  
  // Get invoice status
  async getInvoiceStatus(invoiceId: string): Promise<InvoiceStatus> {}
  
  // Register company Peppol ID
  async registerCompany(companyData: CompanyData): Promise<PeppolID> {}
}
```

### Invoice Flow

1. **Payment succeeds** (Mollie webhook) → `app/api/webhooks/mollie/route.ts`
2. **Generate invoice data** → Include VAT, company details, subscription info
3. **Send via Peppol** → Call `PeppolClient.sendInvoice()`
4. **Store invoice reference** → Save `peppol_invoice_id` in `payments` table
5. **Handle status updates** → Poll or webhook for delivery confirmation

---

## Required Invoice Data

For Peppol BIS 3.0 compliance, invoices must include:

- **Supplier (Your company):**
  - Company name
  - VAT number (KBO/BCE)
  - Peppol Participant ID
  - Address

- **Buyer (Customer):**
  - Company name
  - VAT number (if VAT-registered)
  - Peppol Participant ID (if available)
  - Address

- **Invoice Details:**
  - Invoice number (unique)
  - Invoice date
  - Due date
  - Line items (description, quantity, unit price)
  - VAT amount and rate (21% standard in Belgium)
  - Total amount (including VAT)

---

## Cost Estimate

### MVP Phase (< 100 companies, ~100 invoices/year)
- **Peppol Box**: €10/month = €120/year
- **e-invoice.be**: 100 invoices × €0.25 = €25/year

### Growth Phase (500+ companies, ~500 invoices/year)
- **Peppol Box**: Higher tier (~€20-30/month) = €240-360/year
- **e-invoice.be**: 500 invoices × €0.25 = €125/year

**Recommendation:** Start with **e-invoice.be** for MVP (lowest cost), migrate to **Peppol Box** if volume increases.

---

## Important Notes

1. **Peppol is mandatory for B2B in Belgium** - Cannot send PDF invoices for B2B transactions
2. **B2C transactions** - Can still use regular PDF invoices (not Peppol)
3. **Storage/Archiving** - Belgian law requires invoice storage (most providers include this)
4. **Error Handling** - Rejected invoices must be handled (missing fields, invalid formats)

---

## Next Steps

1. Choose provider (recommend **e-invoice.be** or **Peppol Box** for MVP)
2. Register company and get Peppol Participant ID
3. Integrate Peppol client in `lib/peppol/client.ts`
4. Update database schema (add Peppol fields)
5. Implement invoice generation on payment success
6. Test end-to-end flow before Jan 2026 deadline

---

## References

- [Belgium Peppol Compliance Guide](https://www.gep.com/blog/technology/belgium-peppol-e-invoicing-2026-compliance)
- [Peppol Box Pricing](https://www.peppol-box.be/en/tarifs)
- [e-invoice.be Documentation](https://docs.e-invoice.be)
- [Recommand.eu](https://recommand.eu)
