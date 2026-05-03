import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient, authFetch } from "@/lib/queryClient";
import { AdminLayout } from "./AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";

export default function AdminSubscriptions() {
  return (
    <AdminLayout title="Abonnementen" description="Beheer plannen en aanbiedingen">
      <Tabs defaultValue="plans">
        <TabsList>
          <TabsTrigger value="plans">Plannen</TabsTrigger>
          <TabsTrigger value="offers">Aanbiedingen</TabsTrigger>
        </TabsList>
        <TabsContent value="plans"><PlansManager /></TabsContent>
        <TabsContent value="offers"><OffersManager /></TabsContent>
      </Tabs>
    </AdminLayout>
  );
}

function PlansManager() {
  const { toast } = useToast();
  const [edit, setEdit] = useState<any | null>(null);
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const q = useQuery<any[]>({ queryKey: ["/api/admin/catalog/subscription-plans"], queryFn: async () => (await authFetch("/api/admin/catalog/subscription-plans")).json() });
  const save = useMutation({
    mutationFn: (row: any) => row.id
      ? apiRequest("PUT", `/api/admin/catalog/subscription-plans/${row.id}`, row)
      : apiRequest("POST", "/api/admin/catalog/subscription-plans", row),
    onSuccess: () => { toast({ title: "Opgeslagen" }); queryClient.invalidateQueries({ queryKey: ["/api/admin/catalog/subscription-plans"] }); setOpen(false); },
    onError: (e: any) => toast({ title: "Fout", description: e.message, variant: "destructive" }),
  });
  const del = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/catalog/subscription-plans/${id}`),
    onSuccess: () => { toast({ title: "Verwijderd" }); queryClient.invalidateQueries({ queryKey: ["/api/admin/catalog/subscription-plans"] }); },
    onError: (e: any) => toast({ title: "Fout", description: e.message, variant: "destructive" }),
  });

  return (
    <Card className="mt-4"><CardContent className="p-4">
      <div className="flex justify-end mb-3"><Button size="sm" onClick={() => { setEdit({}); setOpen(true); }}><Plus className="h-4 w-4 mr-1" />Nieuw plan</Button></div>
      <Table>
        <TableHeader><TableRow><TableHead>Key</TableHead><TableHead>Naam</TableHead><TableHead>Prijs</TableHead><TableHead>Actief</TableHead><TableHead>Geldig van</TableHead><TableHead>Geldig tot</TableHead><TableHead></TableHead></TableRow></TableHeader>
        <TableBody>
          {(q.data || []).map((p: any) => (
            <TableRow key={p.id}>
              <TableCell>{p.key}</TableCell><TableCell>{p.name}</TableCell><TableCell>{p.price}</TableCell>
              <TableCell>{p.isActive ? "Ja" : "Nee"}</TableCell><TableCell>{p.validFrom || "—"}</TableCell><TableCell>{p.validUntil || "—"}</TableCell>
              <TableCell className="space-x-1">
                <Button size="sm" variant="ghost" onClick={() => { setEdit(p); setOpen(true); }}><Pencil className="h-3 w-3" /></Button>
                <Button size="sm" variant="ghost" onClick={() => setDeleteId(p.id)} data-testid={`button-delete-plan-${p.id}`}><Trash2 className="h-3 w-3" /></Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{edit?.id ? "Plan bewerken" : "Nieuw plan"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {[
              { k: "key", l: "Key" }, { k: "name", l: "Naam" }, { k: "description", l: "Omschrijving" },
            ].map((f) => <div key={f.k}><label className="text-sm">{f.l}</label><Input value={edit?.[f.k] ?? ""} onChange={(e) => setEdit({ ...edit, [f.k]: e.target.value })} /></div>)}
            <div><label className="text-sm">Prijs</label><Input type="number" step="0.01" value={edit?.price ?? ""} onChange={(e) => setEdit({ ...edit, price: parseFloat(e.target.value) })} /></div>
            <div><label className="text-sm">Sortering</label><Input type="number" value={edit?.sortOrder ?? ""} onChange={(e) => setEdit({ ...edit, sortOrder: parseInt(e.target.value) })} /></div>
            <div><label className="text-sm">Geldig van (YYYY-MM-DD)</label><Input value={edit?.validFrom ?? ""} onChange={(e) => setEdit({ ...edit, validFrom: e.target.value })} /></div>
            <div><label className="text-sm">Geldig tot (YYYY-MM-DD)</label><Input value={edit?.validUntil ?? ""} onChange={(e) => setEdit({ ...edit, validUntil: e.target.value })} /></div>
            <div className="flex items-center gap-2"><Switch checked={!!edit?.isActive} onCheckedChange={(v) => setEdit({ ...edit, isActive: v })} /><span>Actief</span></div>
          </div>
          <DialogFooter><Button onClick={() => save.mutate(edit)} disabled={save.isPending}>Opslaan</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Plan verwijderen?</AlertDialogTitle>
            <AlertDialogDescription>Weet je zeker dat je dit abonnementsplan wil verwijderen? Bestaande betalingen blijven behouden, maar het plan kan niet meer worden gekozen.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction
              disabled={del.isPending}
              onClick={() => {
                if (del.isPending || !deleteId) return;
                del.mutate(deleteId);
                setDeleteId(null);
              }}
              data-testid="button-delete-plan-confirm"
            >Verwijderen</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </CardContent></Card>
  );
}

function OffersManager() {
  const { toast } = useToast();
  const [edit, setEdit] = useState<any | null>(null);
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const plans = useQuery<any[]>({ queryKey: ["/api/admin/catalog/subscription-plans"], queryFn: async () => (await authFetch("/api/admin/catalog/subscription-plans")).json() });
  const q = useQuery<any[]>({ queryKey: ["/api/admin/catalog/subscription-plan-offers"], queryFn: async () => (await authFetch("/api/admin/catalog/subscription-plan-offers")).json() });
  const save = useMutation({
    mutationFn: (row: any) => row.id
      ? apiRequest("PUT", `/api/admin/catalog/subscription-plan-offers/${row.id}`, row)
      : apiRequest("POST", "/api/admin/catalog/subscription-plan-offers", row),
    onSuccess: () => { toast({ title: "Opgeslagen" }); queryClient.invalidateQueries({ queryKey: ["/api/admin/catalog/subscription-plan-offers"] }); setOpen(false); },
    onError: (e: any) => toast({ title: "Fout", description: e.message, variant: "destructive" }),
  });
  const del = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/catalog/subscription-plan-offers/${id}`),
    onSuccess: () => { toast({ title: "Verwijderd" }); queryClient.invalidateQueries({ queryKey: ["/api/admin/catalog/subscription-plan-offers"] }); },
    onError: (e: any) => toast({ title: "Fout", description: e.message, variant: "destructive" }),
  });

  return (
    <Card className="mt-4"><CardContent className="p-4">
      <div className="flex justify-end mb-3"><Button size="sm" onClick={() => { setEdit({}); setOpen(true); }}><Plus className="h-4 w-4 mr-1" />Nieuw aanbod</Button></div>
      <Table>
        <TableHeader><TableRow><TableHead>Plan</TableHead><TableHead>Jaren</TableHead><TableHead>Korting %</TableHead><TableHead>Totaal</TableHead><TableHead>Populair</TableHead><TableHead>Actief</TableHead><TableHead></TableHead></TableRow></TableHeader>
        <TableBody>
          {(q.data || []).map((o: any) => {
            const plan = (plans.data || []).find((p) => p.id === o.subscriptionPlanId);
            return (
              <TableRow key={o.id}>
                <TableCell>{plan?.name || o.subscriptionPlanId}</TableCell>
                <TableCell>{o.durationInYears}</TableCell><TableCell>{o.discountPercentage}</TableCell>
                <TableCell>{o.totalPrice}</TableCell><TableCell>{o.isPopular ? "Ja" : "Nee"}</TableCell><TableCell>{o.isActive ? "Ja" : "Nee"}</TableCell>
                <TableCell className="space-x-1">
                  <Button size="sm" variant="ghost" onClick={() => { setEdit(o); setOpen(true); }}><Pencil className="h-3 w-3" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => setDeleteId(o.id)} data-testid={`button-delete-offer-${o.id}`}><Trash2 className="h-3 w-3" /></Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{edit?.id ? "Aanbod bewerken" : "Nieuw aanbod"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><label className="text-sm">Plan</label>
              <Select value={edit?.subscriptionPlanId || ""} onValueChange={(v) => setEdit({ ...edit, subscriptionPlanId: v })}>
                <SelectTrigger><SelectValue placeholder="Kies plan…" /></SelectTrigger>
                <SelectContent>{(plans.data || []).map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><label className="text-sm">Looptijd (jaren)</label><Input type="number" value={edit?.durationInYears ?? ""} onChange={(e) => setEdit({ ...edit, durationInYears: parseInt(e.target.value) })} /></div>
            <div><label className="text-sm">Korting %</label><Input type="number" value={edit?.discountPercentage ?? ""} onChange={(e) => setEdit({ ...edit, discountPercentage: parseInt(e.target.value) })} /></div>
            <div><label className="text-sm">Totaalprijs</label><Input type="number" step="0.01" value={edit?.totalPrice ?? ""} onChange={(e) => setEdit({ ...edit, totalPrice: parseFloat(e.target.value) })} /></div>
            <div><label className="text-sm">Geldig van</label><Input value={edit?.validFrom ?? ""} onChange={(e) => setEdit({ ...edit, validFrom: e.target.value })} /></div>
            <div><label className="text-sm">Geldig tot</label><Input value={edit?.validUntil ?? ""} onChange={(e) => setEdit({ ...edit, validUntil: e.target.value })} /></div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2"><Switch checked={!!edit?.isPopular} onCheckedChange={(v) => setEdit({ ...edit, isPopular: v })} /><span>Populair</span></div>
              <div className="flex items-center gap-2"><Switch checked={!!edit?.isActive} onCheckedChange={(v) => setEdit({ ...edit, isActive: v })} /><span>Actief</span></div>
            </div>
          </div>
          <DialogFooter><Button onClick={() => save.mutate(edit)} disabled={save.isPending}>Opslaan</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Aanbod verwijderen?</AlertDialogTitle>
            <AlertDialogDescription>Weet je zeker dat je dit aanbod wil verwijderen?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction
              disabled={del.isPending}
              onClick={() => {
                if (del.isPending || !deleteId) return;
                del.mutate(deleteId);
                setDeleteId(null);
              }}
              data-testid="button-delete-offer-confirm"
            >Verwijderen</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </CardContent></Card>
  );
}
