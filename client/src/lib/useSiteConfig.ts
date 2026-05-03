import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
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
  // Vertical/branding overrides die per verticaal kunnen variëren. Admins
  // kunnen deze in /admin/instellingen aanpassen — frontend merget dit over
  // theme.config.ts heen via useThemeCopy().
  themeCopy: Record<string, any> | null;
  // Bumpt elke keer dat site_config wordt aangepast (DB-trigger). Publieke
  // clients pollen /api/site-config/version en herfetchen wanneer dit wijzigt.
  cacheVersion: number;
  updatedAt: string;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  EUR: "€",
  USD: "$",
  GBP: "£",
  CHF: "CHF",
};

export function useSiteConfig() {
  const qc = useQueryClient();
  // Hoofdfetch: cached voor 5 min, refetch bij window-focus.
  const query = useQuery<SiteConfigResponse>({
    queryKey: ["/api/site-config"],
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: true,
  });
  // Lichtgewicht versiepoll elke 60s — wanneer cacheVersion wijzigt, invalideren
  // we de hoofdcache zodat publieke clients admin-aanpassingen direct zien
  // zonder altijd de volledige site-config opnieuw op te halen.
  const versionQuery = useQuery<{ cacheVersion: number }>({
    queryKey: ["/api/site-config/version"],
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
    staleTime: 30_000,
  });
  useEffect(() => {
    const remoteV = versionQuery.data?.cacheVersion;
    const localV = query.data?.cacheVersion;
    if (remoteV !== undefined && localV !== undefined && remoteV !== localV) {
      qc.invalidateQueries({ queryKey: ["/api/site-config"] });
    }
  }, [versionQuery.data?.cacheVersion, query.data?.cacheVersion, qc]);

  const currencyCode = query.data?.defaultCurrencyCode ?? themeConfig.currency;
  const currencySymbol = CURRENCY_SYMBOLS[currencyCode] ?? themeConfig.currencySymbol;
  const country = query.data?.defaultCountryName ?? themeConfig.country;
  const countryCode = query.data?.defaultCountryCode ?? "BE";
  const language = query.data?.defaultLanguage ?? themeConfig.defaultLanguage;
  const vatPercentage = query.data?.defaultVatPercentage ?? null;
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
    countryCode,
    language,
    vatPercentage,
    postcodePattern,
    phonePattern,
    phoneCountryCode,
    defaultSubscriptionPlanId,
    defaultPractitionerTypeId,
    themeCopy: query.data?.themeCopy ?? null,
    cacheVersion: query.data?.cacheVersion ?? 0,
    formatPrice,
  };
}

// Helper die DB-overrides (themeCopy) merget over de file-defaults uit
// theme.config.ts. Gebruik deze in plaats van rechtstreekse imports wanneer
// je vertical-specifieke copy/labels nodig hebt — zo wordt rebrand zonder
// deploy mogelijk.
export function useThemeCopy(): typeof themeConfig & Record<string, any> {
  const { themeCopy } = useSiteConfig();
  if (!themeCopy) return themeConfig;
  return { ...themeConfig, ...themeCopy };
}
