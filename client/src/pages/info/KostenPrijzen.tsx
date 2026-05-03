import { InfoPageLayout } from "@/components/InfoPageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Euro, Clock, Wrench, Leaf, TreeDeciduous, Home } from "lucide-react";
import heroImage from "@/assets/images/info-kosten.jpg";
import { useSiteConfig } from "@/lib/useSiteConfig";

export default function KostenPrijzen() {
  const { country, vatPercentage } = useSiteConfig();
  const priceTable = [
    { service: "Gras maaien", price: "€30 - €60", unit: "per beurt", note: "Afhankelijk van oppervlakte" },
    { service: "Hagen knippen", price: "€5 - €15", unit: "per meter", note: "Hoogte en dichtheid bepalen prijs" },
    { service: "Bomen snoeien", price: "€100 - €500+", unit: "per boom", note: "Sterk afhankelijk van grootte" },
    { service: "Onkruid verwijderen", price: "€35 - €50", unit: "per uur", note: "Of vaste prijs per m²" },
    { service: "Bladeren ruimen", price: "€35 - €50", unit: "per uur", note: "Seizoenswerk (herfst)" },
    { service: "Tuinaanleg (klein)", price: "€50 - €100", unit: "per m²", note: "Eenvoudige beplanting" },
    { service: "Tuinaanleg (compleet)", price: "€100 - €250", unit: "per m²", note: "Inclusief verharding" },
    { service: "Terras aanleggen", price: "€80 - €150", unit: "per m²", note: "Exclusief materialen" },
  ];

  return (
    <InfoPageLayout
      title="Kosten & prijzen tuinman"
      description="Wat kost een tuinman in België? Overzicht van gemiddelde tarieven voor tuinonderhoud, tuinaanleg en andere tuinwerkzaamheden."
      canonical="/info/kosten-prijzen"
      breadcrumbTitle="Kosten & prijzen"
      heroImage={heroImage}
      heroImageAlt="Calculator en euro munten voor kostenberekening tuinman"
      relatedLinks={[
        { title: "Goede tuinman vinden", href: "/info/goede-tuinman-vinden", description: "Tips voor je zoektocht" },
        { title: "Hoe werkt tuinaanleg?", href: "/info/hoe-werkt-tuinaanleg", description: "Het aanlegproces" },
        { title: "FAQ", href: "/faq", description: "Veelgestelde vragen" },
      ]}
    >
      <p className="lead text-lg font-medium text-foreground mb-6">
        Wat kost een tuinman in België? De tarieven variëren sterk afhankelijk van het type 
        werk, de regio en de ervaring van de professional. Hieronder vind je een overzicht 
        van gemiddelde prijzen om je een idee te geven.
      </p>

      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-8 not-prose">
        <p className="text-sm text-amber-800 dark:text-amber-200">
          <strong>Let op:</strong> Onderstaande prijzen zijn indicatief en kunnen variëren 
          per regio en professional. Vraag altijd een persoonlijke offerte aan.
        </p>
      </div>

      <h2 className="text-xl font-semibold mt-8 mb-4 text-foreground">Uurtarief tuinman</h2>
      
      <p>
        De meeste tuinmannen in België werken met een uurtarief. Dit ligt gemiddeld tussen:
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6 not-prose">
        <Card className="text-center">
          <CardContent className="pt-6">
            <Euro className="h-8 w-8 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold text-primary">€35 - €45</p>
            <p className="text-sm text-muted-foreground">Per uur (excl. BTW)</p>
            <p className="text-xs text-muted-foreground mt-1">Standaard onderhoud</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-6">
            <Clock className="h-8 w-8 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold text-primary">€45 - €60</p>
            <p className="text-sm text-muted-foreground">Per uur (excl. BTW)</p>
            <p className="text-xs text-muted-foreground mt-1">Gespecialiseerd werk</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-6">
            <Wrench className="h-8 w-8 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold text-primary">€60+</p>
            <p className="text-sm text-muted-foreground">Per uur (excl. BTW)</p>
            <p className="text-xs text-muted-foreground mt-1">Met machines/kraan</p>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-xl font-semibold mt-10 mb-4 text-foreground">Prijzen per dienst</h2>

      <div className="overflow-x-auto not-prose">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-4 font-semibold">Dienst</th>
              <th className="text-left py-3 px-4 font-semibold">Richtprijs</th>
              <th className="text-left py-3 px-4 font-semibold hidden sm:table-cell">Eenheid</th>
              <th className="text-left py-3 px-4 font-semibold hidden md:table-cell">Opmerking</th>
            </tr>
          </thead>
          <tbody>
            {priceTable.map((row, index) => (
              <tr key={index} className="border-b border-border hover:bg-muted/50">
                <td className="py-3 px-4">{row.service}</td>
                <td className="py-3 px-4 font-medium text-primary">{row.price}</td>
                <td className="py-3 px-4 text-muted-foreground hidden sm:table-cell">{row.unit}</td>
                <td className="py-3 px-4 text-sm text-muted-foreground hidden md:table-cell">{row.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="text-xl font-semibold mt-10 mb-4 text-foreground">Wat bepaalt de prijs?</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6 not-prose">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Home className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Grootte van de tuin</h3>
                <p className="text-sm text-muted-foreground">
                  Hoe groter de tuin, hoe meer tijd en dus kosten. Vaak daalt de m²-prijs bij 
                  grotere oppervlaktes.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <TreeDeciduous className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Complexiteit</h3>
                <p className="text-sm text-muted-foreground">
                  Een tuin met veel bomen, struiken of hoogteverschillen vraagt meer werk dan 
                  een eenvoudig gazon.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Leaf className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Staat van de tuin</h3>
                <p className="text-sm text-muted-foreground">
                  Een verwilderde tuin opknappen kost meer dan regulier onderhoud van een 
                  verzorgde tuin.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Wrench className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Benodigde machines</h3>
                <p className="text-sm text-muted-foreground">
                  Werk dat speciale machines vereist (hoogwerker, mini-kraan) is duurder.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-xl font-semibold mt-10 mb-4 text-foreground">Tips om kosten te besparen</h2>
      
      <ul className="space-y-3">
        <li className="flex items-start gap-2">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary font-semibold text-sm shrink-0">1</span>
          <div>
            <strong>Vraag meerdere offertes:</strong> Vergelijk minimaal 2-3 offertes om een 
            goed beeld te krijgen van de markt.
          </div>
        </li>
        <li className="flex items-start gap-2">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary font-semibold text-sm shrink-0">2</span>
          <div>
            <strong>Kies voor een onderhoudscontract:</strong> Bij regelmatig onderhoud krijg 
            je vaak een voordeligere prijs.
          </div>
        </li>
        <li className="flex items-start gap-2">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary font-semibold text-sm shrink-0">3</span>
          <div>
            <strong>Plan buiten het hoogseizoen:</strong> In de winter zijn tuinmannen vaak 
            minder druk bezet en flexibeler met prijzen.
          </div>
        </li>
        <li className="flex items-start gap-2">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary font-semibold text-sm shrink-0">4</span>
          <div>
            <strong>Combineer werkzaamheden:</strong> Laat meerdere klussen tegelijk uitvoeren 
            om verplaatsingskosten te beperken.
          </div>
        </li>
      </ul>

      <h2 className="text-xl font-semibold mt-10 mb-4 text-foreground">BTW-tarief</h2>
      
      <p>
        Voor diensten in {country} geldt het standaard BTW-tarief van{" "}
        <strong>{vatPercentage ?? 21}%</strong>. Voor sommige sectoren of woningen
        kunnen verlaagde tarieven gelden — dit is afhankelijk van de aard van de
        werkzaamheden.
      </p>
    </InfoPageLayout>
  );
}
