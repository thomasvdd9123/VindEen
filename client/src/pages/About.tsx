import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SEO } from "@/components/SEO";
import { siteConfig, fillCopy } from "@/lib/theme.config";
import { Link } from "wouter";
import { Users, Target, Shield, Leaf, type LucideIcon } from "lucide-react";

const ICONS: Record<string, LucideIcon> = { Users, Target, Shield, Leaf };

export default function About() {
  const copy = siteConfig.pages.about;
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title="Over ons"
        description={fillCopy(copy.seoDescription)}
        canonical="/over-ons"
      />
      <Header />
      <main className="flex-1">
        <div className="bg-primary/5 border-b">
          <div className="container mx-auto px-4 py-12">
            <h1 className="text-3xl font-bold text-foreground" data-testid="text-about-title">
              Over {siteConfig.name}
            </h1>
            <p className="text-muted-foreground mt-2 max-w-2xl">
              {fillCopy(copy.heroSubtitle)}
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
                  <p className="text-muted-foreground leading-relaxed">{fillCopy(copy.missionPara1)}</p>
                  <p className="text-muted-foreground leading-relaxed mt-4">{fillCopy(copy.missionPara2)}</p>
                </CardContent>
              </Card>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-6">Onze waarden</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {copy.values.map((value, index) => {
                  const Icon = ICONS[value.icon] || Leaf;
                  return (
                    <Card key={index} data-testid={`card-value-${index}`}>
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Icon className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{value.title}</h3>
                            <p className="text-muted-foreground text-sm mt-1">
                              {fillCopy(value.description)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </section>

            <section>
              <Card>
                <CardHeader>
                  <CardTitle>{fillCopy(copy.forBusinessesTitle)}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">{fillCopy(copy.forBusinessesBody)}</p>
                  <div className="flex gap-4">
                    <Button asChild>
                      <Link href="/registreren">Meld je praktijk aan</Link>
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
                  <CardTitle>{copy.forCustomersTitle}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">{fillCopy(copy.forCustomersBody)}</p>
                  <Button variant="outline" asChild>
                    <Link href={copy.findCtaHref}>{fillCopy(copy.findCtaLabel)}</Link>
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
