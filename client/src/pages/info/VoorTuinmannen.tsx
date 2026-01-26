import { Link } from "wouter";
import { InfoPageLayout } from "@/components/InfoPageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Users, Eye, MessageSquare, BarChart3, Shield, Leaf, ArrowRight, Star } from "lucide-react";
import { siteConfig } from "@/lib/theme.config";

export default function VoorTuinmannen() {
  const benefits = [
    { icon: Eye, title: "Meer zichtbaarheid", description: "Word gevonden door duizenden potentiële klanten in heel België" },
    { icon: MessageSquare, title: "Directe contacten", description: "Ontvang contactaanvragen rechtstreeks in je dashboard" },
    { icon: BarChart3, title: "Statistieken", description: "Bekijk hoeveel mensen je profiel bekijken en contact opnemen" },
    { icon: Shield, title: "Betrouwbaarheid", description: "Geverifieerde profielen wekken meer vertrouwen bij klanten" },
  ];

  return (
    <InfoPageLayout
      title="Voor tuinmannen"
      description="Word lid van Zoek-een-tuinman.be en bereik meer klanten. Ontdek de voordelen van ons platform voor tuinprofessionals."
      canonical="/info/voor-tuinmannen"
      breadcrumbTitle="Voor tuinmannen"
      showCta={false}
      relatedLinks={[
        { title: "Kosten & prijzen", href: "/info/kosten-prijzen", description: "Tarieven voor klanten" },
        { title: "Hoe werkt tuinaanleg?", href: "/info/hoe-werkt-tuinaanleg", description: "Het aanlegproces" },
        { title: "FAQ", href: "/faq", description: "Veelgestelde vragen" },
      ]}
    >
      <p className="lead text-lg font-medium text-foreground mb-6">
        Ben je tuinman, hovenier of tuinaannemer? Sluit je aan bij <strong>{siteConfig.name}</strong> en 
        bereik duizenden potentiële klanten in heel België. Laat je werk zien en ontvang 
        direct contactaanvragen.
      </p>

      <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 mb-8 not-prose">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-primary/10">
              <Leaf className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Start vandaag nog</h3>
              <p className="text-sm text-muted-foreground">Maak gratis een account aan</p>
            </div>
          </div>
          <Link href="/registreren">
            <Button size="lg" className="gap-2">
              Registreer nu
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      <h2 className="text-xl font-semibold mt-8 mb-6 text-foreground">Waarom {siteConfig.name}?</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 not-prose">
        {benefits.map((benefit, index) => {
          const Icon = benefit.icon;
          return (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{benefit.title}</h3>
                    <p className="text-sm text-muted-foreground">{benefit.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <h2 className="text-xl font-semibold mt-10 mb-4 text-foreground">Wat krijg je als lid?</h2>
      
      <ul className="space-y-3">
        <li className="flex items-start gap-2">
          <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div>
            <strong>Eigen bedrijfsprofiel:</strong> Presenteer je bedrijf met foto's, beschrijving, 
            specialisaties en contactgegevens.
          </div>
        </li>
        <li className="flex items-start gap-2">
          <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div>
            <strong>Lokale vindbaarheid:</strong> Word gevonden door klanten in jouw regio via 
            onze zoekmachine.
          </div>
        </li>
        <li className="flex items-start gap-2">
          <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div>
            <strong>Contactformulier:</strong> Klanten kunnen direct via je profiel contact 
            opnemen, je ontvangt de aanvragen per e-mail en in je dashboard.
          </div>
        </li>
        <li className="flex items-start gap-2">
          <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div>
            <strong>Statistieken dashboard:</strong> Bekijk hoeveel bezoekers je profiel bekijken, 
            hoeveel er doorklikken naar je website en hoeveel contactaanvragen je ontvangt.
          </div>
        </li>
        <li className="flex items-start gap-2">
          <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div>
            <strong>SEO-geoptimaliseerd:</strong> Je profiel is geoptimaliseerd voor zoekmachines, 
            zodat je ook via Google gevonden wordt.
          </div>
        </li>
      </ul>

      <h2 className="text-xl font-semibold mt-10 mb-4 text-foreground">Hoe werkt het?</h2>
      
      <div className="space-y-4 not-prose">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold shrink-0">
                1
              </div>
              <div>
                <h3 className="font-semibold mb-1">Maak een account aan</h3>
                <p className="text-sm text-muted-foreground">
                  Registreer je met je e-mailadres en maak een gratis account aan.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold shrink-0">
                2
              </div>
              <div>
                <h3 className="font-semibold mb-1">Maak je profiel aan</h3>
                <p className="text-sm text-muted-foreground">
                  Vul je bedrijfsgegevens in, upload foto's en kies je specialisaties.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold shrink-0">
                3
              </div>
              <div>
                <h3 className="font-semibold mb-1">Activeer je abonnement</h3>
                <p className="text-sm text-muted-foreground">
                  Kies een abonnement en maak je profiel zichtbaar voor klanten.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold shrink-0">
                4
              </div>
              <div>
                <h3 className="font-semibold mb-1">Ontvang contactaanvragen</h3>
                <p className="text-sm text-muted-foreground">
                  Potentiële klanten vinden je en nemen contact op via je profiel.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-xl font-semibold mt-10 mb-4 text-foreground">Wat klanten zeggen</h2>
      
      <div className="grid grid-cols-1 gap-4 not-prose">
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-1 mb-2">
              {[1,2,3,4,5].map(i => <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />)}
            </div>
            <p className="text-sm italic text-muted-foreground mb-2">
              "Sinds ik op Zoek-een-tuinman sta, krijg ik regelmatig nieuwe klanten. Het platform 
              is eenvoudig te gebruiken en de klantenservice is uitstekend."
            </p>
            <p className="text-sm font-medium">— Johan, tuinman in Antwerpen</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-1 mb-2">
              {[1,2,3,4,5].map(i => <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />)}
            </div>
            <p className="text-sm italic text-muted-foreground mb-2">
              "De statistieken geven me inzicht in hoe mijn profiel presteert. Ik kan zien welke 
              specialisaties het meest gevraagd zijn in mijn regio."
            </p>
            <p className="text-sm font-medium">— Marc, hovenier in Gent</p>
          </CardContent>
        </Card>
      </div>

      <div className="bg-primary text-primary-foreground rounded-lg p-8 mt-10 text-center not-prose">
        <Users className="h-12 w-12 mx-auto mb-4 opacity-80" />
        <h3 className="text-2xl font-bold mb-2">Klaar om te starten?</h3>
        <p className="text-primary-foreground/80 mb-6 max-w-md mx-auto">
          Sluit je aan bij honderden tuinprofessionals die al gebruik maken van ons platform.
        </p>
        <Link href="/registreren">
          <Button size="lg" variant="secondary" className="gap-2">
            <Leaf className="h-4 w-4" />
            Registreer nu gratis
          </Button>
        </Link>
      </div>
    </InfoPageLayout>
  );
}
