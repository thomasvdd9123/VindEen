import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "./DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, CreditCard, Check, Star, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import type { Profile, Account } from "@shared/schema";

const BASE_YEARLY_PRICE = 156;
const pricingPlans = [
  { 
    id: "1-year", 
    years: 1, 
    discount: 0, 
    totalPrice: BASE_YEARLY_PRICE,
    pricePerYear: BASE_YEARLY_PRICE,
    label: "1 jaar",
    popular: false
  },
  { 
    id: "2-year", 
    years: 2, 
    discount: 5, 
    totalPrice: Math.round(BASE_YEARLY_PRICE * 2 * 0.95 * 100) / 100,
    pricePerYear: Math.round(BASE_YEARLY_PRICE * 0.95 * 100) / 100,
    label: "2 jaar",
    popular: true
  },
  { 
    id: "3-year", 
    years: 3, 
    discount: 10, 
    totalPrice: Math.round(BASE_YEARLY_PRICE * 3 * 0.90 * 100) / 100,
    pricePerYear: Math.round(BASE_YEARLY_PRICE * 0.90 * 100) / 100,
    label: "3 jaar",
    popular: false
  },
];

export default function ProfilePayment() {
  const [, params] = useRoute("/dashboard/profielen/:id/betalen");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState("2-year");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const profileId = params?.id;

  const { data: profile, isLoading: isLoadingProfile } = useQuery<Profile>({
    queryKey: ["/api/profiles/by-id", profileId],
    enabled: !!profileId,
  });

  const { data: account } = useQuery<Account>({
    queryKey: ["/api/accounts/by-auth", user?.id],
    enabled: !!user?.id,
  });

  const handlePayment = async () => {
    if (!account?.id || !profileId) {
      toast({
        title: "Fout",
        description: "Account of profiel niet gevonden.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/mollie/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: account.id,
          profileId: profileId,
          planId: selectedPlan,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Payment failed");
      }

      const data = await response.json();

      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        throw new Error("Geen betaal-URL ontvangen");
      }
    } catch (error) {
      toast({
        title: "Betaling mislukt",
        description: "Er ging iets mis. Probeer het opnieuw.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingProfile) {
    return (
      <DashboardLayout title="Laden..." description="">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (!profile) {
    return (
      <DashboardLayout title="Profiel niet gevonden" description="">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">Dit profiel kon niet worden gevonden.</p>
            <Link href="/dashboard/profielen">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Terug naar profielen
              </Button>
            </Link>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      title={`Betalen voor ${profile.name}`}
      description="Kies een abonnement om je profiel zichtbaar te maken"
    >
      <div className="max-w-3xl space-y-6">
        <Link href="/dashboard/profielen">
          <Button variant="ghost" size="sm" className="gap-2 mb-4">
            <ArrowLeft className="h-4 w-4" />
            Terug naar profielen
          </Button>
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Kies je abonnement
            </CardTitle>
            <CardDescription>
              Met een actief abonnement wordt je profiel zichtbaar voor potentiële klanten
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={selectedPlan}
              onValueChange={setSelectedPlan}
              className="space-y-4"
            >
              {pricingPlans.map((plan) => (
                <div key={plan.id} className="relative">
                  <Label
                    htmlFor={plan.id}
                    className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedPlan === plan.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value={plan.id} id={plan.id} data-testid={`select-plan-${plan.years}`} />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{plan.label}</span>
                          {plan.popular && (
                            <Badge variant="secondary" className="gap-1">
                              <Star className="h-3 w-3" />
                              Populair
                            </Badge>
                          )}
                          {plan.discount > 0 && (
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              {plan.discount}% korting
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          €{plan.pricePerYear.toFixed(2)}/jaar
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-lg">€{plan.totalPrice.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">totaal</p>
                    </div>
                  </Label>
                </div>
              ))}
            </RadioGroup>

            <div className="mt-6 pt-6 border-t">
              <div className="flex items-center justify-between mb-4">
                <span className="text-muted-foreground">Totaal te betalen</span>
                <span className="text-2xl font-bold">
                  €{pricingPlans.find(p => p.id === selectedPlan)?.totalPrice.toFixed(2)}
                </span>
              </div>

              <Button 
                onClick={handlePayment}
                disabled={isSubmitting}
                className="w-full gap-2"
                size="lg"
                data-testid="button-submit-payment"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Bezig met verwerken...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Nu betalen
                  </>
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center mt-4">
                Betaling wordt verwerkt via een beveiligde verbinding.
                Na betaling is je profiel direct zichtbaar.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
