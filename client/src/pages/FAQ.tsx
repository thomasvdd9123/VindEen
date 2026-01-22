import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { siteConfig } from "@/lib/theme.config";

const faqs = [
  {
    question: "Hoe kan ik mij registreren als tuinman?",
    answer: "Klik op 'Registreren' in de navigatiebalk en vul je gegevens in. Na registratie ontvang je een bevestigingsmail. Zodra je email is bevestigd, kun je inloggen en je profiel aanmaken."
  },
  {
    question: "Wat kost een vermelding op Tuinmanvinden.be?",
    answer: "Bekijk onze prijzenpagina voor een overzicht van de beschikbare abonnementen. We bieden verschillende opties aan, van een basisvermelding tot premium pakketten met extra functies."
  },
  {
    question: "Hoe wordt mijn profiel zichtbaar voor bezoekers?",
    answer: "Je profiel wordt zichtbaar nadat je een actief abonnement hebt en je profiel volledig is ingevuld. Hoe completer je profiel, hoe hoger je in de zoekresultaten verschijnt."
  },
  {
    question: "Kan ik mijn profiel tijdelijk verbergen?",
    answer: "Ja, in je dashboard kun je je profiel op 'inactief' zetten. Je profiel blijft bestaan maar is niet zichtbaar voor bezoekers totdat je het weer activeert."
  },
  {
    question: "Hoe ontvang ik contactaanvragen?",
    answer: "Wanneer een bezoeker je contactformulier invult, ontvang je een email met de gegevens. Je kunt ook alle aanvragen bekijken in je dashboard onder 'Contacten'."
  },
  {
    question: "Kan ik foto's van mijn werk uploaden?",
    answer: "Ja, je kunt een profielfoto en meerdere foto's van uitgevoerde werken toevoegen aan je profiel. Goede foto's helpen bezoekers een beeld te krijgen van je werk."
  },
  {
    question: "Hoe kan ik mijn abonnement opzeggen?",
    answer: "Je kunt je abonnement beheren in je dashboard onder 'Abonnement'. Hier kun je je abonnement opzeggen, pauzeren of upgraden."
  },
  {
    question: "Wat gebeurt er als mijn abonnement verloopt?",
    answer: "Na het verlopen van je abonnement krijg je een grace period van 7 dagen. Daarna wordt je profiel automatisch op privé gezet totdat je je abonnement vernieuwt."
  },
  {
    question: "Hoe kan ik mijn wachtwoord wijzigen?",
    answer: "Ga naar je dashboard en klik op 'Account'. Hier kun je je wachtwoord wijzigen. Je kunt ook via de 'Wachtwoord vergeten' link op de inlogpagina een nieuw wachtwoord aanvragen."
  },
  {
    question: "In welke regio's is Tuinmanvinden.be actief?",
    answer: "Tuinmanvinden.be is actief in heel België. Je kunt je werkgebied instellen in je profiel, zodat bezoekers uit jouw regio je kunnen vinden."
  }
];

export default function FAQ() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="bg-primary/5 border-b">
          <div className="container mx-auto px-4 py-12">
            <h1 className="text-3xl font-bold text-foreground" data-testid="text-faq-title">
              Veelgestelde vragen
            </h1>
            <p className="text-muted-foreground mt-2">
              Antwoorden op de meest gestelde vragen over {siteConfig.name}
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>FAQ</CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {faqs.map((faq, index) => (
                    <AccordionItem key={index} value={`item-${index}`} data-testid={`accordion-faq-${index}`}>
                      <AccordionTrigger className="text-left">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>

            <Card className="mt-8">
              <CardContent className="py-6">
                <h3 className="font-semibold mb-2">Staat je vraag er niet bij?</h3>
                <p className="text-muted-foreground">
                  Neem gerust contact met ons op via{" "}
                  <a href={`mailto:${siteConfig.email}`} className="text-primary hover:underline">
                    {siteConfig.email}
                  </a>
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
