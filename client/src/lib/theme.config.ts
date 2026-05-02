// Central Theme Configuration
// Easy to rebrand by changing values here

export const siteConfig = {
  // Brand Information
  name: "Zoek-een-tuinman.be",
  shortName: "Zoek-een-tuinman",
  description: "Vind de beste tuinmannen in België. Vergelijk profielen, lees reviews en vraag vrijblijvend offertes aan.",
  tagline: "Vind jouw perfecte tuinman in België",
  
  // SEO
  seoTitle: "Zoek-een-tuinman.be | De beste tuinmannen in België",
  seoDescription: "Zoek en vergelijk tuinmannen in jouw regio. Bekijk profielen, specialisaties en contacteer direct voor een offerte.",
  
  // URLs
  baseUrl: "https://www.zoek-een-tuinman.be",
  
  // Parent Company
  parentCompany: {
    name: "Zoek Lokaal",
    url: "https://zoek-lokaal.be",
  },
  
  // Contact (not displayed - users contact gardeners directly)
  email: "info@zoek-lokaal.be",
  
  // Social
  social: {
    facebook: "",
    instagram: "",
    linkedin: "",
  },
  
  // Business Type (for dynamic URLs)
  businessType: "tuinman",
  businessTypePlural: "tuinmannen",
  
  // URL Patterns
  urlPatterns: {
    category: "/zoek/{category}",
    categoryLocation: "/zoek/{category}/{location}",
    profile: "/bedrijf/{slug}",
  },
  
  // Country
  country: "België",
  defaultLanguage: "nl-BE",
  
  // Currency
  currency: "EUR",
  currencySymbol: "€",

  // Legal / Company details (used in privacy, terms, cookies).
  // Update these values per vertical before going live and have the legal
  // texts reviewed by a lawyer. Fields that still contain "[in te vullen…]"
  // trigger a soft notice on the legal pages so they stand out for review.
  legal: {
    companyName: "Zoek Lokaal",
    tradeName: "Zoek-een-tuinman.be",
    address: {
      street: "[in te vullen — straat + nummer]",
      postcode: "[in te vullen]",
      city: "[in te vullen]",
      country: "België",
    },
    vat: "[in te vullen — BTW-nummer]",
    companyNumber: "[in te vullen — ondernemingsnummer]",
    rpr: "[in te vullen — bevoegde ondernemingsrechtbank]",
    contactEmail: "info@zoek-lokaal.be",
    dpoEmail: "info@zoek-lokaal.be",
    dpa: {
      name: "Gegevensbeschermingsautoriteit",
      url: "https://www.gegevensbeschermingsautoriteit.be",
      address: "Drukpersstraat 35, 1000 Brussel",
    },
    governingLaw: "Belgisch recht",
    competentCourt: "[in te vullen — bevoegde rechtbank]",
    lastUpdated: "1 mei 2026",
  },
} as const;

// Returns true if any value in siteConfig.legal still contains an
// "[in te vullen" placeholder. Legal pages use this to surface a soft
// reviewer notice (DEV-only) so placeholders are easy to spot.
export function hasUnresolvedLegalPlaceholders(): boolean {
  return JSON.stringify(siteConfig.legal).includes("[in te vullen");
}

// Returns the value if it's filled in, otherwise null. Use this in legal
// pages so placeholder text is never rendered to end users — sentences
// that depend on a still-missing value are simply skipped.
export function legalValue(value: string): string | null {
  if (!value) return null;
  if (value.includes("[in te vullen")) return null;
  return value;
}

// Convenience: full company address as a single string, or null if any
// part of the address is still a placeholder.
export function legalAddress(): string | null {
  const a = siteConfig.legal.address;
  const parts = [a.street, `${a.postcode} ${a.city}`.trim(), a.country];
  if (parts.some((p) => !p || p.includes("[in te vullen"))) return null;
  return parts.join(", ");
}

export type SiteConfig = typeof siteConfig;
