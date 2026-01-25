import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface PaymentConfirmationEmail {
  to: string;
  profileName: string;
  amount: string;
  years: number;
  endDate: Date;
}

export async function sendPaymentConfirmationEmail({
  to,
  profileName,
  amount,
  years,
  endDate,
}: PaymentConfirmationEmail) {
  if (!process.env.RESEND_API_KEY) {
    console.log("Resend API key not configured, skipping email");
    return null;
  }

  const formattedEndDate = endDate.toLocaleDateString("nl-BE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  try {
    const { data, error } = await resend.emails.send({
      from: "Zoek-een-tuinman.be <noreply@zoek-een-tuinman.be>",
      to: [to],
      subject: `Betalingsbevestiging - ${profileName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #1B7340; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
            .detail-row:last-child { border-bottom: none; }
            .label { color: #666; }
            .value { font-weight: bold; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
            .success-icon { font-size: 48px; margin-bottom: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="success-icon">✓</div>
              <h1 style="margin: 0;">Betaling Geslaagd!</h1>
            </div>
            <div class="content">
              <p>Beste klant,</p>
              <p>Hartelijk dank voor uw betaling. Uw profiel is nu actief op Zoek-een-tuinman.be!</p>
              
              <div class="details">
                <div class="detail-row">
                  <span class="label">Profiel:</span>
                  <span class="value">${profileName}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Bedrag:</span>
                  <span class="value">€${amount}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Periode:</span>
                  <span class="value">${years} jaar</span>
                </div>
                <div class="detail-row">
                  <span class="label">Geldig tot:</span>
                  <span class="value">${formattedEndDate}</span>
                </div>
              </div>

              <p>Uw profiel is nu zichtbaar voor potentiële klanten. U kunt uw profiel beheren via uw dashboard.</p>
              
              <p>Met vriendelijke groeten,<br>Het Zoek-een-tuinman.be Team</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Zoek-een-tuinman.be - Alle rechten voorbehouden</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      return null;
    }

    console.log("Payment confirmation email sent:", data?.id);
    return data;
  } catch (err) {
    console.error("Failed to send email:", err);
    return null;
  }
}
