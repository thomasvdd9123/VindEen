import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { SearchBox } from "@/components/SearchBox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowRight, 
  Leaf,
  BookOpen,
  HelpCircle,
  FileText,
  Star,
  GraduationCap,
  Users,
  MessageSquare,
} from "lucide-react";
import { siteConfig } from "@/lib/theme.config";
import type { Category, Location, ProfileWithRelations } from "@shared/schema";

// Quick start links (like "Snel starten" section)
const quickStartLinks = [
  { title: "De tuinman", href: "/info/de-tuinman", arrow: true },
  { title: "Hoe vind ik een goede tuinman?", href: "/info/goede-tuinman-vinden", arrow: true },
  { title: "Hoe werkt tuinaanleg?", href: "/info/hoe-werkt-tuinaanleg", arrow: true },
  { title: "Verschil tussen tuinman en hovenier?", href: "/info/tuinman-vs-hovenier", arrow: true },
  { title: "Kosten & prijzen", href: "/info/kosten-prijzen", arrow: true },
  { title: "Artikelen", href: "/artikelen", arrow: true },
  { title: "Veelgestelde vragen (FAQ)", href: "/faq", arrow: true },
];

// Experiences section links
const experienceLinks = [
  { title: "Lees wat tuinprojecten reeds betekend hebben voor anderen", href: "/ervaringen", arrow: true },
];

