const BILLIT_SANDBOX_URL = "https://api.sandbox.billit.be";
const BILLIT_PRODUCTION_URL = "https://api.billit.be";

interface BillitCustomer {
  Name: string;
  Street: string;
  StreetNumber: string;
  Box?: string;
  Zipcode: string;
  City: string;
  CountryCode: string;
  IBAN?: string;
  BIC?: string;
  Mobile?: string;
  Email?: string;
  Contact?: string;
  VATNumber: string;
  PartyType: "Customer";
  VATLiable: boolean;
}

interface BillitSupplier {
  Name: string;
  Street: string;
  StreetNumber: string;
  Box?: string;
  Zipcode: string;
  City: string;
  CountryCode: string;
  IBAN?: string;
  BIC?: string;
  VATNumber: string;
  PartyType: "Supplier";
  VATLiable: boolean;
}

interface BillitOrderLine {
  Quantity: number;
  UnitPriceExcl: number;
  Description: string;
  VATPercentage: number;
}

interface BillitInvoice {
  Supplier?: BillitSupplier;
  Customer: BillitCustomer;
  OrderNumber: string;
  OrderDate: string;
  ExpiryDate: string;
  OrderType: "Invoice";
  OrderDirection: "Income";
  OrderLines: BillitOrderLine[];
  Paid: boolean;
  PaidDate?: string;
  Currency: string;
}

interface SendPeppolInvoiceParams {
  supplierName: string;
  supplierStreet: string;
  supplierStreetNumber: string;
  supplierZipcode: string;
  supplierCity: string;
  supplierVatNumber: string;
  supplierIban?: string;
  supplierBic?: string;
  customerName: string;
  customerStreet: string;
  customerStreetNumber: string;
  customerZipcode: string;
  customerCity: string;
  customerVatNumber: string;
  customerEmail?: string;
  invoiceNumber: string;
  invoiceDate: Date;
  dueDate: Date;
  description: string;
  amountExclVat: number;
  vatPercentage: number;
  isPaid: boolean;
  paidDate?: Date;
}

function getBaseUrl(): string {
  const useSandbox = process.env.BILLIT_SANDBOX === "true" || !process.env.BILLIT_API_KEY?.startsWith("live_");
  return useSandbox ? BILLIT_SANDBOX_URL : BILLIT_PRODUCTION_URL;
}

export async function sendPeppolInvoice(params: SendPeppolInvoiceParams): Promise<{ success: boolean; error?: string; data?: any }> {
  const apiKey = process.env.BILLIT_API_KEY;
  
  if (!apiKey) {
    console.log("Billit API key not configured, skipping Peppol invoice");
    return { success: false, error: "Billit API key not configured" };
  }

  const invoice: BillitInvoice = {
    Supplier: {
      Name: params.supplierName,
      Street: params.supplierStreet,
      StreetNumber: params.supplierStreetNumber,
      Zipcode: params.supplierZipcode,
      City: params.supplierCity,
      CountryCode: "BE",
      VATNumber: params.supplierVatNumber,
      IBAN: params.supplierIban,
      BIC: params.supplierBic,
      PartyType: "Supplier",
      VATLiable: true,
    },
    Customer: {
      Name: params.customerName,
      Street: params.customerStreet,
      StreetNumber: params.customerStreetNumber,
      Zipcode: params.customerZipcode,
      City: params.customerCity,
      CountryCode: "BE",
      VATNumber: params.customerVatNumber,
      Email: params.customerEmail,
      PartyType: "Customer",
      VATLiable: true,
    },
    OrderNumber: params.invoiceNumber,
    OrderDate: params.invoiceDate.toISOString(),
    ExpiryDate: params.dueDate.toISOString(),
    OrderType: "Invoice",
    OrderDirection: "Income",
    OrderLines: [
      {
        Quantity: 1,
        UnitPriceExcl: params.amountExclVat,
        Description: params.description,
        VATPercentage: params.vatPercentage,
      },
    ],
    Paid: params.isPaid,
    PaidDate: params.paidDate?.toISOString(),
    Currency: "EUR",
  };

  try {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/v1/peppol/sendOrder`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": apiKey,
      },
      body: JSON.stringify(invoice),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Billit API error:", data);
      return { success: false, error: data.message || "Failed to send Peppol invoice", data };
    }

    console.log("Peppol invoice sent successfully:", data);
    return { success: true, data };
  } catch (err) {
    console.error("Failed to send Peppol invoice:", err);
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function checkPeppolRegistration(vatNumber: string): Promise<boolean> {
  const apiKey = process.env.BILLIT_API_KEY;
  
  if (!apiKey) {
    return false;
  }

  try {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/v1/peppol/lookup?vatNumber=${encodeURIComponent(vatNumber)}`, {
      headers: {
        "Authorization": apiKey,
      },
    });

    if (response.ok) {
      const data = await response.json();
      return data.registered === true;
    }
    return false;
  } catch {
    return false;
  }
}
