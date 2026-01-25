import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link, useSearch } from "wouter";
import { Layout } from "@/components/layout/Layout";
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
import { siteConfig } from "@/lib/theme.config";

// Specialization slug mapping (URL slug -> display name and API key)
const specializationMap: Record<string, { key: string; label: string }> = {
  "gras-maaien": { key: "GRAS_MAAIEN", label: "Gras maaien" },
  "bomen-snoeien": { key: "SNOEIEN_BOMEN", label: "Bomen snoeien" },
  "struiken-snoeien": { key: "SNOEIEN_STRUIKEN", label: "Struiken snoeien" },
  "hagen-knippen": { key: "HAAG_KNIPPEN", label: "Hagen knippen" },
  "onkruid-verwijderen": { key: "ONKRUID_VERWIJDEREN", label: "Onkruid verwijderen" },
  "bladeren-ruimen": { key: "BLADEREN_RUIMEN", label: "Bladeren ruimen" },
  "bemesting": { key: "BEMESTING", label: "Bemesting" },
  "gazononderhoud": { key: "GAZONONDERHOUD", label: "Gazononderhoud" },
  "grasaanleg": { key: "GRASAANLEG", label: "Grasaanleg" },
  "paden-terrassen": { key: "PADEN_TERRASSEN", label: "Paden & terrassen" },
  "houten-constructies": { key: "HOUTEN_CONSTRUCTIES", label: "Houten constructies" },
  "afsluitingen": { key: "AFSLUITINGEN", label: "Afsluitingen & hekwerk" },
  "vijvers": { key: "VIJVERS", label: "Vijvers & waterpartijen" },
  "bestrating": { key: "BESTRATING", label: "Bestrating" },
  "beplanting": { key: "BEPLANTING", label: "Beplanting" },
  "irrigatie": { key: "IRRIGATIE", label: "Irrigatiesystemen" },
};

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
        specializationKey: secondParam ? specializationMap[secondParam]?.key : null,
        specializationLabel: secondParam ? specializationMap[secondParam]?.label : null,
        showAll: false,
      };
    } else {
      // First param is specialization (e.g., "gras-maaien")
      return {
        locationSlug: null,
        locationPostcode: null,
        fullLocationSlug: null,
        specializationSlug: firstParam,
        specializationKey: specializationMap[firstParam]?.key || null,
        specializationLabel: specializationMap[firstParam]?.label || null,
        showAll: false,
      };
    }
  }, [params.locationOrSpec, params.specialization]);

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
    total: number;
    page: number;
    totalPages: number;
  }>({
    queryKey: [searchUrl],
  });

  const profiles = profilesData?.profiles || [];
  const total = profilesData?.total || 0;

  const isLoading = (locationSlug && locationLoading) || profilesLoading;

  // Build page title based on URL structure
  const pageTitle = useMemo(() => {
    if (showAll) {
      return "Alle tuinmannen";
    }
    
    const parts: string[] = [];
    
    if (specializationLabel) {
      parts.push(specializationLabel);
    } else {
      parts.push("Tuinmannen");
    }
    
    if (location?.name) {
      parts.push(`in ${location.name}`);
    }
    
    return parts.join(" ");
  }, [showAll, specializationLabel, location?.name]);

  return (
    <Layout>
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
                  <Link href="/" data-testid="breadcrumb-tuinman">Zoek een tuinman</Link>
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
                profiles={profiles} 
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
                Geen {specializationLabel?.toLowerCase() || "tuinmannen"} gevonden
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
                    <Button variant="outline" data-testid="button-search-all-belgium">
                      Zoek in heel België
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
                  {profile.specializations.slice(0, 5).map((spec, index) => (
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
