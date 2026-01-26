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

function isSandbox(): boolean {
  return process.env.BILLIT_SANDBOX === "true";
}

function getBaseUrl(): string {
  return isSandbox() ? BILLIT_SANDBOX_URL : BILLIT_PRODUCTION_URL;
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export async function sendPeppolInvoice(params: SendPeppolInvoiceParams): Promise<{ success: boolean; error?: string; data?: any }> {
  const apiKey = process.env.BILLIT_API_KEY;
  const partyId = process.env.BILLIT_PARTY_ID;
  const sandbox = isSandbox();
  
  if (!apiKey) {
    console.log("Billit API key not configured, skipping Peppol invoice");
    return { success: false, error: "Billit API key not configured" };
  }

  const order: BillitOrder = {
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
  };

  try {
    const baseUrl = getBaseUrl();
    let endpoint: string;
    let requestBody: any;

    if (sandbox) {
      endpoint = `${baseUrl}/v1/einvoices/registrations/${partyId}/commands/send`;
      requestBody = { TransportType: "Peppol", Order: order };
    } else {
      endpoint = `${baseUrl}/v1/peppol/sendOrder`;
      requestBody = order;
    }
    
    console.log("Sending Peppol invoice to Billit:", {
      endpoint,
      sandbox,
      invoiceNumber: params.invoiceNumber,
      customer: params.customerName,
      vatNumber: params.customerVatNumber,
      amount: params.amountExclVat,
    });

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "ApiKey": apiKey,
    };
    if (partyId) {
      headers["PartyID"] = partyId;
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
    });

    const responseText = await response.text();
    let data: any;
    try {
      data = JSON.parse(responseText);
    } catch {
      data = { OrderID: responseText };
    }

    if (!response.ok) {
      const errorCode = data?.errors?.[0]?.Code;
      if (errorCode === "TheCustomerIsNotActiveOnPeppol") {
        console.log(`Peppol invoice skipped: Customer ${params.customerVatNumber} is not registered on Peppol network`);
        return { success: false, error: "Customer not on Peppol", data };
      }
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
  const partyId = process.env.BILLIT_PARTY_ID;
  
  if (!apiKey) {
    return false;
  }

  try {
    const baseUrl = getBaseUrl();
    const headers: Record<string, string> = { "ApiKey": apiKey };
    if (partyId) {
      headers["PartyID"] = partyId;
    }

    const response = await fetch(`${baseUrl}/v1/peppol/participantInformation/${encodeURIComponent(vatNumber)}`, {
      headers,
    });

    if (response.ok) {
      const data = await response.json();
      return data.Registered === true;
    }
    return false;
  } catch {
    return false;
  }
}
