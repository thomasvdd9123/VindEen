import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient, authFetch } from "@/lib/queryClient";
import { AdminLayout } from "./AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, Repeat } from "lucide-react";

export default function AdminVerticals() {
  const { toast } = useToast();
  const [confirming, setConfirming] = useState<string | null>(null);
  const [secondConfirm, setSecondConfirm] = useState(false);

  const q = useQuery<any[]>({
    queryKey: ["/api/admin/vertical-presets"],
    queryFn: async () => (await authFetch("/api/admin/vertical-presets")).json(),
  });

  const apply = useMutation({
    mutationFn: (slug: string) => apiRequest("POST", `/api/admin/vertical-presets/${slug}/apply`),
    onSuccess: (data: any) => {
      toast({ title: "Verticaal geactiveerd", description: `${data.label}. Catalogus en site-config zijn vervangen.` });
      queryClient.invalidateQueries();
      setConfirming(null);
      setSecondConfirm(false);
      setTimeout(() => window.location.reload(), 1200);
    },
    onError: (e: any) => toast({ title: "Fout", description: e.message, variant: "destructive" }),
  });

  return (
    <AdminLayout title="Verticaal switchen" description="Activeer een vooraf opgeslagen verticaal-preset">
      <Alert variant="destructive" className="mb-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Destructieve actie</AlertTitle>
        <AlertDescription>
          Een preset toepassen <b>verwijdert alle bestaande service-categorieën en specialisaties</b> (incl. profiel-koppelingen) en herlaadt de site-config. Bestaande profielen blijven bestaan, maar verliezen hun categorie/specialisatie-koppelingen. Dubbele bevestiging vereist.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(q.data || []).map((p: any) => (
          <Card key={p.slug} data-testid={`preset-${p.slug}`}>
            <CardHeader>
              <CardTitle>{p.label}</CardTitle>
              <CardDescription>{p.categories} categorieën · {p.specializations} specialisaties</CardDescription>
            </CardHeader>
            <CardContent>
              {confirming === p.slug ? (
                <div className="space-y-2">
                  <p className="text-sm">Weet je het zeker? <b>Alle huidige catalogi worden vervangen.</b></p>
                  {!secondConfirm ? (
                    <Button variant="destructive" onClick={() => setSecondConfirm(true)}>Ja, ik begrijp dit</Button>
                  ) : (
                    <Button variant="destructive" onClick={() => apply.mutate(p.slug)} disabled={apply.isPending} data-testid={`button-apply-${p.slug}`}>
                      <Repeat className="h-4 w-4 mr-2" />Definitief toepassen
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => { setConfirming(null); setSecondConfirm(false); }}>Annuleren</Button>
                </div>
              ) : (
                <Button onClick={() => setConfirming(p.slug)} data-testid={`button-confirm-${p.slug}`}>Activeren…</Button>
              )}
            </CardContent>
          </Card>
        ))}
        {!q.data?.length && <p className="text-sm text-muted-foreground">Geen presets beschikbaar.</p>}
      </div>
    </AdminLayout>
  );
}
