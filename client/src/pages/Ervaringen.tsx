import { Link } from "wouter";
import { InfoPageLayout } from "@/components/InfoPageLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, ArrowRight, Leaf, Quote, MapPin } from "lucide-react";
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
    <InfoPageLayout
      title="Ervaringen met tuinmannen"
      description="Lees ervaringen van klanten die via Zoek-een-tuinman.be een tuinprofessional hebben gevonden. Ontdek wat tuinprojecten kunnen betekenen."
      canonical="/ervaringen"
      breadcrumbTitle="Ervaringen"
      heroImage={heroErvaringen}
      heroImageAlt="Tevreden klanten in hun nieuwe tuin - ervaringen met tuinmannen"
      relatedLinks={[
        { title: "Goede tuinman vinden", href: "/info/goede-tuinman-vinden", description: "Praktische tips" },
        { title: "Kosten & prijzen", href: "/info/kosten-prijzen", description: "Wat kost een tuinman?" },
        { title: "Artikelen", href: "/artikelen", description: "Lees meer artikelen" },
      ]}
    >
      <div className="not-prose">
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

        <div className="space-y-6 mb-8">
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
                      <span className="text-xs text-muted-foreground">{exp.date}</span>
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

        <Card className="bg-primary text-primary-foreground">
          <CardContent className="p-8 text-center">
            <Leaf className="h-10 w-10 mx-auto mb-4 opacity-80" />
            <h2 className="text-2xl font-bold mb-2">Klaar om te starten?</h2>
            <p className="text-primary-foreground/80 mb-6 max-w-md mx-auto">
              Vind de perfecte tuinprofessional voor jouw project en creëer jouw eigen succesverhaal.
            </p>
            <Link href="/zoek">
              <Button size="lg" variant="secondary" className="gap-2">
                Zoek een tuinman
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </InfoPageLayout>
  );
}
