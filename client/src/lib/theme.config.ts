// Central Theme Configuration
// Easy to rebrand by changing values here.
//
// CONVENTIONS
// - Use {plural} / {singular} placeholders inside copy strings; runtime helpers
//   below replace them with siteConfig.businessTypePlural / .businessType.
// - Vertical-specific link slugs (footer categories, popular city links) live
//   here so a rebrand only touches this file + the database seed.

export const siteConfig = {
  // Brand Information
  name: "Zoek-een-tuinman.be",
  shortName: "Zoek-een-tuinman",
  description:
    "Vind de beste tuinmannen in België. Vergelijk profielen, lees reviews en vraag vrijblijvend offertes aan.",
  tagline: "Vind jouw perfecte tuinman in België",

  // SEO
  seoTitle: "Zoek-een-tuinman.be | De beste tuinmannen in België",
  seoDescription:
    "Zoek en vergelijk tuinmannen in jouw regio. Bekijk profielen, specialisaties en contacteer direct voor een offerte.",

  // URLs
  baseUrl: "https://www.zoek-een-tuinman.be",

  // Parent Company
  parentCompany: { name: "Zoek Lokaal", url: "https://zoek-lokaal.be" },

  // Contact (not displayed - users contact gardeners directly)
  email: "info@zoek-lokaal.be",

  // Social
  social: { facebook: "", instagram: "", linkedin: "" },

  // Business Type
  businessType: "tuinman",
  businessTypePlural: "tuinmannen",
  businessTypeArticle: "een tuinman", // article + singular ("een tuinman", "een hovenier")
  businessTypeProfessional: "tuinprofessional", // for "tuinprofessionals" copy
  businessTypeProfessionalPlural: "tuinprofessionals",

  // URL Patterns
  urlPatterns: {
    category: "/zoek/{category}",
    categoryLocation: "/zoek/{category}/{location}",
    profile: "/bedrijf/{slug}",
  },

  // Country / Locale
  country: "België",
  defaultLanguage: "nl-BE",
  totalMunicipalities: 572,

  // Currency
  currency: "EUR",
  currencySymbol: "€",

  // Footer / Header config — vertical-specific lists.
  // To rebrand: replace these arrays. The actual category slugs must exist as
  // service_category rows in the DB; cities must be valid service_area slugs.
  footer: {
    // Top-level categories shown in footer. Use slugs that route to /zoek/{slug}
    // through CategoryPage's specialization-only flow OR existing landing pages.
    categoryLinks: [
      { slug: "tuinaanlegger", label: "Tuinaanleggers" },
      { slug: "tuinarchitect", label: "Tuinarchitecten" },
      { slug: "hovenier", label: "Hoveniers" },
      { slug: "boomverzorger", label: "Boomverzorgers" },
    ],
    // Popular city links (postcode + slug → /zoek/{postcode}-{slug})
    popularCities: [
      { postcode: "9000", slug: "gent", label: "Gent" },
      { postcode: "2000", slug: "antwerpen", label: "Antwerpen" },
      { postcode: "1000", slug: "brussel", label: "Brussel" },
      { postcode: "8000", slug: "brugge", label: "Brugge" },
    ],
  },

  // Info-page routes registered in App.tsx. Keep these in sync with the
  // <Route> entries when rebranding so generated links never 404.
  infoRoutes: {
    aboutBusiness: "/info/de-tuinman",
    findGoodBusiness: "/info/goede-tuinman-vinden",
    pricing: "/info/kosten-prijzen",
    forBusinesses: "/info/voor-tuinmannen",
  },

  // Homepage "Snel starten" + "Ervaringen" links
  homepage: {
    quickStartLinks: [
      { title: "De tuinman", href: "/info/de-tuinman" },
      { title: "Hoe vind ik een goede tuinman?", href: "/info/goede-tuinman-vinden" },
      { title: "Hoe werkt tuinaanleg?", href: "/info/hoe-werkt-tuinaanleg" },
      { title: "Verschil tussen tuinman en hovenier?", href: "/info/tuinman-vs-hovenier" },
      { title: "Kosten & prijzen", href: "/info/kosten-prijzen" },
      { title: "Artikelen", href: "/artikelen" },
      { title: "Veelgestelde vragen (FAQ)", href: "/faq" },
    ],
    experienceLinks: [
      {
        title: "Lees wat tuinprojecten reeds betekend hebben voor anderen",
        href: "/ervaringen",
      },
    ],
    featuredHeading: "Vind de juiste tuinman",
    featuredBody:
      "Bekijk onze uitgelichte professionals en ontdek wie het beste bij jouw project past.",
    featuredImageAlt: "Tuinman aan het werk",
    ctaTitle: "Ben je tuinman?",
    ctaInfoHref: "/info/voor-tuinmannen",
    ctaInfoLabel: "Meer informatie",
  },

  // FAQ: structured Q&A grouped by audience.
  // Plain-text only — no HTML.
  faq: {
    forCustomersTitle: "Voor klanten",
    forBusinessesTitle: "Voor tuinmannen",
    generalTitle: "Algemeen",
    forCustomers: [
      {
        question: "Hoe vind ik een tuinman in mijn regio?",
        answer:
          "Gebruik de zoekfunctie op onze homepage. Vul je gemeente of postcode in en bekijk alle beschikbare tuinmannen in jouw omgeving. Je kunt filteren op specialisatie om precies te vinden wat je nodig hebt.",
      },
      {
        question: "Is het gratis om een tuinman te zoeken?",
        answer:
          "Ja, het zoeken en bekijken van profielen is volledig gratis. Je kunt onbeperkt profielen bekijken en contact opnemen met tuinmannen.",
      },
      {
        question: "Hoe neem ik contact op met een tuinman?",
        answer:
          "Op elk profiel vind je een contactformulier. Vul je gegevens in en beschrijf kort wat je nodig hebt. De tuinman ontvangt je bericht en neemt contact met je op.",
      },
      {
        question: "Wat kost een tuinman gemiddeld?",
        answer:
          "Tarieven variëren per regio en type werk. Gemiddeld rekenen tuinmannen €35-€50 per uur voor standaard onderhoud. Voor meer gedetailleerde prijsinformatie, bekijk onze pagina over kosten en prijzen.",
      },
      {
        question: "Zijn de tuinmannen op dit platform betrouwbaar?",
        answer:
          "Wij verifiëren alle tuinmannen op ons platform. Je ziet bij elk profiel of deze geverifieerd is. We raden altijd aan om referenties te vragen en een schriftelijke offerte te ontvangen.",
      },
    ],
    forBusinesses: [
      {
        question: "Hoe kan ik mij aanmelden als tuinman?",
        answer:
          "Registreer je gratis via de 'Registreren' knop. Na het aanmaken van je account kun je je bedrijfsprofiel invullen met je specialisaties, foto's en contactgegevens.",
      },
      {
        question: "Wat kost een vermelding op dit platform?",
        answer:
          "Bekijk onze prijzenpagina voor de actuele abonnementen. Je maakt eerst gratis een account aan en kiest daarna een abonnement dat bij je past.",
      },
      {
        question: "Hoe word ik geverifieerd?",
        answer:
          "Na het volledig invullen van je profiel wordt dit door ons team beoordeeld. We controleren of alle gegevens kloppen en of je een actief bedrijf hebt. Dit proces duurt meestal 1-2 werkdagen.",
      },
      {
        question: "Hoe ontvang ik contactaanvragen?",
        answer:
          "Wanneer een klant contact opneemt via je profiel, ontvang je een e-mail met de aanvraag. Je kunt alle aanvragen ook bekijken in je persoonlijke dashboard.",
      },
      {
        question: "Kan ik mijn profiel tijdelijk verbergen?",
        answer:
          "Ja, in je dashboard kun je je profiel op 'inactief' zetten. Je profiel blijft bestaan maar is niet zichtbaar voor bezoekers totdat je het weer activeert.",
      },
    ],
    general: [
      {
        question: "Wat is {siteName}?",
        answer:
          "{siteName} is het grootste online platform om tuinprofessionals te vinden in {country}. We verbinden klanten met betrouwbare tuinmannen, hoveniers en tuinaannemers in heel het land.",
      },
      {
        question: "In welke regio's zijn jullie actief?",
        answer:
          "We zijn actief in heel {country}. Je kunt zoeken in alle {totalMunicipalities} gemeenten.",
      },
      {
        question: "Verwerken jullie mijn gegevens veilig?",
        answer:
          "Ja, we nemen privacy zeer serieus. Al je gegevens worden veilig opgeslagen en verwerkt volgens de GDPR-richtlijnen. Lees ons privacybeleid voor meer informatie.",
      },
    ],
  },

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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Replace {plural}, {singular}, {siteName}, {country}, {totalMunicipalities},
// {professional}, {professionalPlural} placeholders inside any string.
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

// Format an amount as the configured currency. Belgian-style: comma decimal.
export function formatPrice(amount: number, opts: { withCents?: boolean } = {}): string {
  const withCents = opts.withCents ?? amount % 1 !== 0;
  const fixed = withCents ? amount.toFixed(2) : String(Math.round(amount));
  return `${siteConfig.currencySymbol}${fixed.replace(".", ",")}`;
}

// Returns true if any value in siteConfig.legal still contains an
// "[in te vullen" placeholder. Legal pages use this to surface a soft
// reviewer notice (DEV-only) so placeholders are easy to spot.
export function hasUnresolvedLegalPlaceholders(): boolean {
  return JSON.stringify(siteConfig.legal).includes("[in te vullen");
}

export function legalValue(value: string): string | null {
  if (!value) return null;
  if (value.includes("[in te vullen")) return null;
  return value;
}

export function legalAddress(): string | null {
  const a = siteConfig.legal.address;
  const parts = [a.street, `${a.postcode} ${a.city}`.trim(), a.country];
  if (parts.some((p) => !p || p.includes("[in te vullen"))) return null;
  return parts.join(", ");
}

export type SiteConfig = typeof siteConfig;
