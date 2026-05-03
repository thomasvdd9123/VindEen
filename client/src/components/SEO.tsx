import { Helmet } from "react-helmet-async";
import { siteConfig } from "@/lib/theme.config";
import { useSiteConfig } from "@/lib/useSiteConfig";

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  noindex?: boolean;
  ogType?: "website" | "article" | "profile";
  ogImage?: string;
  structuredData?: object | object[];
}

const BASE_URL = siteConfig.baseUrl;

export function SEO({
  title,
  description,
  canonical,
  noindex = false,
  ogType = "website",
  ogImage,
  structuredData,
}: SEOProps) {
  const { siteName, siteTagline } = useSiteConfig();
  const fullTitle = title 
    ? `${title} | ${siteName}`
    : `${siteName} | ${siteTagline ?? siteConfig.tagline}`;
  
  const metaDescription = description || siteConfig.description;
  const canonicalUrl = canonical ? `${BASE_URL}${canonical}` : undefined;
  const defaultOgImage = (siteConfig as { ogImage?: string }).ogImage ?? "/og-image.png";
  const imageUrl = ogImage || `${BASE_URL}${defaultOgImage}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      
      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow" />
      )}
      
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
      
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:type" content={ogType} />
      <meta property="og:locale" content="nl_BE" />
      <meta property="og:site_name" content={siteName} />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      <meta property="og:image" content={imageUrl} />
      
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={imageUrl} />
      
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(
            Array.isArray(structuredData) 
              ? structuredData 
              : structuredData
          )}
        </script>
      )}
    </Helmet>
  );
}

export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": `${siteConfig.baseUrl}${item.url}`,
    })),
  };
}

export function generateLocalBusinessSchema(profile: {
  name: string;
  description?: string;
  slug: string;
  profileImageUrl?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  offices?: Array<{
    street?: string | null;
    number?: string | null;
    town?: string | null;
    postcode?: string | null;
    province?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  }>;
  experienceYears?: number | null;
  /** Slugs — kept for backwards compatibility. Prefer `specializationLabels`. */
  specializations?: string[];
  /** Human-readable specialization labels (Dutch). Used for `knowsAbout` and
   *  to build a `hasOfferCatalog` so AI/SEO consumers see real services, not slugs. */
  specializationLabels?: string[];
  /** Spoken languages from the practical block. */
  languages?: string[];
  /** Hourly rate in EUR if available. Drives `priceRange`. */
  hourlyRateEur?: number | null;
  openingHours?: string[];
}) {
  const office = profile.offices?.[0];
  const country = siteConfig.country;
  const countryCode = siteConfig.legal?.address?.countryCode || "BE";

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": profile.name,
    "description":
      profile.description ||
      `${profile.name} – ${siteConfig.businessTypeProfessional} in ${country}.`,
    "url": `${siteConfig.baseUrl}/bedrijf/${profile.slug}`,
    "@id": `${siteConfig.baseUrl}/bedrijf/${profile.slug}#business`,
  };

  if (profile.profileImageUrl) {
    schema.image = profile.profileImageUrl;
  }

  if (profile.phone) {
    schema.telephone = profile.phone;
  }

  if (profile.email) {
    schema.email = profile.email;
  }

  if (profile.website) {
    schema.sameAs = [profile.website];
  }

  if (office) {
    const street = [office.street, office.number].filter(Boolean).join(" ");
    schema.address = {
      "@type": "PostalAddress",
      "streetAddress": street || undefined,
      "addressLocality": office.town || undefined,
      "postalCode": office.postcode || undefined,
      "addressRegion": office.province || undefined,
      "addressCountry": countryCode,
    };
    if (
      typeof office.latitude === "number" &&
      typeof office.longitude === "number"
    ) {
      schema.geo = {
        "@type": "GeoCoordinates",
        "latitude": office.latitude,
        "longitude": office.longitude,
      };
    }
  }

  if (profile.openingHours && profile.openingHours.length > 0) {
    schema.openingHours = profile.openingHours;
  }

  if (profile.experienceYears && profile.experienceYears > 0) {
    schema.foundingDate = new Date().getFullYear() - profile.experienceYears;
  }

  // Prefer human-readable labels over slugs for knowsAbout, and additionally
  // expose them as a structured OfferCatalog — that is what Google + AI
  // consumers actually parse to understand "what services does this business
  // offer". Falls back to slugs if labels weren't provided (legacy callers).
  const skillLabels = profile.specializationLabels?.length
    ? profile.specializationLabels
    : profile.specializations;
  if (skillLabels && skillLabels.length > 0) {
    schema.knowsAbout = skillLabels;
    schema.hasOfferCatalog = {
      "@type": "OfferCatalog",
      "name": `Diensten van ${profile.name}`,
      "itemListElement": skillLabels.map((label) => ({
        "@type": "Offer",
        "itemOffered": { "@type": "Service", "name": label },
      })),
    };
  }

  if (profile.languages && profile.languages.length > 0) {
    schema.knowsLanguage = profile.languages;
  }

  // areaServed: prefer the actual city + region the business operates from
  // over a vague "Belgium". Falls back to country when no office is known.
  if (office?.town) {
    schema.areaServed = {
      "@type": "City",
      "name": office.town,
      ...(office.postcode ? { "postalCode": office.postcode } : {}),
      "addressCountry": countryCode,
    };
  } else {
    schema.areaServed = { "@type": "Country", "name": country };
  }

  // priceRange: convert real hourly rate to Schema.org's $..$$$ symbol scale
  // when known. Belgian gardener market: <40 €/h = $, 40–70 = $$, >70 = $$$.
  if (typeof profile.hourlyRateEur === "number" && profile.hourlyRateEur > 0) {
    schema.priceRange =
      profile.hourlyRateEur < 40 ? "$" : profile.hourlyRateEur > 70 ? "$$$" : "$$";
  } else {
    schema.priceRange = "$$";
  }

  return schema;
}

export function generateOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": siteConfig.name,
    "url": siteConfig.baseUrl,
    "logo": `${siteConfig.baseUrl}/logo.png`,
    "description": siteConfig.description,
    "areaServed": {
      "@type": "Country",
      "name": siteConfig.country,
    },
    "sameAs": [],
  };
}

export function generateWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": siteConfig.name,
    "url": siteConfig.baseUrl,
    "description": siteConfig.description,
    "inLanguage": "nl-BE",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${siteConfig.baseUrl}/zoek/alle?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function generateSearchResultsSchema(params: {
  location?: string;
  specialization?: string;
  totalResults: number;
  items?: Array<{ name: string; slug: string }>;
}) {
  const plural = siteConfig.businessTypePlural;
  const country = siteConfig.country;
  const name = params.location
    ? `${plural[0].toUpperCase()}${plural.slice(1)} in ${params.location}${
        params.specialization ? ` – ${params.specialization}` : ""
      }`
    : params.specialization
      ? `${plural[0].toUpperCase()}${plural.slice(1)} gespecialiseerd in ${params.specialization}`
      : `Alle ${plural} in ${country}`;

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": name,
    "numberOfItems": params.totalResults,
    "itemListOrder": "https://schema.org/ItemListUnordered",
  };

  if (params.items && params.items.length > 0) {
    schema.itemListElement = params.items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "url": `${siteConfig.baseUrl}/bedrijf/${item.slug}`,
    }));
  }

  return schema;
}
