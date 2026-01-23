import { useState, useEffect } from "react";
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
import { siteConfig } from "@/lib/theme.config";

export default function CategoryPage() {
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [currentPage, setCurrentPage] = useState(1);
  const params = useParams<{ category: string; location?: string }>();
  const categorySlug = params.category;
  const locationSlug = params.location;
  const searchString = useSearch();
  const urlParams = new URLSearchParams(searchString);
  const queryParam = urlParams.get("q") || "";
  const specParam = urlParams.get("spec") || "";

  // Check if we're showing all categories or main categories
  const isAllCategories = categorySlug === "alle";
  const isMainCategory = categorySlug === "tuinonderhoud" || categorySlug === "tuinaanleg";
  const mainCategoryValue = isMainCategory ? categorySlug.toUpperCase() : undefined;
  
  const { data: category, isLoading: categoryLoading } = useQuery<Category>({
    queryKey: ["/api/categories", categorySlug],
    enabled: !!categorySlug && !isAllCategories && !isMainCategory,
  });

  const { data: location, isLoading: locationLoading } = useQuery<Location>({
    queryKey: ["/api/locations", locationSlug],
    enabled: !!locationSlug,
  });

  const { data: locations = [], isLoading: locationsListLoading } = useQuery<Location[]>({
    queryKey: ["/api/locations"],
  });

  // Reset page when filters change
  const filterKey = `${categorySlug}-${locationSlug}-${queryParam}-${specParam}`;
  useEffect(() => {
    setCurrentPage(1);
  }, [filterKey]);
  
  // Build search params including all filters
  const searchParams = new URLSearchParams();
  // Use mainCategory for main category slugs, category for specific category slugs
  if (isMainCategory && mainCategoryValue) {
    searchParams.set("mainCategory", mainCategoryValue);
  } else if (categorySlug && !isAllCategories) {
    searchParams.set("category", categorySlug);
  }
  if (locationSlug) searchParams.set("location", locationSlug);
  if (queryParam) searchParams.set("q", queryParam);
  if (specParam) searchParams.set("spec", specParam);
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

  const isLoading = (!isAllCategories && !isMainCategory && categoryLoading) || (locationSlug && locationLoading) || profilesLoading;

  // Get the display name for the category/main category
  const mainCategoryLabels: Record<string, string> = {
    tuinonderhoud: "Tuinonderhoud",
    tuinaanleg: "Tuinaanleg",
  };
  const categoryDisplayName = isMainCategory 
    ? mainCategoryLabels[categorySlug] 
    : isAllCategories 
      ? "Tuinmannen" 
      : (category?.name || "Tuinmannen");

  const pageTitle = locationSlug && location
    ? `${categoryDisplayName} in ${location.name}`
    : isAllCategories ? "Alle Tuinmannen" : categoryDisplayName;

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
                initialLocation={locationSlug}
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
              {locationSlug ? (
                <>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link href={`/zoek/${categorySlug}`} data-testid="breadcrumb-category">
                        {category?.name || categorySlug}
                      </Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage data-testid="breadcrumb-location">
                      {location?.name || locationSlug}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              ) : (
                <BreadcrumbItem>
                  <BreadcrumbPage data-testid="breadcrumb-current">
                    {category?.name || categorySlug}
                  </BreadcrumbPage>
                </BreadcrumbItem>
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
                Geen {category?.name?.toLowerCase() || "tuinmannen"} gevonden
                {location && ` in ${location.name}`}
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Er zijn momenteel geen professionals beschikbaar die aan je zoekcriteria voldoen. 
                Probeer een andere locatie of categorie.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                {!locationSlug && locations.slice(0, 4).map((loc) => (
                  <Link key={loc.id} href={`/zoek/${categorySlug}/${loc.slug}`}>
                    <Button variant="outline" size="sm" data-testid={`button-empty-loc-${loc.slug}`}>
                      {loc.name}
                    </Button>
                  </Link>
                ))}
                {locationSlug && (
                  <Link href={`/zoek/${categorySlug}`}>
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

      {/* Locations footer section */}
      {!locationSlug && locations.length > 0 && (
        <section className="py-12 bg-muted/30 border-t border-border">
          <div className="container mx-auto px-4">
            <h2 className="text-lg font-semibold mb-4">
              {category?.name || "Tuinmannen"} per locatie
            </h2>
            <div className="flex flex-wrap gap-2">
              {locations.map((loc) => (
                <Link key={loc.id} href={`/zoek/${categorySlug}/${loc.slug}`}>
                  <Button variant="ghost" size="sm" className="rounded-full hover:bg-primary/10 hover:text-primary" data-testid={`button-loc-${loc.slug}`}>
                    {loc.name}
                  </Button>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
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
                      {spec.toLowerCase().replace(/_/g, " ")}
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

            {/* Category / Support tags */}
            {profile.category && (
              <div className="mt-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-medium text-muted-foreground">Ondersteuning bij</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-primary/10 text-primary">
                    {profile.category.name}
                  </span>
                  {profile.offeredServices && profile.offeredServices.slice(0, 3).map((service, index) => (
                    <span 
                      key={index}
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-muted text-muted-foreground"
                    >
                      {service}
                    </span>
                  ))}
                  {profile.offeredServices && profile.offeredServices.length > 3 && (
                    <span className="text-xs text-muted-foreground">
                      ...
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
