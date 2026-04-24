# Billit / Peppol Implementation Guide
## Written by an AI agent, for an AI agent — based on a real implementation

This guide documents every lesson learned from implementing automatic Peppol e-invoicing
via Billit in a Belgian B2B SaaS platform. If you're implementing this in a fresh Replit
app, read this before touching any code.

---

## 1. Why Peppol? (Belgian context)

Since **January 1, 2026**, Belgium mandates Peppol-compliant e-invoicing for all B2B
transactions between VAT-registered companies. PDF invoices are no longer legally sufficient
for Belgian B2B. This is not optional if your users are Belgian businesses.

**Peppol** is a network, not a single service. You need a certified **Access Point (AP)**
to send invoices over it. You can't just fire off XML yourself.

**Billit** (https://billit.be) is one such certified Access Point. It has a REST/JSON API,
which makes it much easier than raw UBL 2.1 XML providers. This guide covers Billit specifically.

---

## 2. What Billit Actually Does

Billit is an accounting/invoicing SaaS. When you use it programmatically:
- You configure your own supplier info (company name, VAT, IBAN) in the Billit dashboard GUI
- Your API key is tied to your Billit account
- You submit invoice orders via API — Billit converts them to Peppol UBL XML and delivers them
- The customer receives the invoice in their "Snelle Invoer" (fast input) if they're on Peppol
- If the customer is NOT registered on Peppol, Billit returns error `TheCustomerIsNotActiveOnPeppol`
  → this is NOT a fatal error, handle it gracefully (log + skip)

---

## 3. Billit API: The Two Environments

### Sandbox
- URL: `https://api.sandbox.billit.be`
- Endpoint for sending: `POST /v1/einvoices/registrations/{partyId}/commands/send`
- Request body wraps the order: `{ TransportType: "Peppol", Order: { ...order } }`
- Requires `PartyID` header

### Production
- URL: `https://api.billit.be`
- Endpoint for sending: `POST /v1/peppol/sendOrder`
- Request body IS the order directly: `{ ...order }` (no wrapper!)
- Requires `PartyID` header

**⚠️ CRITICAL GOTCHA**: The sandbox and production endpoints have **completely different
request body structures AND different URL paths**. This trips you up hard if you don't
notice. Always branch your code on `BILLIT_SANDBOX === "true"`.

---

## 4. Authentication Headers

Both environments use the same header pattern:

```
ApiKey: <your-api-key>          ← NOT "Authorization: Bearer", NOT "X-API-Key" — just "ApiKey"
PartyID: <your-party-id>        ← the RegistrationID you get after registering your company
Content-Type: application/json
Accept: application/json
```

**⚠️ GOTCHA**: The header is literally `ApiKey` (capital A, capital K, no space, no Bearer).
This is unusual and easy to get wrong. Billit's docs don't shout about it.

---

## 5. Environment Variables Needed

```
BILLIT_API_KEY=...       ← from Billit dashboard > API settings
BILLIT_PARTY_ID=...      ← RegistrationID returned after company registration (see step 6)
BILLIT_SANDBOX=true      ← set to false for production
```

These are server-side only. Never expose them to the frontend.

---

## 6. Registering Your Company (One-Time Setup)

Before you can send invoices, you must register your company in the Billit system to get a
`PartyID` / `RegistrationID`. This is the "sender" identity on the Peppol network.

**Option A (Recommended):** Do it via the Billit web dashboard — create an account, fill in
your company details (VAT, IBAN, address), and note your API key + PartyID from the settings.

**Option B:** API registration via `POST /v1/account/registercompany` (sandbox only — see
`scripts/register-billit.ts` in this repo for the payload structure). Note: the Auth header
here is just `Authorization: <apiKey>` (different from the invoice sending headers!).

**After registration you get a PartyID / RegistrationID.** Store this as `BILLIT_PARTY_ID`.
Without this, sandbox sends will fail with 404 or 400.

---

## 7. The Order Object Structure

This is what you send as `Order` (in sandbox it's wrapped, in production it's the whole body):

```typescript
{
  OrderType: "Invoice",
  OrderDirection: "Income",        // Always "Income" for outgoing invoices (you're billing them)
  OrderDate: "2026-01-15",         // YYYY-MM-DD
  ExpiryDate: "2026-02-14",        // Due date, YYYY-MM-DD
  OrderNumber: "INV-2026-ABCD1234", // Must be unique per invoice
  OrderLines: [
    {
      Quantity: 1,
      UnitPriceExcl: 123.97,       // Price EXCLUDING VAT
      Description: "Subscription - 1 year",
      VATPercentage: 21,           // Belgian standard VAT rate
    }
  ],
  Customer: {
    Name: "Bedrijf NV",
    VATNumber: "BE0123456789",     // Belgian VAT format: BE + 10 digits
    PartyType: "Customer",         // Literal string "Customer"
    Email: "info@bedrijf.be",
    Street: "Kerkstraat",
    StreetNumber: "42",
    Box: "",                       // optional
    Zipcode: "9000",
    City: "Gent",
    CountryCode: "BE",
  },
  Paid: true,                      // Set true if already paid (which it is after Mollie webhook)
  PaidDate: "2026-01-15",          // YYYY-MM-DD, only if Paid: true
}
```

**⚠️ GOTCHA**: `UnitPriceExcl` must be **excluding VAT**. If your payment provider (Mollie)
gives you the total-including-VAT, divide by 1.21 (for 21% VAT) to get the excl. amount.

**⚠️ GOTCHA**: `OrderNumber` must be globally unique. A safe pattern:
`INV-${year}-${subscriptionId.slice(0,8).toUpperCase()}`

---

## 8. Full Sandbox Request Example

```typescript
const endpoint = `https://api.sandbox.billit.be/v1/einvoices/registrations/${partyId}/commands/send`;
const body = {
  TransportType: "Peppol",
  Order: { ...orderObject }
};
const headers = {
  "Content-Type": "application/json",
  "Accept": "application/json",
  "ApiKey": apiKey,
  "PartyID": partyId,
};

const response = await fetch(endpoint, {
  method: "POST",
  headers,
  body: JSON.stringify(body),
});
```

---

## 9. Full Production Request Example

```typescript
const endpoint = `https://api.billit.be/v1/peppol/sendOrder`;
const body = { ...orderObject };  // No wrapper!
const headers = {
  "Content-Type": "application/json",
  "Accept": "application/json",
  "ApiKey": apiKey,
  "PartyID": partyId,
};

const response = await fetch(endpoint, {
  method: "POST",
  headers,
  body: JSON.stringify(body),
});
```

---

## 10. Error Handling — What Errors You Will See

### `TheCustomerIsNotActiveOnPeppol`
- **Meaning**: Customer's VAT number is not registered on the Peppol network
- **Action**: Log + skip gracefully. This is NOT an app error. Many smaller Belgian companies
  aren't on Peppol yet. The invoice simply doesn't get delivered electronically.
- **Do NOT** fail the payment confirmation flow because of this.

```typescript
if (!response.ok) {
  const errorCode = data?.errors?.[0]?.Code;
  if (errorCode === "TheCustomerIsNotActiveOnPeppol") {
    console.log(`Peppol skipped: ${vatNumber} not on Peppol`);
    return; // graceful skip
  }
  // actual error
  console.error("Billit error:", data);
}
```

### 400/401 with no clear message
- Usually wrong header format (`Authorization` vs `ApiKey`)
- Or missing `PartyID` header in sandbox

### 404 on sandbox endpoint
- Wrong PartyID in the URL path
- Or using the production endpoint URL with sandbox credentials

### Response parsing
- Always read `response.text()` first, then try `JSON.parse()` — Billit sometimes returns
  plain text (especially for 2xx responses in sandbox), not JSON

---

## 11. Checking If a Customer Is on Peppol (Optional)

```typescript
const response = await fetch(
  `${baseUrl}/v1/peppol/participantInformation/${encodeURIComponent(vatNumber)}`,
  { headers: { "ApiKey": apiKey, "PartyID": partyId } }
);
if (response.ok) {
  const data = await response.json();
  return data.Registered === true;
}
```

Useful if you want to show a UI badge ("Peppol-compatible") or preflight check before sending.

---

## 12. What Data You Need From Your Users

For the invoice to work, you MUST collect from your users (at account/billing setup time):
1. **VAT number** — Belgian format `BE0123456789` (validate the format!)
2. **Company name** — legal name
3. **Billing street** + **street number**
4. **Billing postcode**
5. **Billing city**
6. **Email** (for the Customer.Email field)

**⚠️ GOTCHA**: Only send the Peppol invoice if ALL required fields are present.
Check `account.vat_number && account.billing_street && account.billing_city` before calling
the API. Missing fields will cause Billit to reject the invoice with confusing errors.

---

## 13. Integration Trigger Point: The Mollie Webhook

The correct place to send the Peppol invoice is inside the Mollie payment webhook handler,
**after** confirming the payment status is `"paid"`:

```
Mollie webhook fires
  → fetch payment from Mollie API
  → check payment.status === "paid"
  → update subscription in your DB
  → send confirmation email (Resend)
  → send Peppol invoice (Billit)   ← HERE
  → send Discord notification
  → return 200 OK
```

**⚠️ IMPORTANT**: Wrap the entire Billit block in a try/catch that does NOT rethrow.
The Peppol invoice failing should NEVER fail the webhook response. Mollie will retry the
webhook if it gets anything other than 2xx, causing duplicate payment processing.

```typescript
try {
  // ... Billit API call
} catch (peppolError) {
  console.error("Failed to send Peppol invoice:", peppolError);
  // do NOT rethrow — let the webhook succeed
}
```

---

## 14. File Structure Recommendation

```
server/lib/billit.ts          ← isolated Billit client module
  - sendPeppolInvoice()
  - checkPeppolRegistration()

scripts/register-billit.ts    ← one-time setup script (not in prod bundle)

api/index.ts (or routes.ts)   ← webhook handler calls sendPeppolInvoice()
```

Keep Billit logic in its own file so you can unit-test it and reuse it independently.

---

## 15. Testing in Sandbox

1. Set `BILLIT_SANDBOX=true` and add your sandbox `BILLIT_API_KEY` + `BILLIT_PARTY_ID`
2. Use a **real Belgian VAT number** that IS registered on Peppol for a successful test
   (ask Billit support for a test VAT number, or use your own if Peppol-registered)
3. Use a **fake/unregistered VAT number** to test the `TheCustomerIsNotActiveOnPeppol` path
4. Check the Billit dashboard → API Logs to see what was received and what the response was
5. Check Billit dashboard → e-invoices to see if the invoice appeared

**Sandbox does NOT actually deliver invoices to anyone** — it just validates and processes them.

---

## 16. The "I Have No Idea What's Wrong" Debugging Checklist

When Billit returns an error and you don't know why:

- [ ] Are you using `ApiKey` header (not `Authorization: Bearer`, not `X-Api-Key`)?
- [ ] Are you using the correct URL? (sandbox vs production)
- [ ] Are you using the correct endpoint PATH? (they differ between environments)
- [ ] Is the request body wrapped in `{ TransportType, Order }` for sandbox, or direct for production?
- [ ] Is `PartyID` header set?
- [ ] Is `UnitPriceExcl` the amount EXCLUDING VAT?
- [ ] Is `OrderNumber` unique (no duplicate from previous test)?
- [ ] Does `VATNumber` have the `BE` prefix and correct format?
- [ ] Are all required Customer fields present (Name, VATNumber, Street, City)?
- [ ] Did you read the raw `response.text()` before parsing as JSON? (check the Billit API log too)

---

## 17. What Took the Most Time (Honest Retrospective)

1. **Sandbox vs production endpoint differences** — spent a long time not realizing the
   body structure AND the URL path are both different. These should be two completely
   separate if/else branches, not a subtle variation.

2. **The `ApiKey` header name** — tried `Authorization`, `X-Api-Key`, `Bearer` first.
   Billit just returns 401 with no helpful message.

3. **PartyID confusion** — the PartyID is needed both in the URL path (sandbox) AND as a
   request header (both environments). Easy to have one but forget the other.

4. **Not all customers are on Peppol** — had to add graceful handling for
   `TheCustomerIsNotActiveOnPeppol` so it doesn't break the entire webhook.

5. **Response format is inconsistent** — sometimes JSON, sometimes plain text. Always
   read as text, then try to parse as JSON.

6. **VAT calculation direction** — payment provider returns total-incl-VAT, Billit needs
   excl-VAT. `priceExcl = totalIncl / 1.21`.

---

## 18. Quick Start Checklist for a New App

- [ ] Create Billit account at https://billit.be, fill in company details
- [ ] Get API key from Billit dashboard settings
- [ ] Note your PartyID / RegistrationID from dashboard
- [ ] Add `BILLIT_API_KEY`, `BILLIT_PARTY_ID`, `BILLIT_SANDBOX=true` to Replit secrets
- [ ] Create `server/lib/billit.ts` with the client functions (copy from this repo)
- [ ] Ensure user accounts collect VAT number + billing address
- [ ] Add Billit call inside payment webhook (wrapped in try/catch, non-fatal)
- [ ] Test with sandbox: check API logs in Billit dashboard
- [ ] Set `BILLIT_SANDBOX=false` + production API key when going live

---

## 19. Useful Links

- Billit API docs: https://docs.billit.be
- Billit sandbox dashboard: https://app.sandbox.billit.be
- Billit production dashboard: https://app.billit.be
- Belgian Peppol compliance info: https://www.gep.com/blog/technology/belgium-peppol-e-invoicing-2026-compliance
- Check if a VAT is Peppol-registered: use `checkPeppolRegistration()` from `server/lib/billit.ts`

---

*Generated from a working implementation. Last updated: April 2026.*
