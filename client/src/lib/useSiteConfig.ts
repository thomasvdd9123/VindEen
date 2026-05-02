import { useQuery } from "@tanstack/react-query";
import { siteConfig as themeConfig } from "./theme.config";

export interface SiteConfigResponse {
  id: string;
  siteName: string;
  siteTagline: string | null;
  supportEmail: string;
  defaultCountryCode: string;
  defaultCountryName: string;
  defaultCountryId: string | null;
  defaultRegion: string | null;
  defaultLanguage: string;
  defaultCurrencyCode: string;
  defaultVatPercentage: number;
  companyLegalName: string | null;
  defaultPractitionerTypeId: string | null;
  defaultSubscriptionPlanId: string | null;
  postcodePattern: string | null;
  phonePattern: string | null;
  phoneCountryCode: string | null;
  updatedAt: string;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  EUR: "€",
  USD: "$",
  GBP: "£",
  CHF: "CHF",
};

export function useSiteConfig() {
  const query = useQuery<SiteConfigResponse>({
    queryKey: ["/api/site-config"],
    staleTime: 5 * 60 * 1000,
  });

  const currencyCode = query.data?.defaultCurrencyCode ?? themeConfig.currency;
  const currencySymbol = CURRENCY_SYMBOLS[currencyCode] ?? themeConfig.currencySymbol;
  const country = query.data?.defaultCountryName ?? themeConfig.country;
  const language = query.data?.defaultLanguage ?? themeConfig.defaultLanguage;
  const vatPercentage = query.data?.defaultVatPercentage ?? 21;
  const postcodePattern = query.data?.postcodePattern ?? null;
  const phonePattern = query.data?.phonePattern ?? null;
  const phoneCountryCode = query.data?.phoneCountryCode ?? null;
  const defaultSubscriptionPlanId = query.data?.defaultSubscriptionPlanId ?? null;
  const defaultPractitionerTypeId = query.data?.defaultPractitionerTypeId ?? null;

  function formatPrice(amount: number, opts: { withCents?: boolean } = {}) {
    const withCents = opts.withCents ?? amount % 1 !== 0;
    const fixed = withCents ? amount.toFixed(2) : String(Math.round(amount));
    return `${currencySymbol}${fixed.replace(".", ",")}`;
  }

  return {
    ...query,
    siteConfig: query.data ?? null,
    currencyCode,
    currencySymbol,
    country,
    language,
    vatPercentage,
    postcodePattern,
    phonePattern,
    phoneCountryCode,
    defaultSubscriptionPlanId,
    defaultPractitionerTypeId,
    formatPrice,
  };
}
