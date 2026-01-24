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
} as const;

export type SiteConfig = typeof siteConfig;
