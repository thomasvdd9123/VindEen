// Central Theme Configuration
// Easy to rebrand by changing values here

export const siteConfig = {
  // Brand Information
  name: "Tuinmanvinden.be",
  shortName: "Tuinmanvinden",
  description: "Vind de beste tuinmannen in België. Vergelijk profielen, lees reviews en vraag vrijblijvend offertes aan.",
  tagline: "Vind jouw perfecte tuinman in België",
  
  // SEO
  seoTitle: "Tuinmanvinden.be | De beste tuinmannen in België",
  seoDescription: "Zoek en vergelijk tuinmannen in jouw regio. Bekijk profielen, specialisaties en contacteer direct voor een offerte.",
  
  // URLs
  baseUrl: "https://tuinmanvinden.be",
  
  // Contact
  email: "info@tuinmanvinden.be",
  
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
