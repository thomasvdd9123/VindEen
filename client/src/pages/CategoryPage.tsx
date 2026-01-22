import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { SearchBox } from "@/components/SearchBox";
import { ProfileCard } from "@/components/ProfileCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from "@/components/ui/breadcrumb";
import { ChevronLeft, ChevronRight, Leaf, MapPin, Filter } from "lucide-react";
import type { Category, Location, ProfileWithRelations } from "@shared/schema";
import { siteConfig } from "@/lib/theme.config";

export default function CategoryPage() {
  const params = useParams<{ category: string; location?: string }>();
  const categorySlug = params.category;
  const locationSlug = params.location;

  const { data: category, isLoading: categoryLoading } = useQuery<Category>({
    queryKey: ["/api/categories", categorySlug],
    enabled: !!categorySlug,
  });

  const { data: location, isLoading: locationLoading } = useQuery<Location>({
    queryKey: ["/api/locations", locationSlug],
    enabled: !!locationSlug,
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: locations = [] } = useQuery<Location[]>({
    queryKey: ["/api/locations"],
  });

  const searchParams = new URLSearchParams();
  if (categorySlug) searchParams.set("category", categorySlug);
  if (locationSlug) searchParams.set("location", locationSlug);

  const { data: profilesData, isLoading: profilesLoading } = useQuery<{
    profiles: ProfileWithRelations[];
    total: number;
    page: number;
    totalPages: number;
  }>({
    queryKey: ["/api/profiles/search", searchParams.toString()],
  });

  const profiles = profilesData?.profiles || [];
  const total = profilesData?.total || 0;

  const isLoading = categoryLoading || (locationSlug && locationLoading) || profilesLoading;

  const pageTitle = locationSlug && location
    ? `${category?.name || "Tuinmannen"} in ${location.name}`
    : category?.name || "Tuinmannen";

  const pageDescription = locationSlug && location
    ? `Vind de beste ${category?.name?.toLowerCase() || "tuinmannen"} in ${location.name} en omgeving. Vergelijk profielen en vraag vrijblijvend offertes aan.`
    : `Vind de beste ${category?.name?.toLowerCase() || "tuinmannen"} in heel België. Vergelijk profielen en vraag vrijblijvend offertes aan.`;

  return (
    <Layout>
      <div className="bg-muted/30 border-b border-border">
        <div className="container mx-auto px-4 py-4">
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
                      <Link href={`/vind-een-${categorySlug}`} data-testid="breadcrumb-category">
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

      <section className="py-8 sm:py-12 bg-gradient-to-b from-muted/30 to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            {isLoading ? (
              <>
                <Skeleton className="h-8 w-64 mb-3" />
                <Skeleton className="h-5 w-full max-w-xl" />
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold" data-testid="text-page-title">
                    {pageTitle}
                  </h1>
                  {location && (
                    <Badge variant="secondary" className="gap-1">
                      <MapPin className="h-3 w-3" />
                      {location.region}
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground text-lg" data-testid="text-page-description">
                  {pageDescription}
                </p>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="py-6 border-b border-border">
        <div className="container mx-auto px-4">
          <SearchBox 
            categories={categories} 
            locations={locations}
            initialCategory={categorySlug}
            initialLocation={locationSlug}
            variant="compact"
          />
        </div>
      </section>

      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            {isLoading ? (
              <Skeleton className="h-5 w-48" />
            ) : (
              <p className="text-muted-foreground" data-testid="text-results-count">
                <span className="font-semibold text-foreground">{total}</span>{" "}
                {total === 1 ? "resultaat" : "resultaten"} gevonden
              </p>
            )}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-card rounded-lg border border-border p-5">
                  <div className="flex gap-4">
                    <Skeleton className="h-16 w-16 rounded-full shrink-0" />
                    <div className="flex-1 space-y-3">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : profiles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {profiles.map((profile) => (
                <ProfileCard key={profile.id} profile={profile} />
              ))}
            </div>
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
                  <Link key={loc.id} href={`/vind-een-${categorySlug}/${loc.slug}`}>
                    <Button variant="outline" size="sm">
                      {loc.name}
                    </Button>
                  </Link>
                ))}
                {locationSlug && (
                  <Link href={`/vind-een-${categorySlug}`}>
                    <Button variant="outline">
                      Zoek in heel België
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          )}

          {profilesData && profilesData.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button
                variant="outline"
                size="sm"
                disabled={profilesData.page <= 1}
                data-testid="button-prev-page"
              >
                <ChevronLeft className="h-4 w-4" />
                Vorige
              </Button>
              <span className="text-sm text-muted-foreground px-4">
                Pagina {profilesData.page} van {profilesData.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={profilesData.page >= profilesData.totalPages}
                data-testid="button-next-page"
              >
                Volgende
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </section>

      {!locationSlug && locations.length > 0 && (
        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-xl font-semibold mb-6">
              {category?.name || "Tuinmannen"} per locatie
            </h2>
            <div className="flex flex-wrap gap-2">
              {locations.map((loc) => (
                <Link key={loc.id} href={`/vind-een-${categorySlug}/${loc.slug}`}>
                  <Button variant="outline" size="sm" className="rounded-full" data-testid={`button-loc-${loc.slug}`}>
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
