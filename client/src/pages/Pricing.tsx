import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SEO } from "@/components/SEO";
import { useQuery } from "@tanstack/react-query";
import { Check, Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Link } from "wouter";
import type { SubscriptionPlan } from "@shared/schema";

export default function Pricing() {
  const { data: plans = [], isLoading, isError } = useQuery<SubscriptionPlan[]>({
    queryKey: ["/api/subscription-plans"],
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title="Prijzen en abonnementen"
        description="Bekijk de prijzen voor een vermelding op Zoek-een-tuinman.be. Kies het abonnement dat bij jou past."
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
              Kies het abonnement dat bij jou past. Geen verborgen kosten, maandelijks opzegbaar.
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : isError ? (
            <Alert variant="destructive" className="max-w-md mx-auto">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Fout bij laden</AlertTitle>
              <AlertDescription>
                Kon de prijzen niet ophalen. Probeer het later opnieuw.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {plans.map((plan, index) => {
                const features = plan.features?.split(",") || [];
                const isPopular = plan.type === "PROFESSIONAL";
                
                return (
                  <Card 
                    key={plan.id} 
                    className={`relative ${isPopular ? "border-primary shadow-lg" : ""}`}
                    data-testid={`card-plan-${plan.id}`}
                  >
                    {isPopular && (
                      <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                        Meest gekozen
                      </Badge>
                    )}
                    <CardHeader className="text-center pb-2">
                      <CardTitle className="text-xl">{plan.name}</CardTitle>
                      <CardDescription>{plan.generalInfo}</CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                      <div className="mb-6">
                        <span className="text-4xl font-bold">{plan.price.toFixed(2).replace(".", ",")}</span>
                        <span className="text-muted-foreground"> / maand</span>
                      </div>
                      
                      <ul className="space-y-3 text-left mb-6">
                        {features.map((feature: string, i: number) => (
                          <li key={i} className="flex items-start gap-2">
                            <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                            <span className="text-sm">{feature.trim()}</span>
                          </li>
                        ))}
                      </ul>
                      
                      <Button 
                        className="w-full" 
                        variant={isPopular ? "default" : "outline"}
                        asChild
                      >
                        <Link href="/registreren">Aan de slag</Link>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
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
                    Je wordt maandelijks gefactureerd. Je ontvangt een factuur per email en kunt je betalingsgeschiedenis bekijken in je dashboard.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium">Kan ik mijn abonnement opzeggen?</h4>
                  <p className="text-muted-foreground text-sm mt-1">
                    Ja, je kunt op elk moment opzeggen. Je profiel blijft actief tot het einde van je huidige factureringsperiode.
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
