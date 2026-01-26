import { InfoPageLayout } from "@/components/InfoPageLayout";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Lightbulb, PenTool, Shovel, Leaf, Calendar } from "lucide-react";
import heroImage from "@/assets/images/info-tuinaanleg.jpg";

export default function HoeWerktTuinaanleg() {
  const steps = [
    { number: 1, title: "Kennismakingsgesprek", icon: Lightbulb, description: "Bespreek je wensen, budget en ideeën met de tuinman" },
    { number: 2, title: "Tuinontwerp", icon: PenTool, description: "De tuinman maakt een ontwerp en beplantingsplan" },
    { number: 3, title: "Offerte & planning", icon: Calendar, description: "Je ontvangt een gedetailleerde offerte en planning" },
    { number: 4, title: "Uitvoering", icon: Shovel, description: "De tuinman gaat aan de slag met de aanleg" },
    { number: 5, title: "Oplevering", icon: Leaf, description: "Eindcontrole en overdracht van je nieuwe tuin" },
  ];

  return (
    <InfoPageLayout
      title="Hoe werkt tuinaanleg?"
      description="Ontdek stap voor stap hoe een tuinaanleg project verloopt. Van eerste gesprek tot oplevering van je droomtuin."
      canonical="/info/hoe-werkt-tuinaanleg"
      breadcrumbTitle="Hoe werkt tuinaanleg"
      heroImage={heroImage}
      heroImageAlt="Prachtig aangelegde tuin met paden en beplanting"
      relatedLinks={[
        { title: "De tuinman", href: "/info/de-tuinman", description: "Wat doet een tuinman?" },
        { title: "Kosten & prijzen", href: "/info/kosten-prijzen", description: "Wat kost tuinaanleg?" },
        { title: "Tuinman vs hovenier", href: "/info/tuinman-vs-hovenier", description: "Wie heb je nodig?" },
      ]}
    >
      <p className="lead text-lg font-medium text-foreground mb-6">
        Een nieuwe tuin laten aanleggen is een spannend project. Maar hoe gaat dat precies in 
        zijn werk? We nemen je mee door het volledige proces, van eerste idee tot de oplevering 
        van je droomtuin.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-6 text-foreground">De 5 stappen van tuinaanleg</h2>
      
      <div className="space-y-4 not-prose">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <Card key={step.number}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold shrink-0">
                    {step.number}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="h-4 w-4 text-primary" />
                      <h3 className="font-semibold">{step.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <h2 className="text-xl font-semibold mt-10 mb-4 text-foreground">Stap 1: Het kennismakingsgesprek</h2>
      
      <p>
        Alles begint met een gesprek. De tuinman komt bij je langs om de huidige situatie te 
        bekijken en je wensen te bespreken. Dit is het moment om je ideeën, inspiratiebeelden 
        en budget te delen. Een goede tuinman stelt gerichte vragen over:
      </p>

      <ul className="space-y-2 mt-4">
        <li className="flex items-start gap-2">
          <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <span>Hoe je de tuin wilt gebruiken (kinderen, huisdieren, entertainment)</span>
        </li>
        <li className="flex items-start gap-2">
          <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <span>Je voorkeuren qua stijl en beplanting</span>
        </li>
        <li className="flex items-start gap-2">
          <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <span>Hoeveel tijd je zelf wilt besteden aan onderhoud</span>
        </li>
        <li className="flex items-start gap-2">
          <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <span>Je beschikbare budget</span>
        </li>
      </ul>

      <h2 className="text-xl font-semibold mt-10 mb-4 text-foreground">Stap 2: Het tuinontwerp</h2>
      
      <p>
        Op basis van het gesprek maakt de tuinman een ontwerp. Dit kan variëren van een eenvoudige 
        schets tot een gedetailleerd 3D-ontwerp, afhankelijk van de complexiteit van het project. 
        Het ontwerp bevat meestal:
      </p>

      <ul className="space-y-2 mt-4">
        <li className="flex items-start gap-2">
          <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <span>Indeling van de tuin met paden, terrassen en borders</span>
        </li>
        <li className="flex items-start gap-2">
          <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <span>Beplantingsplan met plantkeuze</span>
        </li>
        <li className="flex items-start gap-2">
          <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <span>Materiaalkeuze voor verharding en constructies</span>
        </li>
      </ul>

      <h2 className="text-xl font-semibold mt-10 mb-4 text-foreground">Stap 3: Offerte en planning</h2>
      
      <p>
        Na goedkeuring van het ontwerp ontvang je een gedetailleerde offerte. Deze bevat alle 
        kosten uitgesplitst: materialen, arbeid, planten en eventuele extra's. Ook wordt een 
        planning opgesteld met de verwachte doorlooptijd.
      </p>

      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 my-6 not-prose">
        <p className="text-sm text-amber-800 dark:text-amber-200">
          <strong>Tip:</strong> Vraag altijd om een schriftelijke offerte met een duidelijke 
          omschrijving van alle werkzaamheden. Zo voorkom je verrassingen achteraf.
        </p>
      </div>

      <h2 className="text-xl font-semibold mt-8 mb-4 text-foreground">Stap 4: De uitvoering</h2>
      
      <p>
        Nu begint het echte werk! De tuinman gaat aan de slag volgens het plan. Afhankelijk van 
        de grootte van het project kan dit enkele dagen tot weken duren. Tijdens de uitvoering 
        is er regelmatig contact over de voortgang.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-4 text-foreground">Stap 5: Oplevering en nazorg</h2>
      
      <p>
        Bij de oplevering loop je samen met de tuinman door de tuin om te controleren of alles 
        naar wens is. Je krijgt uitleg over het onderhoud van je nieuwe tuin en tips voor de 
        eerste periode. Veel tuinmannen bieden ook onderhoudscontracten aan.
      </p>

      <h2 className="text-xl font-semibold mt-10 mb-4 text-foreground">Hoe lang duurt tuinaanleg?</h2>
      
      <p>
        De doorlooptijd varieert sterk per project:
      </p>

      <ul className="space-y-2 mt-4">
        <li><strong>Kleine tuin (50-100m²):</strong> 2-5 werkdagen</li>
        <li><strong>Middelgrote tuin (100-300m²):</strong> 1-3 weken</li>
        <li><strong>Grote tuin (300m² +):</strong> 3-6 weken of meer</li>
      </ul>

      <p className="mt-4">
        Het beste seizoen voor tuinaanleg is het voorjaar (maart-mei) of het najaar 
        (september-november), wanneer de weersomstandigheden gunstig zijn voor het planten.
      </p>
    </InfoPageLayout>
  );
}
