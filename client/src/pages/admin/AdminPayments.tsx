import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient, authFetch } from "@/lib/queryClient";
import { AdminLayout } from "./AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Send } from "lucide-react";

export default function AdminPayments() {
  const { toast } = useToast();
  const q = useQuery<any[]>({
    queryKey: ["/api/admin/payments"],
    queryFn: async () => (await authFetch("/api/admin/payments")).json(),
  });
  const resend = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/admin/peppol/resend/${id}`),
    onSuccess: (d: any) => {
      toast({ title: "Peppol resend", description: d.message });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payments"] });
    },
    onError: (e: any) => toast({ title: "Fout", description: e.message, variant: "destructive" }),
  });

  return (
    <AdminLayout title="Betalingen" description="Recente betalingen + Peppol-resend">
      <Card>
        <CardContent className="p-0">
          {q.isLoading ? <div className="p-8 text-center">Laden…</div> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Datum</TableHead><TableHead>Bedrag</TableHead><TableHead>Status</TableHead>
                  <TableHead>Profiel</TableHead><TableHead>Externe ID</TableHead><TableHead>Peppol</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(q.data || []).map((p: any) => (
                  <TableRow key={p.id} data-testid={`row-payment-${p.id}`}>
                    <TableCell className="text-xs">{new Date(p.createdAt).toLocaleString("nl-BE")}</TableCell>
                    <TableCell>{p.amount} {p.currency}</TableCell>
                    <TableCell><Badge variant={p.status === "PAID" ? "default" : p.status === "FAILED" ? "destructive" : "secondary"}>{p.status}</Badge></TableCell>
                    <TableCell className="text-xs">{p.profileSubscription?.profile?.companyName || "—"}</TableCell>
                    <TableCell className="text-xs font-mono">{p.externalPaymentId || "—"}</TableCell>
                    <TableCell>
                      {/* Resend mag voor PAID (her-versturen) én voor FAILED/PENDING
                          (debug-pad: handmatig opnieuw proberen na een mislukte
                          webhook of skipped Peppol-flow). Alleen REFUNDED uitsluiten. */}
                      <Button size="sm" variant="outline" onClick={() => resend.mutate(p.id)} disabled={resend.isPending || p.status === "REFUNDED"} data-testid={`button-resend-${p.id}`}>
                        <Send className="h-3 w-3 mr-1" />Resend
                      </Button>
                      {(p.refundReason?.startsWith("[admin-resend") || p.refundReason?.startsWith("[peppol-resend")) && <div className="text-xs text-muted-foreground mt-1 max-w-xs truncate" title={p.refundReason}>{p.refundReason}</div>}
                    </TableCell>
                  </TableRow>
                ))}
                {!q.data?.length && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Geen betalingen</TableCell></TableRow>}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
