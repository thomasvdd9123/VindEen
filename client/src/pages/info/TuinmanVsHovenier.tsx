import { InfoPageLayout } from "@/components/InfoPageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Leaf, TreeDeciduous, Wrench, Lightbulb } from "lucide-react";

export default function TuinmanVsHovenier() {
  return (
    <InfoPageLayout
      title="Verschil tussen tuinman en hovenier"
      description="Wat is het verschil tussen een tuinman en een hovenier? Ontdek welke professional je nodig hebt voor jouw tuinproject."
      canonical="/info/tuinman-vs-hovenier"
      breadcrumbTitle="Tuinman vs hovenier"
      relatedLinks={[
        { title: "De tuinman", href: "/info/de-tuinman", description: "Wat doet een tuinman?" },
        { title: "Hoe werkt tuinaanleg?", href: "/info/hoe-werkt-tuinaanleg", description: "Het aanlegproces" },
        { title: "Goede tuinman vinden", href: "/info/goede-tuinman-vinden", description: "Tips voor je zoektocht" },
      ]}
    >
      <p className="lead text-lg font-medium text-foreground mb-6">
        In België worden de termen 'tuinman' en 'hovenier' vaak door elkaar gebruikt. Maar is 
        er eigenlijk een verschil? En zo ja, wie heb je dan nodig voor jouw tuinproject? 
        We leggen het uit.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-4 text-foreground">Korte samenvatting</h2>
      
      <p>
        In de praktijk is het verschil in België minimaal. De term 'hovenier' wordt traditioneel 
        meer in Nederland gebruikt, terwijl we in België vaker spreken van 'tuinman' of 
        'tuinaannemer'. Beide professionals kunnen zowel tuinonderhoud als tuinaanleg verzorgen.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8 not-prose">
        <Card className="border-t-4 border-t-primary">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Leaf className="h-5 w-5 text-primary" />
              De Tuinman
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              De term die in België het meest wordt gebruikt voor iemand die professioneel 
              tuinen onderhoudt en/of aanlegt.
            </p>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <span className="text-sm">Tuinonderhoud (maaien, snoeien)</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <span className="text-sm">Kleine tot middelgrote projecten</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <span className="text-sm">Praktijkgericht en hands-on</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <span className="text-sm">Vaak zelfstandig werkend</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-sky-500">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <TreeDeciduous className="h-5 w-5 text-sky-500" />
              De Hovenier
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Een meer formele term, traditioneel gebruikt voor gecertificeerde tuinprofessionals, 
              vooral in Nederland.
            </p>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-sky-500 mt-0.5 shrink-0" />
                <span className="text-sm">Tuinontwerp en -aanleg</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-sky-500 mt-0.5 shrink-0" />
                <span className="text-sm">Grotere, complexere projecten</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-sky-500 mt-0.5 shrink-0" />
                <span className="text-sm">Meer nadruk op design</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-sky-500 mt-0.5 shrink-0" />
                <span className="text-sm">Vaak met erkend diploma</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-xl font-semibold mt-8 mb-4 text-foreground">Andere benamingen</h2>
      
      <p>
        Naast tuinman en hovenier kom je in België ook andere termen tegen:
      </p>

      <ul className="space-y-3 mt-4">
        <li className="flex items-start gap-2">
          <Wrench className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div>
            <strong>Tuinaannemer:</strong> Een bedrijf dat zich richt op grotere tuinprojecten 
            en vaak meerdere werknemers in dienst heeft.
          </div>
        </li>
        <li className="flex items-start gap-2">
          <Lightbulb className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div>
            <strong>Tuinarchitect:</strong> Specialist in het ontwerpen van tuinen, vaak zonder 
            de uitvoering zelf te doen.
          </div>
        </li>
        <li className="flex items-start gap-2">
          <Leaf className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div>
            <strong>Groenwerker:</strong> Iemand die zich focust op het onderhoud van groen, 
            vaak in openbare ruimtes.
          </div>
        </li>
      </ul>

      <h2 className="text-xl font-semibold mt-10 mb-4 text-foreground">Wie heb jij nodig?</h2>
      
      <p>
        De keuze hangt af van je project:
      </p>

      <div className="bg-muted rounded-lg p-6 my-6 not-prose">
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold mb-1">Voor tuinonderhoud</h4>
            <p className="text-sm text-muted-foreground">
              Gras maaien, snoeien, onkruid verwijderen → Een tuinman met focus op onderhoud
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-1">Voor een nieuwe tuin</h4>
            <p className="text-sm text-muted-foreground">
              Complete aanleg met ontwerp → Een tuinman/hovenier met ervaring in tuinaanleg
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-1">Voor een tuinontwerp</h4>
            <p className="text-sm text-muted-foreground">
              Alleen een professioneel ontwerp → Een tuinarchitect of hovenier met ontwerpervaring
            </p>
          </div>
        </div>
      </div>

      <h2 className="text-xl font-semibold mt-8 mb-4 text-foreground">Conclusie</h2>
      
      <p>
        In de Belgische praktijk is het verschil tussen tuinman en hovenier minimaal. De meeste 
        professionals bieden zowel onderhoud als aanleg aan. Het belangrijkste is dat je iemand 
        vindt met de juiste ervaring voor jouw specifieke project.
      </p>

      <p className="mt-4">
        Op <strong>Zoek-een-tuinman.be</strong> vind je professionals met uiteenlopende 
        specialisaties. Filter op wat je nodig hebt en vind de perfecte match voor jouw tuin.
      </p>
    </InfoPageLayout>
  );
}
