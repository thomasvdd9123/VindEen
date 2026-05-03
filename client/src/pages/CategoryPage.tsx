import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link, useSearch } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { SEO, generateSearchResultsSchema, generateBreadcrumbSchema } from "@/components/SEO";
import { SearchBox } from "@/components/SearchBox";
import { ProfileCard } from "@/components/ProfileCard";
import { SearchMap } from "@/components/SearchMap";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from "@/components/ui/breadcrumb";
import { ChevronLeft, ChevronRight, Leaf, MapPin, ArrowRight, List, Map } from "lucide-react";
import type { Category, Location, ProfileWithRelations } from "@shared/schema";
import { specializationLabels } from "@shared/schema";
import { siteConfig, fillCopy } from "@/lib/theme.config";
import { useSpecializationMap } from "@/lib/useSpecializations";

const businessPluralCap =
  siteConfig.businessTypePlural.charAt(0).toUpperCase() +
  siteConfig.businessTypePlural.slice(1);

// Check if a slug looks like a location (starts with digits like "9000-gent")
function isLocationSlug(slug: string): boolean {
  return /^\d{4}-/.test(slug);
}

// Check if slug is "alle" (show all results)
function isShowAll(slug: string): boolean {
  return slug === "alle";
}

// Parse location slug to extract postcode and city slug
function parseLocationSlug(slug: string): { postcode: string; citySlug: string } | null {
  const match = slug.match(/^(\d{4})-(.+)$/);
  if (match) {
    return { postcode: match[1], citySlug: match[2] };
  }
  return null;
}

