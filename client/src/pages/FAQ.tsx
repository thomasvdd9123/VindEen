import { Link } from "wouter";
import { InfoPageLayout } from "@/components/InfoPageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Leaf, ArrowRight, MessageSquare } from "lucide-react";
import { siteConfig } from "@/lib/theme.config";
import heroImage from "@/assets/images/info-faq.jpg";

const faqCategories = [
  {
    title: "Voor klanten",
    questions: [
      {
        question: "Hoe vind ik een tuinman in mijn regio?",
        answer: "Gebruik de zoekfunctie op onze homepage. Vul je gemeente of postcode in en bekijk alle beschikbare tuinmannen in jouw omgeving. Je kunt filteren op specialisatie om precies te vinden wat je nodig hebt."
      },
      {
        question: "Is het gratis om een tuinman te zoeken?",
        answer: "Ja, het zoeken en bekijken van profielen op Zoek-een-tuinman.be is volledig gratis. Je kunt onbeperkt profielen bekijken en contact opnemen met tuinmannen."
      },
      {
        question: "Hoe neem ik contact op met een tuinman?",
        answer: "Op elk profiel vind je een contactformulier. Vul je gegevens in en beschrijf kort wat je nodig hebt. De tuinman ontvangt je bericht en neemt contact met je op."
      },
      {
        question: "Wat kost een tuinman gemiddeld?",
        answer: "Tarieven variëren per regio en type werk. Gemiddeld rekenen tuinmannen €35-€50 per uur voor standaard onderhoud. Voor meer gedetailleerde prijsinformatie, bekijk onze pagina over kosten en prijzen."
      },
      {
        question: "Zijn de tuinmannen op dit platform betrouwbaar?",
        answer: "Wij verifiëren alle tuinmannen op ons platform. Je ziet bij elk profiel of deze geverifieerd is. We raden altijd aan om referenties te vragen en een schriftelijke offerte te ontvangen."
      },
      {
        question: "Kan ik reviews zien van andere klanten?",
        answer: "Op de profielpagina's kun je informatie vinden over de ervaring en specialisaties van de tuinman. We werken aan het toevoegen van een reviewsysteem."
      },
    ]
  },
  {
    title: "Voor tuinmannen",
    questions: [
      {
        question: "Hoe kan ik mij aanmelden als tuinman?",
        answer: "Registreer je gratis via de 'Registreren' knop. Na het aanmaken van je account kun je je bedrijfsprofiel invullen met je specialisaties, foto's en contactgegevens."
      },
      {
        question: "Wat kost een vermelding op dit platform?",
        answer: "We bieden verschillende abonnementsopties aan. Na het gratis aanmaken van je account en profiel kun je een abonnement kiezen dat bij je past."
      },
      {
        question: "Hoe word ik geverifieerd?",
        answer: "Na het volledig invullen van je profiel wordt dit door ons team beoordeeld. We controleren of alle gegevens kloppen en of je een actief bedrijf hebt. Dit proces duurt meestal 1-2 werkdagen."
      },
      {
        question: "Hoe ontvang ik contactaanvragen?",
        answer: "Wanneer een klant contact opneemt via je profiel, ontvang je een e-mail met de aanvraag. Je kunt alle aanvragen ook bekijken in je persoonlijke dashboard."
      },
      {
        question: "Kan ik meerdere profielen aanmaken?",
        answer: "Ja, als je meerdere vestigingen of gespecialiseerde diensten hebt, kun je meerdere profielen aanmaken onder één account. Elk profiel heeft een apart abonnement nodig."
      },
      {
        question: "Hoe kan ik mijn profiel aanpassen?",
        answer: "Log in op je account en ga naar je dashboard. Daar kun je al je profielgegevens aanpassen, foto's toevoegen en je specialisaties bijwerken."
      },
      {
        question: "Kan ik mijn profiel tijdelijk verbergen?",
        answer: "Ja, in je dashboard kun je je profiel op 'inactief' zetten. Je profiel blijft bestaan maar is niet zichtbaar voor bezoekers totdat je het weer activeert."
      },
      {
        question: "Hoe kan ik mijn abonnement opzeggen?",
        answer: "Je kunt je abonnement beheren in je dashboard onder 'Abonnement'. Hier kun je je abonnement opzeggen, pauzeren of upgraden."
      },
    ]
  },
  {
    title: "Algemeen",
    questions: [
      {
        question: "Wat is Zoek-een-tuinman.be?",
        answer: "Zoek-een-tuinman.be is het grootste online platform om tuinprofessionals te vinden in België. We verbinden klanten met betrouwbare tuinmannen, hoveniers en tuinaannemers in heel het land."
      },
      {
        question: "In welke regio's zijn jullie actief?",
        answer: "We zijn actief in heel België: Vlaanderen, Wallonië en het Brussels Hoofdstedelijk Gewest. Je kunt zoeken in alle 572 Belgische gemeenten."
      },
      {
        question: "Hoe kan ik contact opnemen met jullie?",
        answer: "Je kunt ons bereiken via het contactformulier op onze website of per e-mail. We proberen alle vragen binnen 24 uur te beantwoorden."
      },
      {
        question: "Verwerken jullie mijn gegevens veilig?",
        answer: "Ja, we nemen privacy zeer serieus. Al je gegevens worden veilig opgeslagen en verwerkt volgens de GDPR-richtlijnen. Lees ons privacybeleid voor meer informatie."
      },
      {
        question: "Hoe kan ik mijn wachtwoord wijzigen?",
        answer: "Ga naar je dashboard en klik op 'Account'. Hier kun je je wachtwoord wijzigen. Je kunt ook via de 'Wachtwoord vergeten' link op de inlogpagina een nieuw wachtwoord aanvragen."
      },
    ]
  },
];

