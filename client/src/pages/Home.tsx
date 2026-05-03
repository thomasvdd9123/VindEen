import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { SEO, generateOrganizationSchema, generateWebSiteSchema } from "@/components/SEO";
import { SearchBox } from "@/components/SearchBox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowRight, 
  Leaf,
  BookOpen,
  Star,
  GraduationCap,
  Users,
} from "lucide-react";
import { siteConfig, fillCopy } from "@/lib/theme.config";
import type { Location } from "@shared/schema";
import featuredGardenerImg from "@/assets/images/featured-gardener.jpg";

const quickStartLinks = siteConfig.homepage.quickStartLinks;
const experienceLinks = siteConfig.homepage.experienceLinks;

export default function Home() {
  const { data: locations = [], isLoading: locationsLoading } = useQuery<Location[]>({
    queryKey: ["/api/locations"],
  });

  const structuredData = [
    generateOrganizationSchema(),
    generateWebSiteSchema(),
  ];

  return (
    <Layout>
      <SEO
        title={fillCopy("Vind een {singular} in {country}")}
        description={fillCopy("Zoek een {singular} in jouw regio. Bekijk profielen en specialisaties en contacteer de {singular} zelf — gratis en zonder tussenpersoon.")}
        canonical="/"
        structuredData={structuredData}
      />
      
      {/* Hero Section with Search */}
      <section className="relative bg-gradient-to-b from-primary/5 via-muted/30 to-background">
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMjkxNTQiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        
        <div className="container mx-auto px-4 py-12 sm:py-16 relative">
          <div className="max-w-4xl mx-auto">
            {locationsLoading ? (
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
              <SearchBox locations={locations} />
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
                  <h4 className="font-semibold text-base mb-3">{fillCopy("Ervaringen met {plural}")}</h4>
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

            {/* In de kijker column - Featured */}
            <Card className="border-t-4 border-t-primary shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Star className="h-5 w-5 text-amber-500" />
                  In de kijker
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="relative h-40 bg-muted rounded-md mb-4 overflow-hidden">
                  <img 
                    src={featuredGardenerImg} 
                    alt={siteConfig.homepage.featuredImageAlt} 
                    className="w-full h-full object-cover opacity-90"
                  />
                </div>
                
                <h4 className="font-medium mb-2">{siteConfig.homepage.featuredHeading}</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  {siteConfig.homepage.featuredBody}
                </p>
                
                <Link href="/zoek/alle">
                  <span className="text-sm text-primary hover:underline cursor-pointer">
                    {fillCopy("Bekijk alle {plural}")} <ArrowRight className="h-3 w-3 inline" />
                  </span>
                </Link>
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

      {/* CTA Section for Professionals */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-80" />
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">
              {siteConfig.homepage.ctaTitle}
            </h2>
            <p className="text-primary-foreground/80 mb-8 text-lg">
              Word lid van {siteConfig.name} en bereik duizenden potentiële klanten in heel {siteConfig.country}.
              Laat je werk zien en ontvang direct contactaanvragen.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/registreren">
                <Button size="lg" variant="secondary" className="gap-2" data-testid="button-cta-register">
                  <Leaf className="h-4 w-4" />
                  Meld je praktijk gratis aan
                </Button>
              </Link>
              <Link href={siteConfig.homepage.ctaInfoHref}>
                <Button size="lg" variant="outline" className="gap-2 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                  {siteConfig.homepage.ctaInfoLabel}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
