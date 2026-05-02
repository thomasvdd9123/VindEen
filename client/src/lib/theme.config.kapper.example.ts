// Example rebrand: "Zoek-een-kapper.be" (Belgian hairdresser directory).
// To use: replace `client/src/lib/theme.config.ts` with this file's contents,
// then re-seed catalogs (see scripts/seed/seed-kapper-example.ts) and update
// <Route> entries in App.tsx so they match the new infoRoutes paths.
//
// This file is intentionally NOT imported anywhere — it exists as a template.

export const siteConfig = {
  name: "Zoek-een-kapper.be",
  shortName: "Zoek-een-kapper",
  description:
    "Vind de beste kappers in België. Vergelijk profielen, lees reviews en boek direct online.",
  tagline: "Vind jouw perfecte kapper in België",

  seoTitle: "Zoek-een-kapper.be | De beste kappers in België",
  seoDescription:
    "Zoek en vergelijk kappers in jouw regio. Bekijk profielen, specialisaties en boek direct.",

  baseUrl: "https://www.zoek-een-kapper.be",
  parentCompany: { name: "Zoek Lokaal", url: "https://zoek-lokaal.be" },
  email: "info@zoek-lokaal.be",
  social: { facebook: "", instagram: "", linkedin: "" },

  placeholders: {
    profileTitle: "bv. Dameskapper, Barbier",
    phone: "+32 xxx xx xx xx",
    website: "https://www.jouwsite.be",
  },
  emailBranding: {
    from: "Zoek-een-kapper.be <noreply@zoek-een-kapper.be>",
  },

  businessType: "kapper",
  businessTypePlural: "kappers",
  businessTypeArticle: "een kapper",
  businessTypeProfessional: "kapper",
  businessTypeProfessionalPlural: "kappers",

  urlPatterns: {
    category: "/zoek/{category}",
    categoryLocation: "/zoek/{category}/{location}",
    profile: "/bedrijf/{slug}",
  },

  country: "België",
  defaultLanguage: "nl-BE",
  totalMunicipalities: 572,
  currency: "EUR",
  currencySymbol: "€",

  footer: {
    categoryLinks: [
      { slug: "dameskapper", label: "Dameskappers" },
      { slug: "herenkapper", label: "Herenkappers" },
      { slug: "kinderkapper", label: "Kinderkappers" },
      { slug: "barbier", label: "Barbiers" },
    ],
    popularCities: [
      { postcode: "9000", slug: "gent", label: "Gent" },
      { postcode: "2000", slug: "antwerpen", label: "Antwerpen" },
      { postcode: "1000", slug: "brussel", label: "Brussel" },
      { postcode: "8000", slug: "brugge", label: "Brugge" },
    ],
  },

  infoRoutes: {
    aboutBusiness: "/info/de-kapper",
    findGoodBusiness: "/info/goede-kapper-vinden",
    pricing: "/info/kosten-prijzen",
    forBusinesses: "/info/voor-kappers",
  },

  homepage: {
    quickStartLinks: [
      { title: "De kapper", href: "/info/de-kapper" },
      { title: "Hoe vind ik een goede kapper?", href: "/info/goede-kapper-vinden" },
      { title: "Welke kapsels zijn populair?", href: "/info/populaire-kapsels" },
      { title: "Verschil tussen kapper en barbier?", href: "/info/kapper-vs-barbier" },
      { title: "Kosten & prijzen", href: "/info/kosten-prijzen" },
      { title: "Artikelen", href: "/artikelen" },
      { title: "Veelgestelde vragen (FAQ)", href: "/faq" },
    ],
    experienceLinks: [
      { title: "Lees ervaringen van anderen", href: "/ervaringen" },
    ],
    featuredHeading: "Vind de juiste kapper",
    featuredBody:
      "Bekijk onze uitgelichte kappers en ontdek wie het beste bij jouw stijl past.",
    featuredImageAlt: "Kapper aan het werk",
    ctaTitle: "Ben je kapper?",
    ctaInfoHref: "/info/voor-kappers",
    ctaInfoLabel: "Meer informatie",
  },

  faq: {
    forCustomersTitle: "Voor klanten",
    forBusinessesTitle: "Voor kappers",
    generalTitle: "Algemeen",
    forCustomers: [
      {
        question: "Hoe vind ik een kapper in mijn regio?",
        answer:
          "Gebruik de zoekfunctie op onze homepage. Vul je gemeente of postcode in en bekijk alle kappers in jouw omgeving.",
      },
      {
        question: "Is het gratis om een kapper te zoeken?",
        answer: "Ja, zoeken en bekijken van profielen is volledig gratis.",
      },
    ],
    forBusinesses: [
      {
        question: "Hoe meld ik mijn kapsalon aan?",
        answer:
          "Registreer gratis, vul je profiel in en kies een abonnement. Na verificatie ben je zichtbaar.",
      },
    ],
    general: [
      {
        question: "Wat is {siteName}?",
        answer:
          "{siteName} is het grootste online platform om {plural} te vinden in {country}.",
      },
      {
        question: "In welke regio's zijn jullie actief?",
        answer:
          "We zijn actief in heel {country}. Je kunt zoeken in alle {totalMunicipalities} gemeenten.",
      },
    ],
  },

  legal: {
    companyName: "Zoek Lokaal",
    tradeName: "Zoek-een-kapper.be",
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

export function fillCopy(template: string): string {
  return template
    .replace(/\{plural\}/g, siteConfig.businessTypePlural)
    .replace(/\{singular\}/g, siteConfig.businessType)
    .replace(/\{article\}/g, siteConfig.businessTypeArticle)
    .replace(/\{professional\}/g, siteConfig.businessTypeProfessional)
    .replace(/\{professionalPlural\}/g, siteConfig.businessTypeProfessionalPlural)
    .replace(/\{siteName\}/g, siteConfig.name)
    .replace(/\{country\}/g, siteConfig.country)
    .replace(/\{totalMunicipalities\}/g, String(siteConfig.totalMunicipalities));
}

export function formatPrice(amount: number, opts: { withCents?: boolean } = {}): string {
  const withCents = opts.withCents ?? amount % 1 !== 0;
  const fixed = withCents ? amount.toFixed(2) : String(Math.round(amount));
  return `${siteConfig.currencySymbol}${fixed.replace(".", ",")}`;
}

export function hasUnresolvedLegalPlaceholders(): boolean {
  return JSON.stringify(siteConfig.legal).includes("[in te vullen");
}

export function legalValue(value: string): string | null {
  if (!value) return null;
  if (value.includes("[in te vullen")) return null;
  return value;
}
