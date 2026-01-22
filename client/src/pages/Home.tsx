import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { SearchBox } from "@/components/SearchBox";
import { ProfileCard } from "@/components/ProfileCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Leaf, 
  Search, 
  Shield, 
  Star, 
  Users, 
  ArrowRight, 
  CheckCircle,
  TreeDeciduous,
  Flower2,
  Scissors,
  Fence
} from "lucide-react";
import { siteConfig } from "@/lib/theme.config";
import type { Category, Location, ProfileWithRelations } from "@shared/schema";

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

  const categoryIcons: Record<string, React.ReactNode> = {
    tuinaanlegger: <TreeDeciduous className="h-6 w-6" />,
    tuinarchitect: <Flower2 className="h-6 w-6" />,
    hovenier: <Leaf className="h-6 w-6" />,
    boomverzorger: <Scissors className="h-6 w-6" />,
  };

  const stats = [
    { icon: <Users className="h-5 w-5" />, value: "500+", label: "Geregistreerde tuinmannen" },
    { icon: <Star className="h-5 w-5" />, value: "4.8", label: "Gemiddelde beoordeling" },
    { icon: <Shield className="h-5 w-5" />, value: "100%", label: "Geverifieerde bedrijven" },
  ];

  const features = [
    {
      icon: <Search className="h-8 w-8 text-primary" />,
      title: "Eenvoudig zoeken",
      description: "Vind snel de juiste tuinman in jouw regio met onze uitgebreide zoekfunctie.",
    },
    {
      icon: <Shield className="h-8 w-8 text-primary" />,
      title: "Geverifieerde professionals",
      description: "Alle tuinmannen worden gecontroleerd op kwaliteit en betrouwbaarheid.",
    },
    {
      icon: <Star className="h-8 w-8 text-primary" />,
      title: "Gratis offertes",
      description: "Vraag vrijblijvend offertes aan en vergelijk prijzen en diensten.",
    },
  ];

  return (
    <Layout>
      <section className="relative bg-gradient-to-br from-primary/5 via-background to-accent/10 py-16 sm:py-24">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMjkxNTQiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl mx-auto text-center mb-10">
            <Badge variant="secondary" className="mb-4 gap-1.5">
              <Leaf className="h-3.5 w-3.5" />
              {siteConfig.country}'s grootste tuinmannen platform
            </Badge>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4" data-testid="text-hero-title">
              Vind de perfecte{" "}
              <span className="text-primary">tuinman</span>{" "}
              in jouw buurt
            </h1>
            <p className="text-lg text-muted-foreground mb-8" data-testid="text-hero-description">
              {siteConfig.description}
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            {categoriesLoading || locationsLoading ? (
              <Card className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Skeleton className="h-10" />
                  <Skeleton className="h-10" />
                  <Skeleton className="h-10" />
                </div>
              </Card>
            ) : (
              <SearchBox categories={categories} locations={locations} />
            )}
          </div>

          <div className="flex flex-wrap justify-center gap-8 mt-12">
            {stats.map((stat, index) => (
              <div key={index} className="flex items-center gap-3 text-center">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary">
                  {stat.icon}
                </div>
                <div className="text-left">
                  <p className="text-xl font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3" data-testid="text-categories-title">
              Ontdek onze categorieën
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Vind de juiste professional voor jouw tuinproject
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categoriesLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="p-6">
                  <Skeleton className="h-12 w-12 rounded-lg mx-auto mb-4" />
                  <Skeleton className="h-5 w-24 mx-auto mb-2" />
                  <Skeleton className="h-4 w-32 mx-auto" />
                </Card>
              ))
            ) : (
              categories.slice(0, 4).map((category) => (
                <Link key={category.id} href={`/vind-een-${category.slug}`}>
                  <Card className="p-6 text-center hover-elevate cursor-pointer transition-all h-full" data-testid={`card-category-${category.slug}`}>
                    <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary mx-auto mb-4">
                      {categoryIcons[category.slug] || <Leaf className="h-6 w-6" />}
                    </div>
                    <h3 className="font-semibold mb-1">{category.name}</h3>
                    <p className="text-sm text-muted-foreground">Bekijk professionals</p>
                  </Card>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-2" data-testid="text-featured-title">
                Uitgelichte tuinmannen
              </h2>
              <p className="text-muted-foreground">
                Ontdek de best beoordeelde professionals in België
              </p>
            </div>
            <Link href="/vind-een-tuinaanlegger" className="hidden sm:block">
              <Button variant="outline" className="gap-2" data-testid="button-view-all">
                Bekijk alle
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {profilesLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="p-5">
                  <div className="flex gap-4">
                    <Skeleton className="h-16 w-16 rounded-full" />
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
              featuredProfiles.slice(0, 6).map((profile) => (
                <ProfileCard key={profile.id} profile={profile} />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <Leaf className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">Nog geen tuinmannen beschikbaar</h3>
                <p className="text-muted-foreground mb-4">
                  Ben je tuinman? Registreer je nu en word zichtbaar voor duizenden potentiële klanten.
                </p>
                <Link href="/registreren">
                  <Button data-testid="button-register-empty">
                    Registreer als tuinman
                  </Button>
                </Link>
              </div>
            )}
          </div>

          <div className="sm:hidden mt-6 text-center">
            <Link href="/vind-een-tuinaanlegger">
              <Button variant="outline" className="gap-2">
                Bekijk alle tuinmannen
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">
              Waarom {siteConfig.name}?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Wij helpen je de beste tuinman te vinden voor jouw project
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="p-6 text-center">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mx-auto mb-4">
                  {feature.icon}
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">
              Ben je tuinman?
            </h2>
            <p className="text-primary-foreground/80 mb-8 text-lg">
              Word lid van {siteConfig.name} en bereik duizenden potentiële klanten in heel België. 
              Laat je werk zien en ontvang direct contactaanvragen.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/registreren">
                <Button size="lg" variant="secondary" className="gap-2" data-testid="button-cta-register">
                  <CheckCircle className="h-4 w-4" />
                  Registreer gratis
                </Button>
              </Link>
              <Link href="/over-ons">
                <Button size="lg" variant="outline" className="gap-2 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                  Meer informatie
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">
              Populaire locaties
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Vind tuinmannen in de grootste steden van België
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            {locationsLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-32 rounded-full" />
              ))
            ) : (
              locations.slice(0, 12).map((location) => (
                <Link key={location.id} href={`/vind-een-tuinaanlegger/${location.slug}`}>
                  <Button variant="outline" className="rounded-full" data-testid={`button-location-${location.slug}`}>
                    {location.name}
                  </Button>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
}
