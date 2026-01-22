import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { siteConfig } from "@/lib/theme.config";
import { Link } from "wouter";
import { Users, Target, Shield, Leaf } from "lucide-react";

const values = [
  {
    icon: Users,
    title: "Verbinding",
    description: "We brengen tuinprofessionals en klanten samen voor succesvolle samenwerkingen."
  },
  {
    icon: Target,
    title: "Kwaliteit",
    description: "We selecteren alleen betrouwbare en gekwalificeerde tuinprofessionals."
  },
  {
    icon: Shield,
    title: "Vertrouwen",
    description: "Transparantie en eerlijkheid staan centraal in alles wat we doen."
  },
  {
    icon: Leaf,
    title: "Duurzaamheid",
    description: "We moedigen ecologisch verantwoorde tuinpraktijken aan."
  }
];

export default function About() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="bg-primary/5 border-b">
          <div className="container mx-auto px-4 py-12">
            <h1 className="text-3xl font-bold text-foreground" data-testid="text-about-title">
              Over {siteConfig.name}
            </h1>
            <p className="text-muted-foreground mt-2 max-w-2xl">
              Het platform dat tuinprofessionals en klanten samenbrengt in België.
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto space-y-12">
            <section>
              <Card>
                <CardHeader>
                  <CardTitle>Onze missie</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-slate dark:prose-invert max-w-none">
                  <p className="text-muted-foreground leading-relaxed">
                    {siteConfig.name} is ontstaan vanuit een eenvoudige vraag: hoe vind je een betrouwbare 
                    tuinman in je buurt? We merkten dat veel mensen moeite hadden om de juiste 
                    tuinprofessional te vinden, terwijl er tegelijkertijd vele bekwame tuinmannen zijn 
                    die zoeken naar nieuwe klanten.
                  </p>
                  <p className="text-muted-foreground leading-relaxed mt-4">
                    Ons platform biedt een oplossing door tuinprofessionals een plek te geven waar ze 
                    hun expertise kunnen tonen, en klanten de mogelijkheid geeft om gemakkelijk de 
                    perfecte match te vinden voor hun tuinproject.
                  </p>
                </CardContent>
              </Card>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-6">Onze waarden</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {values.map((value, index) => (
                  <Card key={index} data-testid={`card-value-${index}`}>
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <value.icon className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{value.title}</h3>
                          <p className="text-muted-foreground text-sm mt-1">
                            {value.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            <section>
              <Card>
                <CardHeader>
                  <CardTitle>Voor tuinprofessionals</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Ben je een tuinman, hovenier, tuinarchitect of boomverzorger? Registreer je 
                    profiel en bereik klanten in heel België. Met een professioneel profiel 
                    presenteer je je werk en specialisaties aan potentiële klanten.
                  </p>
                  <div className="flex gap-4">
                    <Button asChild>
                      <Link href="/registreren">Registreer nu</Link>
                    </Button>
                    <Button variant="outline" asChild>
                      <Link href="/prijzen">Bekijk prijzen</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </section>

            <section>
              <Card>
                <CardHeader>
                  <CardTitle>Voor particulieren en bedrijven</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Op zoek naar een tuinman voor je project? Blader door onze database van 
                    gekwalificeerde tuinprofessionals, bekijk hun portfolio en neem direct contact 
                    op. Gratis en vrijblijvend.
                  </p>
                  <Button variant="outline" asChild>
                    <Link href="/zoek/tuinaanlegger">Vind een tuinman</Link>
                  </Button>
                </CardContent>
              </Card>
            </section>

            <section>
              <Card>
                <CardContent className="py-6">
                  <div className="text-center">
                    <h3 className="font-semibold mb-2">Vragen?</h3>
                    <p className="text-muted-foreground mb-4">
                      Neem gerust contact met ons op. We helpen je graag verder.
                    </p>
                    <Button variant="outline" asChild>
                      <Link href="/contact">Neem contact op</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
