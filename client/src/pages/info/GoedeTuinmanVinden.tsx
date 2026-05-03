import { InfoPageLayout } from "@/components/InfoPageLayout";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Search, Star, MessageSquare, Euro, Shield } from "lucide-react";
import heroImage from "@/assets/images/info-zoeken.jpg";

export default function GoedeTuinmanVinden() {
  return (
    <InfoPageLayout
      title="Hoe vind ik een goede tuinman?"
      description="Praktische tips om de beste tuinman te vinden in België. Leer waar je op moet letten bij het kiezen van een tuinprofessional."
      canonical="/info/goede-tuinman-vinden"
      breadcrumbTitle="Goede tuinman vinden"
      heroImage={heroImage}
      heroImageAlt="Persoon zoekt online naar de beste tuinman"
      relatedLinks={[
        { title: "De tuinman", href: "/info/de-tuinman", description: "Wat doet een tuinman?" },
        { title: "Kosten & prijzen", href: "/info/kosten-prijzen", description: "Wat mag je verwachten?" },
        { title: "Ervaringen", href: "/ervaringen", description: "Lees ervaringen van anderen" },
      ]}
    >
      <p className="lead text-lg font-medium text-foreground mb-6">
        Het vinden van een betrouwbare tuinman kan een uitdaging zijn. Met deze praktische tips 
        weet je precies waar je op moet letten om de perfecte tuinprofessional te vinden voor 
        jouw project.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-4 text-foreground">Stap 1: Bepaal wat je nodig hebt</h2>
      
      <p>
        Voordat je op zoek gaat, is het belangrijk om te weten wat je precies wilt. Gaat het om 
        regelmatig onderhoud of een eenmalig project? Heb je iemand nodig voor gras maaien of 
        voor een complete tuinrenovatie? Hoe specifieker je wensen, hoe makkelijker het is om 
        de juiste tuinman te vinden.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-8 not-prose">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Search className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Zoek lokaal</h3>
                <p className="text-sm text-muted-foreground">
                  Een tuinman uit je eigen regio kent het lokale klimaat en de bodemgesteldheid
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Star className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Check referenties</h3>
                <p className="text-sm text-muted-foreground">
                  Vraag naar eerdere projecten en bekijk foto's van uitgevoerd werk
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Euro className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Vraag een persoonlijke prijsopgave</h3>
                <p className="text-sm text-muted-foreground">
                  Bespreek je project rechtstreeks met de tuinman van je keuze en vraag een duidelijke, schriftelijke prijsopgave
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Controleer verzekering</h3>
                <p className="text-sm text-muted-foreground">
                  Zorg dat de tuinman verzekerd is voor eventuele schade
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-xl font-semibold mt-8 mb-4 text-foreground">Stap 2: Waar moet je op letten?</h2>
      
      <ul className="space-y-3">
        <li className="flex items-start gap-2">
          <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div>
            <strong>Ervaring en specialisatie:</strong> Heeft de tuinman ervaring met jouw type 
            project? Sommige tuinmannen zijn gespecialiseerd in onderhoud, anderen in aanleg.
          </div>
        </li>
        <li className="flex items-start gap-2">
          <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div>
            <strong>Communicatie:</strong> Een goede tuinman luistert naar je wensen en geeft 
            duidelijke uitleg over wat er mogelijk is.
          </div>
        </li>
        <li className="flex items-start gap-2">
          <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div>
            <strong>Schriftelijke offerte:</strong> Vraag altijd een gedetailleerde offerte met 
            een duidelijke omschrijving van de werkzaamheden en kosten.
          </div>
        </li>
        <li className="flex items-start gap-2">
          <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div>
            <strong>BTW-nummer:</strong> Een professionele tuinman heeft een geldig BTW-nummer 
            en werkt met facturen.
          </div>
        </li>
        <li className="flex items-start gap-2">
          <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div>
            <strong>Garantie:</strong> Vraag naar garantie op het geleverde werk, vooral bij 
            grotere projecten zoals tuinaanleg.
          </div>
        </li>
      </ul>

      <h2 className="text-xl font-semibold mt-8 mb-4 text-foreground">Stap 3: Het eerste contact</h2>
      
      <p>
        Neem contact op met de tuinman en beschrijf je project. Let op hoe snel en professioneel 
        er wordt gereageerd. Een goede tuinman komt bij voorkeur eerst langs om de situatie te 
        bekijken voordat er een offerte wordt opgesteld.
      </p>

      <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 my-8 not-prose">
        <div className="flex items-start gap-3">
          <MessageSquare className="h-6 w-6 text-primary shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-lg mb-2">Vragen om te stellen</h3>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>Hoelang bent u al actief als tuinman?</li>
              <li>Heeft u ervaring met dit type project?</li>
              <li>Kunt u referenties of foto's tonen?</li>
              <li>Bent u verzekerd?</li>
              <li>Wat zijn uw tarieven en hoe factureert u?</li>
              <li>Wanneer zou u kunnen starten?</li>
            </ul>
          </div>
        </div>
      </div>

      <h2 className="text-xl font-semibold mt-8 mb-4 text-foreground">Vind jouw tuinman via ons platform</h2>
      
      <p>
        Op <strong>Zoek-een-tuinman.be</strong> vind je geverifieerde tuinprofessionals in heel 
        België. Bekijk hun profielen, specialisaties en ervaring, en neem direct contact op. 
        Zo vind je snel en eenvoudig de perfecte tuinman voor jouw project.
      </p>
    </InfoPageLayout>
  );
}
