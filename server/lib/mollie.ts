import { createRequire } from "module";
const require = createRequire(import.meta.url);

// Use require for CJS module
const mollieModule = require("@mollie/api-client");
const createMollieClient = mollieModule.createMollieClient || mollieModule.default;
const PaymentStatus = mollieModule.PaymentStatus;

const mollieClient = createMollieClient({
  apiKey: process.env.MOLLIE_API_KEY || "",
});

// Type for Payment
type Payment = any;

export const PRICING_PLANS = {
  "1-year": { years: 1, price: 156.0, discount: 0 },
  "2-year": { years: 2, price: 296.4, discount: 5 },
  "3-year": { years: 3, price: 421.2, discount: 10 },
} as const;

export type PlanId = keyof typeof PRICING_PLANS;

export interface CreatePaymentParams {
  profileId: string;
  accountId: string;
  planId: PlanId;
  profileName: string;
  redirectUrl: string;
}

export async function createMolliePayment(params: CreatePaymentParams): Promise<Payment> {
  const { profileId, accountId, planId, profileName, redirectUrl } = params;
  const plan = PRICING_PLANS[planId];
  
  if (!plan) {
    throw new Error(`Invalid plan: ${planId}`);
  }

  const payment = await mollieClient.payments.create({
    amount: {
      currency: "EUR",
      value: plan.price.toFixed(2),
    },
    description: `Zoek-een-tuinman.be - ${profileName} (${plan.years} jaar)`,
    redirectUrl,
    webhookUrl: `${process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : "https://zoek-een-tuinman.be"}/api/mollie/webhook`,
    metadata: {
      profileId,
      accountId,
      planId,
      years: plan.years,
    },
  });

  return payment;
}

export async function getMolliePayment(paymentId: string): Promise<Payment> {
  return await mollieClient.payments.get(paymentId);
}

export function isPaymentPaid(status: PaymentStatus): boolean {
  return status === PaymentStatus.paid;
}

export function isPaymentFailed(status: PaymentStatus): boolean {
  return [
    PaymentStatus.failed,
    PaymentStatus.canceled,
    PaymentStatus.expired,
  ].includes(status);
}

export function isPaymentPending(status: PaymentStatus): boolean {
  return [
    PaymentStatus.open,
    PaymentStatus.pending,
  ].includes(status);
}

export { mollieClient, PaymentStatus };
