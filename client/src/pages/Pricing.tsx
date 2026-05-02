import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SEO } from "@/components/SEO";
import { Check, Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Link } from "wouter";
import { siteConfig, formatPrice } from "@/lib/theme.config";
import { useSubscriptionOffers } from "@/lib/useSubscriptionOffers";

export default function Pricing() {
  const { plans, isLoading, isError } = useSubscriptionOffers();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title="Prijzen en abonnementen"
        description={`Bekijk de prijzen voor een vermelding op ${siteConfig.name}. Kies het abonnement dat bij jou past.`}
        canonical="/prijzen"
      />
      <Header />
      <main className="flex-1">
        <div className="bg-primary/5 border-b">
          <div className="container mx-auto px-4 py-12 text-center">
            <h1 className="text-3xl font-bold text-foreground" data-testid="text-pricing-title">
              Prijzen
            </h1>
            <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
              Eén vermelding, drie looptijden. Hoe langer je kiest, hoe meer je bespaart.
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : isError || plans.length === 0 ? (
            <Alert variant="destructive" className="max-w-md mx-auto">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Fout bij laden</AlertTitle>
              <AlertDescription>
                Kon de prijzen niet ophalen. Probeer het later opnieuw.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {plans.map((plan) => (
                <Card
                  key={plan.id}
                  className={`relative ${plan.popular ? "border-primary shadow-lg" : ""}`}
                  data-testid={`card-plan-${plan.id}`}
                >
                  {plan.popular && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                      Meest gekozen
                    </Badge>
                  )}
                  <CardHeader className="text-center pb-2">
                    <CardTitle className="text-xl">{plan.label}</CardTitle>
                    <CardDescription>
                      {plan.discount > 0
                        ? `${plan.discount}% korting t.o.v. jaarlijks betalen`
                        : "Standaard jaartarief"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    <div className="mb-6">
                      <span className="text-4xl font-bold" data-testid={`text-price-${plan.id}`}>
                        {formatPrice(plan.totalPrice, { withCents: true })}
                      </span>
                      <span className="text-muted-foreground"> totaal</span>
                      <p className="text-sm text-muted-foreground mt-1">
                        {formatPrice(plan.pricePerYear, { withCents: true })} / jaar
                      </p>
                    </div>

                    <ul className="space-y-3 text-left mb-6">
                      <li className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-sm">Volledig profiel met logo en foto's</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-sm">Onbeperkt contactaanvragen</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-sm">Vermelding op zoek- en specialisatiepagina's</span>
                      </li>
                      {plan.discount > 0 && (
                        <li className="flex items-start gap-2">
                          <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                          <span className="text-sm">{plan.discount}% korting</span>
                        </li>
                      )}
                    </ul>

                    <Button
                      className="w-full"
                      variant={plan.popular ? "default" : "outline"}
                      asChild
                    >
                      <Link href="/registreren">Aan de slag</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="max-w-3xl mx-auto mt-16">
            <Card>
              <CardHeader>
                <CardTitle>Veelgestelde vragen over prijzen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium">Kan ik mijn abonnement upgraden of downgraden?</h4>
                  <p className="text-muted-foreground text-sm mt-1">
                    Ja, je kunt op elk moment je abonnement wijzigen. De wijziging gaat in bij je volgende factuurdatum.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium">Hoe werkt de facturatie?</h4>
                  <p className="text-muted-foreground text-sm mt-1">
                    Je betaalt het volledige bedrag eenmalig bij activatie. Je ontvangt een factuur per email.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium">Kan ik mijn abonnement opzeggen?</h4>
                  <p className="text-muted-foreground text-sm mt-1">
                    Je profiel blijft actief tot het einde van je looptijd. Daarna stopt de zichtbaarheid automatisch.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
