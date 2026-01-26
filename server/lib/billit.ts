const BILLIT_SANDBOX_URL = "https://api.sandbox.billit.be";
const BILLIT_PRODUCTION_URL = "https://api.billit.be";

interface BillitCustomer {
  Name: string;
  Street?: string;
  StreetNumber?: string;
  Box?: string;
  Zipcode?: string;
  City?: string;
  CountryCode?: string;
  VATNumber: string;
  PartyType: "Customer";
  Email?: string;
}

interface BillitOrderLine {
  Quantity: number;
  UnitPriceExcl: number;
  Description: string;
  VATPercentage: number;
}

interface BillitOrder {
  OrderType: "Invoice";
  OrderDirection: "Income";
  OrderDate: string;
  ExpiryDate: string;
  OrderNumber: string;
  OrderLines: BillitOrderLine[];
  Customer: BillitCustomer;
  Paid?: boolean;
  PaidDate?: string;
}

interface BillitSendRequest {
  TransportType: "Peppol";
  Order: BillitOrder;
}

interface SendPeppolInvoiceParams {
  customerName: string;
  customerStreet?: string;
  customerStreetNumber?: string;
  customerZipcode?: string;
  customerCity?: string;
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

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export async function sendPeppolInvoice(params: SendPeppolInvoiceParams): Promise<{ success: boolean; error?: string; data?: any }> {
  const apiKey = process.env.BILLIT_API_KEY;
  const partyId = process.env.BILLIT_PARTY_ID || "1037520";
  
  if (!apiKey) {
    console.log("Billit API key not configured, skipping Peppol invoice");
    return { success: false, error: "Billit API key not configured" };
  }

  const request: BillitSendRequest = {
    TransportType: "Peppol",
    Order: {
      OrderType: "Invoice",
      OrderDirection: "Income",
      OrderDate: formatDate(params.invoiceDate),
      ExpiryDate: formatDate(params.dueDate),
      OrderNumber: params.invoiceNumber,
      OrderLines: [
        {
          Quantity: 1,
          UnitPriceExcl: params.amountExclVat,
          Description: params.description,
          VATPercentage: params.vatPercentage,
        },
      ],
      Customer: {
        Name: params.customerName,
        VATNumber: params.customerVatNumber,
        PartyType: "Customer",
        Email: params.customerEmail,
        Street: params.customerStreet,
        StreetNumber: params.customerStreetNumber,
        Zipcode: params.customerZipcode,
        City: params.customerCity,
        CountryCode: "BE",
      },
      Paid: params.isPaid,
      PaidDate: params.paidDate ? formatDate(params.paidDate) : undefined,
    },
  };

  try {
    const baseUrl = getBaseUrl();
    const endpoint = `${baseUrl}/v1/einvoices/registrations/${partyId}/commands/send`;
    
    console.log("Sending Peppol invoice to Billit:", {
      endpoint,
      invoiceNumber: params.invoiceNumber,
      customer: params.customerName,
      vatNumber: params.customerVatNumber,
      amount: params.amountExclVat,
    });

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "ApiKey": apiKey,
        "PartyID": partyId,
      },
      body: JSON.stringify(request),
    });

    const responseText = await response.text();
    let data: any;
    try {
      data = JSON.parse(responseText);
    } catch {
      data = { raw: responseText };
    }

    if (!response.ok) {
      console.error("Billit API error:", { status: response.status, data });
      return { 
        success: false, 
        error: data.message || data.errors?.[0]?.Code || "Failed to send Peppol invoice", 
        data 
      };
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
  const partyId = process.env.BILLIT_PARTY_ID || "1037520";
  
  if (!apiKey) {
    return false;
  }

  try {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/v1/peppol/lookup?vatNumber=${encodeURIComponent(vatNumber)}`, {
      headers: {
        "ApiKey": apiKey,
        "PartyID": partyId,
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
