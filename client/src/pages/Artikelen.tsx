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
import { BookOpen, ArrowRight, Calendar, Clock, Leaf } from "lucide-react";
import heroTuinman from "@/assets/images/info-tuinman.jpg";
import heroTuinaanleg from "@/assets/images/info-tuinaanleg.jpg";
import heroZoeken from "@/assets/images/info-zoeken.jpg";
import heroKosten from "@/assets/images/info-kosten.jpg";

const articles = [
  {
    slug: "de-tuinman",
    title: "De tuinman: wat doet een tuinman precies?",
    description: "Ontdek wat een tuinman doet, welke diensten hij aanbiedt en wanneer je een tuinman nodig hebt.",
    category: "Informatie",
    date: "15 jan. 2026",
    readTime: "5 min",
    image: heroTuinman,
    href: "/info/de-tuinman",
  },
  {
    slug: "goede-tuinman-vinden",
    title: "Hoe vind ik een goede tuinman?",
    description: "Praktische tips om de beste tuinman te vinden in België. Leer waar je op moet letten.",
    category: "Tips",
    date: "12 jan. 2026",
    readTime: "6 min",
    image: heroZoeken,
    href: "/info/goede-tuinman-vinden",
  },
  {
    slug: "hoe-werkt-tuinaanleg",
    title: "Hoe werkt tuinaanleg?",
    description: "Stap voor stap hoe een tuinaanleg project verloopt. Van eerste gesprek tot oplevering.",
    category: "Gids",
    date: "10 jan. 2026",
    readTime: "8 min",
    image: heroTuinaanleg,
    href: "/info/hoe-werkt-tuinaanleg",
  },
  {
    slug: "tuinman-vs-hovenier",
    title: "Verschil tussen tuinman en hovenier",
    description: "Wat is het verschil tussen een tuinman en een hovenier? Ontdek welke professional je nodig hebt.",
    category: "Informatie",
    date: "8 jan. 2026",
    readTime: "4 min",
    image: heroTuinman,
    href: "/info/tuinman-vs-hovenier",
  },
  {
    slug: "kosten-prijzen",
    title: "Kosten & prijzen tuinman",
    description: "Wat kost een tuinman in België? Overzicht van gemiddelde tarieven voor tuinonderhoud en -aanleg.",
    category: "Prijzen",
    date: "5 jan. 2026",
    readTime: "7 min",
    image: heroKosten,
    href: "/info/kosten-prijzen",
  },
  {
    slug: "voor-tuinmannen",
    title: "Voor tuinmannen: word lid van ons platform",
    description: "Ontdek de voordelen van Zoek-een-tuinman.be voor tuinprofessionals. Meer klanten, meer zichtbaarheid.",
    category: "Voor professionals",
    date: "1 jan. 2026",
    readTime: "5 min",
    image: heroTuinman,
    href: "/info/voor-tuinmannen",
  },
];

export default function Artikelen() {
  return (
    <Layout>
      <SEO
        title="Artikelen over tuinieren en tuinmannen"
        description="Lees onze artikelen over tuinonderhoud, tuinaanleg, prijzen en tips voor het vinden van de beste tuinman in België."
        canonical="/artikelen"
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
                <BreadcrumbPage>Artikelen</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="text-center mb-10">
          <BookOpen className="h-12 w-12 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-4" data-testid="text-articles-title">Artikelen & Tips</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Handige informatie over tuinonderhoud, tuinaanleg en het vinden van de juiste tuinprofessional. 
            Lees onze artikelen en maak weloverwogen keuzes voor jouw tuin.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {articles.map((article) => (
            <Link key={article.slug} href={article.href}>
              <Card className="h-full cursor-pointer hover-elevate transition-all">
                <div className="relative h-48 overflow-hidden rounded-t-lg">
                  <img 
                    src={article.image} 
                    alt={article.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3">
                    <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm">
                      {article.category}
                    </Badge>
                  </div>
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg line-clamp-2">{article.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {article.description}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {article.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {article.readTime}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <Card className="bg-primary text-primary-foreground">
          <CardContent className="p-8 text-center">
            <Leaf className="h-10 w-10 mx-auto mb-4 opacity-80" />
            <h2 className="text-2xl font-bold mb-2">Op zoek naar een tuinman?</h2>
            <p className="text-primary-foreground/80 mb-6 max-w-md mx-auto">
              Vind de perfecte tuinprofessional voor jouw project in heel België.
            </p>
            <Link href="/zoek">
              <Button size="lg" variant="secondary" className="gap-2">
                Start je zoekopdracht
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
