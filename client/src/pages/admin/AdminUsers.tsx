import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { authFetch } from "@/lib/queryClient";
import { AdminLayout } from "./AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

function formatDate(d?: string | null) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("nl-BE", { day: "numeric", month: "short", year: "numeric" }); }
  catch { return d; }
}

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
                    <TableCell>{u.activeSubscription ? <Badge>Actief tot {formatDate(u.activeSubscription.endDate)}</Badge> : <Badge variant="outline">Geen</Badge>}</TableCell>
                    <TableCell className="text-xs">{formatDate(u.createdAt)}</TableCell>
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
              <h3 className="font-bold mb-2">Practitioner</h3>
              <dl className="grid grid-cols-[140px_1fr] gap-y-1 gap-x-3 text-xs">
                <dt className="text-muted-foreground">Naam</dt><dd>{q.data.practitioner.firstname} {q.data.practitioner.lastname}</dd>
                <dt className="text-muted-foreground">Email</dt><dd>{q.data.practitioner.email}</dd>
                <dt className="text-muted-foreground">Type</dt><dd>{q.data.practitioner.practitioner_type?.name || "—"}</dd>
                <dt className="text-muted-foreground">Bedrijf</dt><dd>{q.data.practitioner.company_name || "—"}</dd>
                <dt className="text-muted-foreground">BTW</dt><dd>{q.data.practitioner.vat || "—"}</dd>
                <dt className="text-muted-foreground">Aangemaakt</dt><dd>{formatDate(q.data.practitioner.created_at)}</dd>
              </dl>
            </div>
            <div>
              <h3 className="font-bold">Profielen ({q.data.profiles.length})</h3>
              <ul className="text-xs space-y-1 mt-1">
                {q.data.profiles.map((p: any) => (
                  <li key={p.id}>
                    {p.company_name} —{" "}
                    <Link href={`/admin/profielen/${p.id}`} className="text-primary underline">openen</Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-bold">Abonnementen ({q.data.subscriptions.length})</h3>
              <ul className="text-xs space-y-1 mt-1">
                {q.data.subscriptions.map((s: any) => (
                  <li key={s.id}>{s.status} — {formatDate(s.start_date)} → {formatDate(s.end_date)}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-bold">Betalingen ({q.data.payments.length})</h3>
              <ul className="text-xs space-y-1 mt-1">
                {q.data.payments.map((p: any) => (
                  <li key={p.id}>{p.amount} {p.currency} — {p.status} — {formatDate(p.created_at)}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
