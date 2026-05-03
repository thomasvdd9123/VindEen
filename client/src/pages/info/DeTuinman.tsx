import { InfoPageLayout } from "@/components/InfoPageLayout";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Leaf, Wrench, TreeDeciduous } from "lucide-react";
import heroImage from "@/assets/images/info-tuinman.jpg";

export default function DeTuinman() {
  return (
    <InfoPageLayout
      title="De tuinman: wat doet een tuinman precies?"
      description="Ontdek wat een tuinman doet, welke diensten hij aanbiedt en wanneer je een tuinman nodig hebt. Alles over het beroep van tuinman in België."
      canonical="/info/de-tuinman"
      breadcrumbTitle="De tuinman"
      heroImage={heroImage}
      heroImageAlt="Professionele tuinman aan het werk in een groene tuin"
      relatedLinks={[
        { title: "Tuinman vs hovenier", href: "/info/tuinman-vs-hovenier", description: "Wat is het verschil?" },
        { title: "Kosten & prijzen", href: "/info/kosten-prijzen", description: "Wat kost een tuinman?" },
        { title: "Goede tuinman vinden", href: "/info/goede-tuinman-vinden", description: "Tips voor je zoektocht" },
      ]}
    >
      <p className="lead text-lg font-medium text-foreground mb-6">
        Een tuinman is een professional die zich bezighoudt met het onderhouden, aanleggen en verzorgen 
        van tuinen. Of het nu gaat om een kleine stadstuin of een groot landgoed, de tuinman zorgt 
        ervoor dat jouw buitenruimte er het hele jaar door prachtig uitziet.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-4 text-foreground">Wat doet een tuinman?</h2>
      
      <p>
        Het werk van een tuinman is zeer gevarieerd. Van het maaien van het gazon tot het snoeien 
        van bomen en struiken, van het planten van nieuwe gewassen tot het bestrijden van onkruid. 
        Een goede tuinman combineert vakkennis met creativiteit om jouw tuin te transformeren tot 
        een groene oase.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-8 not-prose">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Leaf className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Tuinonderhoud</h3>
                <p className="text-sm text-muted-foreground">
                  Gras maaien, snoeien, onkruid verwijderen, bladeren ruimen en bemesting
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
                <h3 className="font-semibold mb-1">Tuinaanleg</h3>
                <p className="text-sm text-muted-foreground">
                  Nieuwe tuinen ontwerpen, terrassen aanleggen, beplanting kiezen
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
                <h3 className="font-semibold mb-1">Constructies</h3>
                <p className="text-sm text-muted-foreground">
                  Schuttingen, pergola's, tuinhuisjes en verhardingen plaatsen
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <CheckCircle className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Advies</h3>
                <p className="text-sm text-muted-foreground">
                  Persoonlijk tuinadvies, seizoensgebonden tips en plantkeuze
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-xl font-semibold mt-8 mb-4 text-foreground">Wanneer heb je een tuinman nodig?</h2>
      
      <ul className="space-y-2">
        <li className="flex items-start gap-2">
          <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <span>Je hebt geen tijd om zelf je tuin te onderhouden</span>
        </li>
        <li className="flex items-start gap-2">
          <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <span>Je wilt professioneel advies over beplanting en tuinindeling</span>
        </li>
        <li className="flex items-start gap-2">
          <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <span>Grote klussen zoals bomen snoeien of terrassen aanleggen</span>
        </li>
        <li className="flex items-start gap-2">
          <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <span>Je tuin heeft een complete makeover nodig</span>
        </li>
        <li className="flex items-start gap-2">
          <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <span>Seizoensgebonden taken zoals bladeren ruimen of winterklaar maken</span>
        </li>
      </ul>

      <h2 className="text-xl font-semibold mt-8 mb-4 text-foreground">Tuinman in België</h2>
      
      <p>
        In België zijn duizenden tuinmannen actief, van zelfstandige professionals tot grotere 
        tuinbedrijven. Via <strong>Zoek-een-tuinman.be</strong> vind je eenvoudig een betrouwbare 
        tuinman in jouw regio. Bekijk profielen en specialisaties en neem rechtstreeks contact op 
        voor een vrijblijvend gesprek of prijsopgave. Wij zijn een onafhankelijke gids — geen offerteplatform — 
        dus je aanvraag gaat enkel naar de tuinman die je zelf kiest.
      </p>

      <p className="mt-4">
        Of je nu in Vlaanderen, Wallonië of Brussel woont, er is altijd een vakkundige tuinman 
        bij jou in de buurt die je kan helpen met al je tuinklussen.
      </p>
    </InfoPageLayout>
  );
}