export default function FAQ() {
  return (
    <InfoPageLayout
      title="Veelgestelde vragen (FAQ)"
      description="Vind antwoorden op veelgestelde vragen over Zoek-een-tuinman.be. Informatie voor zowel klanten als tuinprofessionals."
      canonical="/faq"
      breadcrumbTitle="Veelgestelde vragen"
      heroImage={heroImage}
      heroImageAlt="Veelgestelde vragen en antwoorden over tuinmannen"
      relatedLinks={[
        { title: "Kosten & prijzen", href: "/info/kosten-prijzen", description: "Wat kost een tuinman?" },
        { title: "De tuinman", href: "/info/de-tuinman", description: "Wat doet een tuinman?" },
        { title: "Ervaringen", href: "/ervaringen", description: "Lees ervaringen van anderen" },
      ]}
    >
      <div className="space-y-8 not-prose">
        {faqCategories.map((category, categoryIndex) => (
          <Card key={categoryIndex}>
            <CardHeader>
              <CardTitle className="text-xl">{category.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {category.questions.map((item, index) => (
                  <AccordionItem key={index} value={`${categoryIndex}-${index}`} data-testid={`accordion-faq-${categoryIndex}-${index}`}>
                    <AccordionTrigger className="text-left">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        ))}

        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6 text-center">
            <MessageSquare className="h-10 w-10 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Nog vragen?</h3>
            <p className="text-muted-foreground mb-4 max-w-md mx-auto">
              Staat je vraag er niet tussen? Neem dan gerust contact met ons op via{" "}
              <a href={`mailto:${siteConfig.email}`} className="text-primary hover:underline">
                {siteConfig.email}
              </a>
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/zoek">
                <Button className="gap-2">
                  <Leaf className="h-4 w-4" />
                  Zoek een tuinman
                </Button>
              </Link>
              <Link href="/info/voor-tuinmannen">
                <Button variant="outline" className="gap-2">
                  Ben je tuinman?
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </InfoPageLayout>
  );
}
