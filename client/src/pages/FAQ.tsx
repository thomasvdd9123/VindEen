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
import { siteConfig, fillCopy } from "@/lib/theme.config";
import heroImage from "@/assets/images/info-faq.jpg";

export default function FAQ() {
  const groups = [
    { title: siteConfig.faq.forCustomersTitle, questions: siteConfig.faq.forCustomers },
    { title: siteConfig.faq.forBusinessesTitle, questions: siteConfig.faq.forBusinesses },
    { title: siteConfig.faq.generalTitle, questions: siteConfig.faq.general },
  ];

  return (
    <InfoPageLayout
      title="Veelgestelde vragen (FAQ)"
      description={fillCopy(`Vind antwoorden op veelgestelde vragen over ${siteConfig.name}. Informatie voor zowel klanten als {plural}.`)}
      canonical="/faq"
      breadcrumbTitle="Veelgestelde vragen"
      heroImage={heroImage}
      heroImageAlt={fillCopy("Veelgestelde vragen en antwoorden over {plural}")}
      relatedLinks={[
        { title: "Kosten & prijzen", href: siteConfig.infoRoutes.pricing, description: fillCopy("Wat kost {article}?") },
        { title: fillCopy("De {singular}"), href: siteConfig.infoRoutes.aboutBusiness, description: fillCopy("Wat doet {article}?") },
        { title: "Ervaringen", href: "/ervaringen", description: "Lees ervaringen van anderen" },
      ]}
    >
      <div className="space-y-8 not-prose">
        {groups.map((category, categoryIndex) => (
          <Card key={categoryIndex}>
            <CardHeader>
              <CardTitle className="text-xl">{category.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {category.questions.map((item, index) => (
                  <AccordionItem key={index} value={`${categoryIndex}-${index}`} data-testid={`accordion-faq-${categoryIndex}-${index}`}>
                    <AccordionTrigger className="text-left">
                      {fillCopy(item.question)}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {fillCopy(item.answer)}
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
              <Link href="/zoek/alle">
                <Button className="gap-2">
                  <Leaf className="h-4 w-4" />
                  {fillCopy("Zoek {article}")}
                </Button>
              </Link>
              <Link href={siteConfig.infoRoutes.forBusinesses}>
                <Button variant="outline" className="gap-2">
                  {fillCopy("Ben je {singular}?")}
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
