async function registerCompany() {
  const apiKey = process.env.BILLIT_API_KEY;
  const baseUrl = process.env.BILLIT_SANDBOX === "true" 
    ? "https://api.sandbox.billit.be" 
    : "https://api.billit.be";
  
  console.log("Registering company with Billit...");
  console.log("URL:", `${baseUrl}/v1/einvoices/registrations`);
  
  const registrationData = {
    TaxIdentifier: process.env.PEPPOL_SUPPLIER_VAT || "BE0791920272",
    CompanyName: process.env.PEPPOL_SUPPLIER_NAME || "Vanden Driesch, Thomas",
    CommercialName: "Zoek-een-tuinman.be",
    TaxDeductable: true,
    TaxLiable: true,
    IBAN: process.env.PEPPOL_SUPPLIER_IBAN || "BE37363162405928",
    BIC: process.env.PEPPOL_SUPPLIER_BIC || "BBRUBEBB",
    Email: "thomasvandendriesch@gmail.com",
    ContactFirstName: "Thomas",
    ContactLastName: "Vanden Driesch",
    Language: "NL",
    Addresses: [
      {
        AddressType: "InvoiceAddress",
        Name: process.env.PEPPOL_SUPPLIER_NAME || "Vanden Driesch, Thomas",
        Street: process.env.PEPPOL_SUPPLIER_STREET || "Baron d'Eynattenstraat",
        StreetNumber: process.env.PEPPOL_SUPPLIER_NUMBER || "4",
        Zipcode: process.env.PEPPOL_SUPPLIER_POSTCODE || "3000",
        City: process.env.PEPPOL_SUPPLIER_CITY || "Leuven",
        CountryCode: "BE"
      }
    ]
  };
  
  console.log("Registration data:", JSON.stringify(registrationData, null, 2));
  
  try {
    const response = await fetch(`${baseUrl}/v1/einvoices/registrations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": apiKey!,
      },
      body: JSON.stringify(registrationData),
    });
    
    const data = await response.text();
    console.log("\nResponse status:", response.status);
    console.log("Response:", data);
    
    if (response.ok) {
      console.log("\n✅ Registration successful!");
      try {
        const json = JSON.parse(data);
        if (json.RegistrationID || json.PartyID || json.Id) {
          console.log("PartyID/RegistrationID:", json.RegistrationID || json.PartyID || json.Id);
          console.log("\n⚠️ SAVE THIS ID - you need to add it as BILLIT_PARTY_ID environment variable!");
        }
      } catch (e) {}
    } else {
      console.log("\n❌ Registration failed");
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

registerCompany();
