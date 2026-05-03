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
  const imageUrl = ogImage || `${BASE_URL}/og-image.png`;

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
    houseNumber?: string | null;
    city?: string | null;
    postcode?: string | null;
    province?: string | null;
  }>;
  experienceYears?: number | null;
  specializations?: string[];
}) {
  const office = profile.offices?.[0];
  
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": profile.name,
    "description": profile.description || `${profile.name} - Professionele tuinman in België`,
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
    schema.address = {
      "@type": "PostalAddress",
      "streetAddress": [office.street, office.houseNumber].filter(Boolean).join(" ") || undefined,
      "addressLocality": office.city || undefined,
      "postalCode": office.postcode || undefined,
      "addressRegion": office.province || undefined,
      "addressCountry": siteConfig.legal?.address?.countryCode || "BE",
    };
  }
  
  if (profile.experienceYears && profile.experienceYears > 0) {
    schema.foundingDate = new Date().getFullYear() - profile.experienceYears;
  }
  
  if (profile.specializations && profile.specializations.length > 0) {
    schema.knowsAbout = profile.specializations;
  }
  
  schema.areaServed = {
    "@type": "Country",
    "name": "Belgium",
  };
  
  schema.priceRange = "$$";
  
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
      "name": "Belgium",
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
}) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": params.location 
      ? `Tuinmannen in ${params.location}${params.specialization ? ` - ${params.specialization}` : ""}`
      : params.specialization 
        ? `Tuinmannen gespecialiseerd in ${params.specialization}`
        : "Alle tuinmannen in België",
    "numberOfItems": params.totalResults,
    "itemListOrder": "https://schema.org/ItemListUnordered",
  };
}
