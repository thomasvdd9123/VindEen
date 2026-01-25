import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2, Clock, ArrowRight } from "lucide-react";
import { Link } from "wouter";

interface PaymentStatusResponse {
  status: string;
  paymentStatus?: string;
  message?: string;
}

export default function PaymentStatus() {
  const { id: profileId } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [pollingEnabled, setPollingEnabled] = useState(true);

  const searchParams = new URLSearchParams(window.location.search);
  const paymentId = searchParams.get("payment_id");

  const { data: status, isLoading, error } = useQuery<PaymentStatusResponse>({
    queryKey: ["/api/mollie/payment-status", paymentId],
    queryFn: async () => {
      if (!paymentId) throw new Error("No payment ID");
      const res = await fetch(`/api/mollie/payment-status/${paymentId}`);
      if (!res.ok) throw new Error("Failed to check status");
      return res.json();
    },
    enabled: !!paymentId && pollingEnabled,
    refetchInterval: pollingEnabled ? 3000 : false,
  });

  useEffect(() => {
    if (status?.status === "ACTIVE" || status?.status === "CANCELLED") {
      setPollingEnabled(false);
    }
  }, [status?.status]);

  if (!paymentId) {
    return (
      <div className="container max-w-lg mx-auto py-12 px-4">
        <Card>
          <CardContent className="py-8 text-center">
            <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Geen betaling gevonden</h2>
            <p className="text-muted-foreground mb-4">
              We konden geen betalingsinformatie vinden.
            </p>
            <Link href="/dashboard/profielen">
              <Button data-testid="button-back-profiles">Terug naar profielen</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading && !status) {
    return (
      <div className="container max-w-lg mx-auto py-12 px-4">
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <h2 className="text-xl font-semibold">Betaling controleren...</h2>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container max-w-lg mx-auto py-12 px-4">
        <Card>
          <CardContent className="py-8 text-center">
            <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Er ging iets mis</h2>
            <p className="text-muted-foreground mb-4">
              We konden de betalingsstatus niet ophalen.
            </p>
            <Link href="/dashboard/profielen">
              <Button data-testid="button-back-profiles">Terug naar profielen</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status?.status === "ACTIVE") {
    return (
      <div className="container max-w-lg mx-auto py-12 px-4">
        <Card>
          <CardHeader className="text-center pb-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-2xl">Betaling geslaagd!</CardTitle>
            <CardDescription className="text-base">
              Je abonnement is nu actief. Je profiel is zichtbaar in de zoekresultaten.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground">
                Bedankt voor je vertrouwen in Zoek-een-tuinman.be!
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Link href={`/dashboard/profielen/${profileId}`}>
                <Button className="w-full gap-2" data-testid="button-view-profile">
                  Bekijk je profiel
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline" className="w-full" data-testid="button-go-dashboard">
                  Naar dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status?.status === "CANCELLED") {
    return (
      <div className="container max-w-lg mx-auto py-12 px-4">
        <Card>
          <CardHeader className="text-center pb-4">
            <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <CardTitle className="text-2xl">Betaling niet voltooid</CardTitle>
            <CardDescription className="text-base">
              Je betaling is geannuleerd of mislukt.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground">
                Je kunt het opnieuw proberen via je profielpagina.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Link href={`/dashboard/profielen/${profileId}/betalen`}>
                <Button className="w-full" data-testid="button-retry-payment">
                  Opnieuw proberen
                </Button>
              </Link>
              <Link href="/dashboard/profielen">
                <Button variant="outline" className="w-full" data-testid="button-back-profiles">
                  Terug naar profielen
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-lg mx-auto py-12 px-4">
      <Card>
        <CardHeader className="text-center pb-4">
          <Clock className="h-16 w-16 text-amber-500 mx-auto mb-4 animate-pulse" />
          <CardTitle className="text-2xl">Betaling wordt verwerkt</CardTitle>
          <CardDescription className="text-base">
            We wachten op bevestiging van je betaling...
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Dit kan even duren. Sluit deze pagina niet.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
