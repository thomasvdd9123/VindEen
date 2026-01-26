async function registerCompany() {
  const apiKey = process.env.BILLIT_API_KEY;
  // Use sandbox URL
  const baseUrl = "https://api.sandbox.billit.be";
  
  console.log("Registering company with Billit...");
  console.log("API Key first 8 chars:", apiKey?.slice(0, 8));
  console.log("API Key last 4 chars:", apiKey?.slice(-4));
  
  // Use the main Billit API endpoint for company registration
  const registrationData = {
    Company: {
      Name: "Vanden Driesch, Thomas",
      CommercialName: "Zoek-een-tuinman.be",
      VATNumber: "BE0791920272",
      Street: "Baron d'Eynattenstraat",
      StreetNumber: "4",
      Zipcode: "3000",
      City: "Leuven",
      CountryCode: "BE",
      IBAN: "BE37363162405928",
      BIC: "BBRUBEBB",
      Email: "thomasvandendriesch@gmail.com",
      Mobile: "+32488359756",
      ContactFirstName: "Thomas",
      ContactLastName: "Vanden Driesch",
      Language: "NL",
      VATLiable: true,
      VATDeductable: true,
      Addresses: [
        {
          AddressType: "InvoiceAddress",
          Name: "Vanden Driesch, Thomas",
          Street: "Baron d'Eynattenstraat",
          StreetNumber: "4",
          Zipcode: "3000",
          City: "Leuven",
          CountryCode: "BE"
        }
      ]
    }
  };
  
  console.log("Using endpoint:", `${baseUrl}/v1/account/registercompany`);
  console.log("Registration data:", JSON.stringify(registrationData, null, 2));
  
  try {
    const response = await fetch(`${baseUrl}/v1/account/registercompany`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
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
