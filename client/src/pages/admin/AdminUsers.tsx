import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { authFetch } from "@/lib/queryClient";
import { AdminLayout } from "./AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function AdminUsers() {
  const q = useQuery<any[]>({
    queryKey: ["/api/admin/users"],
    queryFn: async () => (await authFetch("/api/admin/users")).json(),
  });
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <AdminLayout title="Gebruikers" description="Practitioners + abonnementsstatus">
      <Card>
        <CardContent className="p-0">
          {q.isLoading ? <div className="p-8 text-center">Laden…</div> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Naam</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Profielen</TableHead>
                  <TableHead>Abonnement</TableHead>
                  <TableHead>Aangemaakt</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(q.data || []).map((u: any) => (
                  <TableRow key={u.id} data-testid={`row-user-${u.id}`}>
                    <TableCell>{u.firstname} {u.lastname}</TableCell>
                    <TableCell className="text-xs">{u.email}</TableCell>
                    <TableCell>{u.practitionerType?.name || "—"}</TableCell>
                    <TableCell>{u.profileCount}</TableCell>
                    <TableCell>{u.activeSubscription ? <Badge>Actief tot {u.activeSubscription.endDate}</Badge> : <Badge variant="outline">Geen</Badge>}</TableCell>
                    <TableCell className="text-xs">{new Date(u.createdAt).toLocaleDateString("nl-BE")}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => setOpenId(u.id)} data-testid={`button-detail-${u.id}`}>Detail</Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!q.data?.length && <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Geen gebruikers</TableCell></TableRow>}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <UserDetailDialog id={openId} onClose={() => setOpenId(null)} />
    </AdminLayout>
  );
}

function UserDetailDialog({ id, onClose }: { id: string | null; onClose: () => void }) {
  const q = useQuery<any>({
    queryKey: ["/api/admin/users", id],
    queryFn: async () => (await authFetch(`/api/admin/users/${id}`)).json(),
    enabled: !!id,
  });
  return (
    <Dialog open={!!id} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Gebruikersdetail</DialogTitle></DialogHeader>
        {q.isLoading && <div>Laden…</div>}
        {q.data && (
          <div className="space-y-4 text-sm">
            <div>
              <h3 className="font-bold">Practitioner</h3>
              <pre className="bg-muted p-2 rounded text-xs overflow-auto">{JSON.stringify(q.data.practitioner, null, 2)}</pre>
            </div>
            <div>
              <h3 className="font-bold">Profielen ({q.data.profiles.length})</h3>
              <ul className="text-xs">
                {q.data.profiles.map((p: any) => <li key={p.id}>{p.company_name} — <a href={`/admin/profielen/${p.id}`} className="text-primary underline">openen</a></li>)}
              </ul>
            </div>
            <div>
              <h3 className="font-bold">Abonnementen ({q.data.subscriptions.length})</h3>
              <ul className="text-xs">
                {q.data.subscriptions.map((s: any) => <li key={s.id}>{s.status} — {s.start_date || "?"} → {s.end_date || "?"}</li>)}
              </ul>
            </div>
            <div>
              <h3 className="font-bold">Betalingen ({q.data.payments.length})</h3>
              <ul className="text-xs">
                {q.data.payments.map((p: any) => <li key={p.id}>{p.amount} {p.currency} — {p.status} — {p.created_at?.split("T")[0]}</li>)}
              </ul>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