export default function Home() {
  const { data: categories = [], isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: locations = [], isLoading: locationsLoading } = useQuery<Location[]>({
    queryKey: ["/api/locations"],
  });

  const { data: featuredProfiles = [], isLoading: profilesLoading } = useQuery<ProfileWithRelations[]>({
    queryKey: ["/api/profiles/featured"],
  });

  return (
    <Layout>
      {/* Hero Section with Search */}
      <section className="relative bg-gradient-to-b from-primary/5 via-muted/30 to-background">
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMjkxNTQiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        
        <div className="container mx-auto px-4 py-12 sm:py-16 relative">
          <div className="max-w-4xl mx-auto">
            {categoriesLoading || locationsLoading ? (
              <Card className="p-6">
                <div className="space-y-4">
                  <Skeleton className="h-11 w-full" />
                  <div className="flex gap-3">
                    <Skeleton className="h-10 w-48" />
                    <Skeleton className="h-10 w-48" />
                    <Skeleton className="h-10 flex-1" />
                  </div>
                </div>
              </Card>
            ) : (
              <SearchBox categories={categories} locations={locations} />
            )}
          </div>
        </div>
      </section>

      {/* Main Content Grid - Similar to vind-een-psycholoog.be */}
      <section className="py-12 sm:py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            
            {/* Snel starten column */}
            <Card className="border-t-4 border-t-accent shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BookOpen className="h-5 w-5 text-accent" />
                  Snel starten
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <nav className="space-y-1">
                  {quickStartLinks.map((link, index) => (
                    <Link key={index} href={link.href}>
                      <span className="flex items-center justify-between py-2 text-sm text-foreground hover:text-primary hover:underline cursor-pointer group" data-testid={`link-quick-${index}`}>
                        {link.title}
                        <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                      </span>
                    </Link>
                  ))}
                </nav>

                <div className="mt-6 pt-4 border-t border-border">
                  <h4 className="font-semibold text-base mb-3">Ervaringen met tuinmannen</h4>
                  {experienceLinks.map((link, index) => (
                    <Link key={index} href={link.href}>
                      <span className="text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                        {link.title} <ArrowRight className="h-3 w-3 inline" />
                      </span>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* In de kijker column - Featured Profile */}
            <Card className="border-t-4 border-t-primary shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Star className="h-5 w-5 text-amber-500" />
                  In de kijker: Tuinman
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {profilesLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-40 w-full rounded-md" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ) : featuredProfiles.length > 0 ? (
                  <div>
                    {/* Featured profile image placeholder */}
                    <div className="relative h-40 bg-muted rounded-md mb-4 overflow-hidden">
                      {featuredProfiles[0].logoUrl ? (
                        <img 
                          src={featuredProfiles[0].logoUrl} 
                          alt={featuredProfiles[0].name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                          <Leaf className="h-12 w-12 text-primary/40" />
                        </div>
                      )}
                    </div>
                    
                    <h4 className="font-semibold mb-1">{featuredProfiles[0].name}</h4>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-4">
                      {featuredProfiles[0].introduction || featuredProfiles[0].description?.substring(0, 150)}
                    </p>
                    
                    <div className="flex flex-wrap gap-2">
                      <Link href={`/bedrijf/${featuredProfiles[0].slug}`}>
                        <span className="text-sm text-primary hover:underline cursor-pointer">
                          Lees verder <ArrowRight className="h-3 w-3 inline" />
                        </span>
                      </Link>
                    </div>

                    <div className="mt-4 pt-4 border-t border-border">
                      <Link href="/zoek/tuinaanlegger">
                        <span className="text-sm text-primary hover:underline cursor-pointer">
                          Vind een tuinman <ArrowRight className="h-3 w-3 inline" />
                        </span>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Leaf className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">Nog geen uitgelichte tuinmannen</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tips & Training column */}
            <Card className="border-t-4 border-t-sky-500 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <GraduationCap className="h-5 w-5 text-sky-500" />
                  Tips & Inspiratie
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-4">
                {/* Tip items - placeholder for future articles/tips */}
                <article className="group">
                  <h5 className="font-medium text-sm mb-1 group-hover:text-primary transition-colors cursor-pointer">
                    5 tips voor de perfecte tuin
                  </h5>
                  <p className="text-xs text-muted-foreground mb-1">6 jan. 2026</p>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    Ontdek hoe je jouw tuin omtovert tot een groene oase...
                  </p>
                </article>

                <article className="group">
                  <h5 className="font-medium text-sm mb-1 group-hover:text-primary transition-colors cursor-pointer">
                    Seizoensgebonden tuinonderhoud
                  </h5>
                  <p className="text-xs text-muted-foreground mb-1">15 dec. 2025</p>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    Welke werkzaamheden zijn belangrijk per seizoen...
                  </p>
                </article>

                <article className="group">
                  <h5 className="font-medium text-sm mb-1 group-hover:text-primary transition-colors cursor-pointer">
                    Duurzame tuinmaterialen kiezen
                  </h5>
                  <p className="text-xs text-muted-foreground mb-1">1 dec. 2025</p>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    Milieuvriendelijke opties voor jouw tuinproject...
                  </p>
                </article>

                <div className="pt-2">
                  <Button variant="default" size="sm" className="w-full" data-testid="button-all-tips">
                    Toon alle tips & artikelen
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Tuinmannen Section */}
      <section className="py-12 sm:py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl font-bold mb-1" data-testid="text-featured-title">
                Uitgelichte tuinmannen
              </h2>
              <p className="text-muted-foreground">
                Ontdek de best beoordeelde professionals in {siteConfig.country}
              </p>
            </div>
            <Link href="/zoek/tuinaanlegger">
              <Button variant="outline" className="gap-2" data-testid="button-view-all">
                Bekijk alle
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profilesLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="p-5">
                  <div className="flex gap-4">
                    <Skeleton className="h-20 w-20 rounded-md shrink-0" />
                    <div className="flex-1 space-y-3">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  </div>
                </Card>
              ))
            ) : featuredProfiles.length > 0 ? (
              featuredProfiles.slice(0, 4).map((profile) => (
                <FeaturedProfileCard key={profile.id} profile={profile} />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <Leaf className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">Nog geen tuinmannen beschikbaar</h3>
                <p className="text-muted-foreground mb-4">
                  Ben je tuinman? Registreer je nu en word zichtbaar voor potentiële klanten.
                </p>
                <Link href="/registreren">
                  <Button data-testid="button-register-empty">
                    Registreer als tuinman
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-12 sm:py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold mb-2">
              Zoek per specialisatie
            </h2>
            <p className="text-muted-foreground">
              Vind de juiste professional voor jouw tuinproject
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            {categoriesLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-36 rounded-full" />
              ))
            ) : (
              categories.map((category) => (
                <Link key={category.id} href={`/zoek/${category.slug}`}>
                  <Button 
                    variant="outline" 
                    className="rounded-full gap-2"
                    data-testid={`button-category-${category.slug}`}
                  >
                    <Leaf className="h-4 w-4" />
                    {category.name}
                  </Button>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Popular Locations Section */}
      <section className="py-12 sm:py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold mb-2">
              Populaire locaties
            </h2>
            <p className="text-muted-foreground">
              Vind tuinmannen in de grootste steden van {siteConfig.country}
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            {locationsLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-28 rounded-full" />
              ))
            ) : (
              locations.slice(0, 12).map((location) => (
                <Link key={location.id} href={`/zoek/tuinaanlegger/${location.slug}`}>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="rounded-full hover:bg-primary/10 hover:text-primary"
                    data-testid={`button-location-${location.slug}`}
                  >
                    {location.name}
                  </Button>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>

      {/* CTA Section for Professionals */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-80" />
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">
              Ben je tuinman?
            </h2>
            <p className="text-primary-foreground/80 mb-8 text-lg">
              Word lid van {siteConfig.name} en bereik duizenden potentiële klanten in heel {siteConfig.country}.
              Laat je werk zien en ontvang direct contactaanvragen.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/registreren">
                <Button size="lg" variant="secondary" className="gap-2" data-testid="button-cta-register">
                  <Leaf className="h-4 w-4" />
                  Registreer gratis
                </Button>
              </Link>
              <Link href="/info/voor-tuinmannen">
                <Button size="lg" variant="outline" className="gap-2 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                  Meer informatie
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}

// Featured Profile Card Component - matches vind-een-psycholoog.be style
function FeaturedProfileCard({ profile }: { profile: ProfileWithRelations }) {
  return (
    <Link href={`/bedrijf/${profile.slug}`}>
      <Card className="hover-elevate cursor-pointer h-full" data-testid={`card-profile-${profile.slug}`}>
        <CardContent className="p-5">
          <div className="flex gap-4">
            {/* Profile image */}
            <div className="w-20 h-20 rounded-md bg-muted shrink-0 overflow-hidden">
              {profile.logoUrl ? (
                <img 
                  src={profile.logoUrl} 
                  alt={profile.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                  <Leaf className="h-8 w-8 text-primary/40" />
                </div>
              )}
            </div>

            {/* Profile info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground mb-0.5 truncate" data-testid={`text-profile-name-${profile.slug}`}>
                {profile.name}
              </h3>
              {profile.title && (
                <p className="text-sm text-muted-foreground mb-2 truncate">
                  {profile.title}
                </p>
              )}
              {profile.location && (
                <p className="text-xs text-muted-foreground mb-2">
                  {profile.location.name}
                </p>
              )}
              <p className="text-sm text-muted-foreground line-clamp-2">
                {profile.introduction || profile.description?.substring(0, 120)}
              </p>
            </div>
          </div>

          {/* Specializations as tags */}
          {profile.specializations && profile.specializations.length > 0 && (
            <div className="mt-4 pt-3 border-t border-border">
              <div className="flex flex-wrap gap-1.5">
                <span className="text-xs font-medium text-muted-foreground mr-1">Specialisaties:</span>
                {profile.specializations.slice(0, 4).map((spec, index) => (
                  <span 
                    key={index}
                    className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-muted text-muted-foreground"
                  >
                    {spec.toLowerCase().replace(/_/g, " ")}
                  </span>
                ))}
                {profile.specializations.length > 4 && (
                  <span className="text-xs text-muted-foreground">
                    +{profile.specializations.length - 4}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Category tags */}
          {profile.category && (
            <div className="mt-2">
              <div className="flex flex-wrap gap-1.5">
                <span className="text-xs font-medium text-muted-foreground mr-1">Ondersteuning bij:</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-primary/10 text-primary">
                  {profile.category.name}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