export default function CategoryPage() {
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [currentPage, setCurrentPage] = useState(1);
  const params = useParams<{ locationOrSpec: string; specialization?: string }>();
  const searchString = useSearch();
  const urlParams = new URLSearchParams(searchString);
  const queryParam = urlParams.get("q") || "";
  const mainCategoryParam = urlParams.get("cat") || "";

  const { slugToKey, labelBySlug } = useSpecializationMap();

  // Parse URL to determine location and specialization
  // New URL structure:
  // /zoek/alle - show all results
  // /zoek/{postcode-city} - location only
  // /zoek/{postcode-city}/{specialization} - location + specialization  
  // /zoek/{specialization} - specialization only
  const parsedUrl = useMemo(() => {
    const firstParam = params.locationOrSpec || "";
    const secondParam = params.specialization;
    
    if (isShowAll(firstParam)) {
      // Show all results
      return {
        locationSlug: null,
        locationPostcode: null,
        fullLocationSlug: null,
        specializationSlug: null,
        specializationKey: null,
        specializationLabel: null,
        showAll: true,
      };
    } else if (isLocationSlug(firstParam)) {
      // First param is location (e.g., "9000-gent")
      const parsed = parseLocationSlug(firstParam);
      return {
        locationSlug: parsed?.citySlug || firstParam,
        locationPostcode: parsed?.postcode,
        fullLocationSlug: firstParam,
        specializationSlug: secondParam || null,
        specializationKey: secondParam ? slugToKey[secondParam] ?? null : null,
        specializationLabel: secondParam ? labelBySlug[secondParam] ?? null : null,
        showAll: false,
      };
    } else {
      // First param is specialization (e.g., "gras-maaien")
      return {
        locationSlug: null,
        locationPostcode: null,
        fullLocationSlug: null,
        specializationSlug: firstParam,
        specializationKey: slugToKey[firstParam] ?? null,
        specializationLabel: labelBySlug[firstParam] ?? null,
        showAll: false,
      };
    }
  }, [params.locationOrSpec, params.specialization, slugToKey, labelBySlug]);

  const { locationSlug, fullLocationSlug, specializationSlug, specializationKey, specializationLabel, showAll } = parsedUrl;

  const { data: location, isLoading: locationLoading } = useQuery<Location>({
    queryKey: ["/api/locations", locationSlug],
    enabled: !!locationSlug,
  });

  const { data: locations = [], isLoading: locationsListLoading } = useQuery<Location[]>({
    queryKey: ["/api/locations"],
  });

  // Reset page when filters change
  const filterKey = `${fullLocationSlug}-${specializationSlug}-${mainCategoryParam}-${queryParam}`;
  useEffect(() => {
    setCurrentPage(1);
  }, [filterKey]);
  
  // Build search params for API
  const searchParams = new URLSearchParams();
  if (locationSlug) searchParams.set("location", locationSlug);
  if (specializationKey) searchParams.set("spec", specializationKey);
  if (mainCategoryParam) searchParams.set("mainCategory", mainCategoryParam);
  if (queryParam) searchParams.set("q", queryParam);
  searchParams.set("page", currentPage.toString());
  
  // Build full URL with query string
  const searchUrl = `/api/profiles/search?${searchParams.toString()}`;

  const { data: profilesData, isLoading: profilesLoading } = useQuery<{
    profiles: ProfileWithRelations[];
    verifiedTotal?: number;
    total: number;
    page: number;
    totalPages: number;
  }>({
    queryKey: [searchUrl],
  });

  // Fetch ALL profiles for the map (without pagination limit)
  const mapSearchParams = new URLSearchParams();
  if (locationSlug) mapSearchParams.set("location", locationSlug);
  if (specializationKey) mapSearchParams.set("spec", specializationKey);
  if (mainCategoryParam) mapSearchParams.set("mainCategory", mainCategoryParam);
  if (queryParam) mapSearchParams.set("q", queryParam);
  mapSearchParams.set("limit", "1000"); // Get all profiles for the map
  
  const mapSearchUrl = `/api/profiles/search?${mapSearchParams.toString()}`;
  
  const { data: mapProfilesData } = useQuery<{
    profiles: ProfileWithRelations[];
    total: number;
  }>({
    queryKey: [mapSearchUrl],
    enabled: viewMode === "map", // Only fetch when map view is active
  });

  const profiles = profilesData?.profiles || [];
  const allProfilesForMap = mapProfilesData?.profiles || profiles; // Fallback to paginated if map data not loaded
  const total = profilesData?.total || 0;

  const isLoading = (locationSlug && locationLoading) || profilesLoading;

  // Build page title based on URL structure
  const pageTitle = useMemo(() => {
    if (showAll) {
      return `Alle ${siteConfig.businessTypePlural}`;
    }

    const parts: string[] = [];
    if (specializationLabel) {
      parts.push(specializationLabel);
    } else {
      parts.push(businessPluralCap);
    }
    if (location?.name) {
      parts.push(`in ${location.name}`);
    }
    return parts.join(" ");
  }, [showAll, specializationLabel, location?.name]);

  // SEO: Generate unique title and description for each location/specialization combo
  const seoTitle = useMemo(() => {
    if (showAll) {
      return fillCopy(`Alle {plural} in {country} - Vind jouw {professional}`);
    }
    if (location && specializationLabel) {
      return `${specializationLabel} in ${location.name} (${location.postcode}) - ${businessPluralCap}`;
    }
    if (location) {
      return fillCopy(`${businessPluralCap} in ${location.name} (${location.postcode}) - Vind lokale {professionalPlural}`);
    }
    if (specializationLabel) {
      return fillCopy(`${specializationLabel} - Gespecialiseerde {plural} in {country}`);
    }
    return fillCopy(`${businessPluralCap} in {country}`);
  }, [showAll, location, specializationLabel]);

  const seoDescription = useMemo(() => {
    const resultText = total > 0 ? `${total} ${siteConfig.businessTypePlural} gevonden.` : "";
    if (showAll) {
      return fillCopy(`Bekijk alle {plural} in {country}. ${resultText} Vergelijk profielen, bekijk specialisaties en vraag gratis offertes aan.`);
    }
    if (location && specializationLabel) {
      return fillCopy(`Zoek ${specializationLabel.toLowerCase()} in ${location.name}. ${resultText} Bekijk profielen van lokale {professionalPlural} en vraag direct een offerte aan.`);
    }
    if (location) {
      return fillCopy(`Vind de beste {plural} in ${location.name} (${location.postcode}). ${resultText} Bekijk profielen, specialisaties en contacteer direct.`);
    }
    if (specializationLabel) {
      return fillCopy(`Zoek {plural} gespecialiseerd in ${specializationLabel.toLowerCase()}. ${resultText} Vergelijk professionals in heel {country}.`);
    }
    return fillCopy(`Zoek en vergelijk {plural} in {country}.`);
  }, [showAll, location, specializationLabel, total]);

  // Build canonical URL (without query params to avoid duplicates)
  const canonicalUrl = useMemo(() => {
    if (showAll) return "/zoek/alle";
    if (fullLocationSlug && specializationSlug) {
      return `/zoek/${fullLocationSlug}/${specializationSlug}`;
    }
    if (fullLocationSlug) return `/zoek/${fullLocationSlug}`;
    if (specializationSlug) return `/zoek/${specializationSlug}`;
    return "/zoek/alle";
  }, [showAll, fullLocationSlug, specializationSlug]);

  // Build breadcrumb items for structured data
  const breadcrumbItems = useMemo(() => {
    const items = [{ name: "Home", url: "/" }];
    if (location) {
      items.push({ name: location.name, url: `/zoek/${fullLocationSlug}` });
    }
    if (specializationLabel) {
      const specUrl = location 
        ? `/zoek/${fullLocationSlug}/${specializationSlug}`
        : `/zoek/${specializationSlug}`;
      items.push({ name: specializationLabel, url: specUrl });
    }
    return items;
  }, [location, fullLocationSlug, specializationLabel, specializationSlug]);

  const verifiedProfiles = useMemo(
    () => profiles.filter((p: ProfileWithRelations) => p.isVerified),
    [profiles],
  );
  // Indexability uses full-result verifiedTotal from API (so paginated pages
  // beyond page 1 still index correctly when verified profiles exist).
  const verifiedTotal = profilesData?.verifiedTotal ?? verifiedProfiles.length;
  const hasVerifiedResults = verifiedTotal > 0;

  const structuredData = useMemo(() => [
    generateSearchResultsSchema({
      location: location?.name,
      specialization: specializationLabel || undefined,
      totalResults: total,
      items: verifiedProfiles.slice(0, 10).map((p: ProfileWithRelations) => ({
        name: p.name,
        slug: p.slug,
      })),
    }),
    generateBreadcrumbSchema(breadcrumbItems),
  ], [location?.name, specializationLabel, total, breadcrumbItems, verifiedProfiles]);

  return (
    <Layout>
      <SEO
        title={seoTitle}
        description={seoDescription}
        canonical={canonicalUrl}
        noindex={total === 0 || !hasVerifiedResults}
        structuredData={structuredData}
      />
      
      {/* Search Section - Sticky at top like vind-een-psycholoog */}
      <section className="bg-gradient-to-b from-muted/50 to-background border-b border-border">
        <div className="container mx-auto px-4 py-6">
          {locationsListLoading ? (
            <div className="max-w-4xl mx-auto">
              <Skeleton className="h-24 w-full rounded-lg" />
            </div>
          ) : (
            <div className="max-w-4xl mx-auto">
              <SearchBox 
                locations={locations}
                initialCategory={mainCategoryParam || undefined}
                initialSpecialization={specializationKey || undefined}
                initialLocation={fullLocationSlug || undefined}
                initialQuery={queryParam}
                showCount={true}
              />
            </div>
          )}
        </div>
      </section>

      {/* Breadcrumb */}
      <div className="bg-background border-b border-border">
        <div className="container mx-auto px-4 py-3">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/" data-testid="breadcrumb-home">Home</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/" data-testid="breadcrumb-search">{fillCopy("Zoek {article}")}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              {/* Location breadcrumb (if present) */}
              {fullLocationSlug && location && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    {specializationSlug ? (
                      <BreadcrumbLink asChild>
                        <Link href={`/zoek/${fullLocationSlug}`} data-testid="breadcrumb-location">
                          {location.name}
                        </Link>
                      </BreadcrumbLink>
                    ) : (
                      <BreadcrumbPage data-testid="breadcrumb-location">
                        {location.name}
                      </BreadcrumbPage>
                    )}
                  </BreadcrumbItem>
                </>
              )}
              {/* Specialization breadcrumb (if present) */}
              {specializationLabel && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage data-testid="breadcrumb-specialization">
                      {specializationLabel}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              )}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      {/* Results Section */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          {/* Results header */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold mb-1" data-testid="text-results-title">
                Resultaten voor "{pageTitle}"
                {queryParam && <span className="text-primary"> - {queryParam}</span>}
              </h1>
              {isLoading ? (
                <Skeleton className="h-5 w-64" />
              ) : (
                <p className="text-muted-foreground" data-testid="text-results-count">
                  {total} {total === 1 ? "resultaat" : "resultaten"} gevonden
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="gap-2"
                data-testid="button-view-list"
              >
                <List className="h-4 w-4" />
                Lijst
              </Button>
              <Button
                variant={viewMode === "map" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("map")}
                className="gap-2"
                data-testid="button-view-map"
              >
                <Map className="h-4 w-4" />
                Kaart
              </Button>
            </div>
          </div>

          {/* Results list or map */}
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-5">
                    <div className="flex gap-4">
                      <Skeleton className="h-24 w-24 rounded-md shrink-0" />
                      <div className="flex-1 space-y-3">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <div className="flex gap-2 pt-2">
                          <Skeleton className="h-6 w-20" />
                          <Skeleton className="h-6 w-24" />
                          <Skeleton className="h-6 w-16" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : profiles.length > 0 ? (
            viewMode === "map" ? (
              <SearchMap 
                profiles={allProfilesForMap} 
                locations={locations} 
                className="h-[600px]" 
              />
            ) : (
              <div className="space-y-4">
                {profiles.map((profile) => (
                  <SearchResultCard key={profile.id} profile={profile} />
                ))}
              </div>
            )
          ) : (
            <div className="text-center py-16">
              <Leaf className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-xl mb-2">
                Geen {specializationLabel?.toLowerCase() || siteConfig.businessTypePlural} gevonden
                {location && ` in ${location.name}`}
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Er zijn momenteel geen professionals beschikbaar die aan je zoekcriteria voldoen. 
                Probeer een andere locatie of dienst.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                {!locationSlug && locations.slice(0, 4).map((loc) => (
                  <Link key={loc.id} href={`/zoek/${loc.postcode}-${loc.slug}`}>
                    <Button variant="outline" size="sm" data-testid={`button-empty-loc-${loc.slug}`}>
                      {loc.name}
                    </Button>
                  </Link>
                ))}
                {locationSlug && specializationSlug && (
                  <Link href={`/zoek/${fullLocationSlug}`}>
                    <Button variant="outline" data-testid="button-search-all-services">
                      Alle diensten in {location?.name}
                    </Button>
                  </Link>
                )}
                {locationSlug && !specializationSlug && (
                  <Link href="/">
                    <Button variant="outline" data-testid="button-search-all-country">
                      Zoek in heel {siteConfig.country}
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Pagination */}
          {profilesData && profilesData.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                data-testid="button-prev-page"
              >
                <ChevronLeft className="h-4 w-4" />
                Vorige
              </Button>
              <span className="text-sm text-muted-foreground px-4">
                Pagina {currentPage} van {profilesData.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= profilesData.totalPages}
                onClick={() => setCurrentPage(p => Math.min(profilesData.totalPages, p + 1))}
                data-testid="button-next-page"
              >
                Volgende
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </section>

    </Layout>
  );
}

// Search Result Card - matches vind-een-psycholoog.be style
function SearchResultCard({ profile }: { profile: ProfileWithRelations }) {
  return (
    <Card className="hover-elevate transition-all" data-testid={`card-result-${profile.slug}`}>
      <CardContent className="p-5">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Profile info */}
          <div className="flex-1 min-w-0">
            <Link href={`/bedrijf/${profile.slug}`}>
              <h3 className="font-semibold text-lg text-foreground hover:text-primary hover:underline cursor-pointer mb-0.5" data-testid={`text-result-name-${profile.slug}`}>
                {profile.name}
              </h3>
            </Link>
            
            {profile.title && (
              <p className="text-sm text-muted-foreground mb-1">
                {profile.title}
              </p>
            )}
            
            {profile.location && (
              <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {profile.location.name}
                {(profile as any).distanceKm && (
                  <span className="text-primary font-medium">
                    ({(profile as any).distanceKm} km)
                  </span>
                )}
              </p>
            )}
            
            <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
              {profile.introduction || profile.description?.substring(0, 200)}
            </p>

            <Link href={`/bedrijf/${profile.slug}`}>
              <span className="text-sm text-muted-foreground hover:text-primary cursor-pointer">
                Lees verder <ArrowRight className="h-3 w-3 inline" />
              </span>
            </Link>

            {/* Specializations */}
            {profile.specializations && profile.specializations.length > 0 && (
              <div className="mt-4 pt-3 border-t border-border">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-medium text-muted-foreground">Specialisaties</span>
                  {profile.specializations.slice(0, 5).map((spec: string, index: number) => (
                    <span 
                      key={index}
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-muted text-muted-foreground"
                    >
                      {specializationLabels[spec] || spec.toLowerCase().replace(/_/g, " ")}
                    </span>
                  ))}
                  {profile.specializations.length > 5 && (
                    <span className="text-xs text-muted-foreground">
                      +{profile.specializations.length - 5}
                    </span>
                  )}
                </div>
              </div>
            )}

          </div>

          {/* Profile image */}
          <div className="w-full sm:w-28 h-32 sm:h-28 rounded-md bg-muted shrink-0 overflow-hidden order-first sm:order-last">
            {profile.logoUrl ? (
              <img 
                src={profile.logoUrl} 
                alt={profile.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                <Leaf className="h-10 w-10 text-primary/40" />
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
