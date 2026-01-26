import { Link } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { SEO } from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from "@/components/ui/breadcrumb";
import { MessageSquare, Star, ArrowRight, Leaf, Quote, MapPin } from "lucide-react";
import { siteConfig } from "@/lib/theme.config";
import heroErvaringen from "@/assets/images/info-ervaringen.jpg";

const experiences = [
  {
    id: 1,
    name: "Jan & Marie",
    location: "Gent",
    project: "Complete tuinrenovatie",
    rating: 5,
    date: "December 2025",
    text: "We hebben via Zoek-een-tuinman een fantastische tuinman gevonden voor onze complete tuinrenovatie. Hij luisterde goed naar onze wensen en kwam met creatieve oplossingen. Het eindresultaat is prachtig geworden!",
    highlight: "Van verwilderde tuin naar droomoase",
  },
  {
    id: 2,
    name: "Peter",
    location: "Antwerpen",
    project: "Terras aanleg",
    rating: 5,
    date: "November 2025",
    text: "Ik zocht een tuinman voor het aanleggen van een nieuw terras. Via dit platform vond ik iemand die perfect bij mijn project paste. Professionele aanpak, netjes werken en een mooi resultaat. Aanrader!",
    highlight: "Professioneel terras binnen 5 dagen",
  },
  {
    id: 3,
    name: "Sophie & Tom",
    location: "Brugge",
    project: "Tuinonderhoud",
    rating: 4,
    date: "Oktober 2025",
    text: "We waren op zoek naar iemand voor regelmatig tuinonderhoud. Het was heel makkelijk om via de website verschillende tuinmannen te vergelijken. We hebben nu een vast contract en zijn zeer tevreden.",
    highlight: "Wekelijks onderhoud geregeld",
  },
  {
    id: 4,
    name: "Els",
    location: "Leuven",
    project: "Hagen snoeien",
    rating: 5,
    date: "September 2025",
    text: "Mijn hagen waren al jaren niet goed gesnoeid. Via Zoek-een-tuinman vond ik een specialist die mijn hagen weer in topvorm heeft gebracht. Snelle service en uitstekend resultaat.",
    highlight: "Perfecte haagsnit",
  },
  {
    id: 5,
    name: "Marc & Anja",
    location: "Hasselt",
    project: "Nieuwe tuinaanleg",
    rating: 5,
    date: "Augustus 2025",
    text: "Na de bouw van ons nieuwe huis hadden we alleen een kale tuin. De tuinman die we via dit platform vonden heeft een prachtig ontwerp gemaakt en uitgevoerd. We genieten elke dag van onze nieuwe tuin!",
    highlight: "Van kale grond naar groene tuin",
  },
  {
    id: 6,
    name: "Kris",
    location: "Kortrijk",
    project: "Boomonderhoud",
    rating: 5,
    date: "Juli 2025",
    text: "Ik had enkele grote bomen die dringend gesnoeid moesten worden. Het was fijn om een specialist te kunnen vinden die ook voor grotere klussen beschikbaar was. Alles netjes opgeruimd achtergelaten.",
    highlight: "Grote bomen vakkundig gesnoeid",
  },
];

export default function Ervaringen() {
  const averageRating = experiences.reduce((acc, exp) => acc + exp.rating, 0) / experiences.length;

  return (
    <Layout>
      <SEO
        title="Ervaringen met tuinmannen"
        description="Lees ervaringen van klanten die via Zoek-een-tuinman.be een tuinprofessional hebben gevonden. Ontdek wat tuinprojecten kunnen betekenen."
        canonical="/ervaringen"
      />

      <div className="bg-muted/30 border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/">Home</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Ervaringen</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      <div className="relative h-64 sm:h-80 overflow-hidden">
        <img 
          src={heroErvaringen} 
          alt="Tevreden klanten in hun nieuwe tuin"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 container mx-auto px-4 pb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2" data-testid="text-experiences-title">
            Ervaringen met tuinmannen
          </h1>
          <p className="text-muted-foreground max-w-xl">
            Ontdek wat tuinprojecten betekend hebben voor anderen en laat je inspireren.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-4 mb-8 p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
              <div className="text-center">
                <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                  {averageRating.toFixed(1)}
                </div>
                <div className="flex gap-0.5 justify-center">
                  {[1,2,3,4,5].map(i => (
                    <Star 
                      key={i} 
                      className={`h-4 w-4 ${i <= Math.round(averageRating) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'}`} 
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{experiences.length} ervaringen</p>
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">
                  Gemiddelde beoordeling van klanten die via {siteConfig.name} een tuinman hebben gevonden.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {experiences.map((exp) => (
                <Card key={exp.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-full bg-primary/10 shrink-0">
                        <Quote className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="font-semibold">{exp.name}</h3>
                          <Badge variant="secondary" className="text-xs">
                            <MapPin className="h-3 w-3 mr-1" />
                            {exp.location}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="flex gap-0.5">
                            {[1,2,3,4,5].map(i => (
                              <Star 
                                key={i} 
                                className={`h-4 w-4 ${i <= exp.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'}`} 
                              />
                            ))}
                          </div>
                          <span className="text-xs text-muted-foreground">• {exp.date}</span>
                        </div>
                        <Badge variant="outline" className="mb-3">{exp.project}</Badge>
                        <p className="text-muted-foreground mb-3">{exp.text}</p>
                        <p className="text-sm font-medium text-primary">{exp.highlight}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <aside className="space-y-6">
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Leaf className="h-5 w-5 text-primary" />
                  Zoek een tuinman
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Klaar om zelf een project te starten? Vind de perfecte tuinprofessional voor jouw project.
                </p>
                <Link href="/zoek">
                  <Button className="w-full gap-2">
                    Start je zoekopdracht
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Gerelateerde artikelen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/info/goede-tuinman-vinden">
                  <div className="group cursor-pointer">
                    <p className="font-medium text-sm group-hover:text-primary transition-colors flex items-center gap-1">
                      Hoe vind ik een goede tuinman?
                      <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </p>
                    <p className="text-xs text-muted-foreground">Praktische tips</p>
                  </div>
                </Link>
                <Link href="/info/kosten-prijzen">
                  <div className="group cursor-pointer">
                    <p className="font-medium text-sm group-hover:text-primary transition-colors flex items-center gap-1">
                      Kosten & prijzen
                      <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </p>
                    <p className="text-xs text-muted-foreground">Wat kost een tuinman?</p>
                  </div>
                </Link>
                <Link href="/faq">
                  <div className="group cursor-pointer">
                    <p className="font-medium text-sm group-hover:text-primary transition-colors flex items-center gap-1">
                      Veelgestelde vragen
                      <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </p>
                    <p className="text-xs text-muted-foreground">Antwoorden op je vragen</p>
                  </div>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Ben je tuinman?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Sluit je aan bij {siteConfig.name} en bereik meer klanten.
                </p>
                <Link href="/info/voor-tuinmannen">
                  <Button variant="outline" className="w-full gap-2">
                    Meer informatie
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </Layout>
  );
}
