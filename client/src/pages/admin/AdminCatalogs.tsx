import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient, authFetch } from "@/lib/queryClient";
import { AdminLayout } from "./AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Pencil } from "lucide-react";

type FieldDef = { key: string; label: string; type: "text" | "number" | "boolean" | "select"; options?: () => { value: string; label: string }[]; optional?: boolean };

interface CatalogConfig {
  slug: string;
  label: string;
  fields: FieldDef[];
  display: string[]; // columns to display
}

export default function AdminCatalogs() {
  const cats = useQuery<any[]>({ queryKey: ["/api/admin/catalog/service-categories"], queryFn: async () => (await authFetch("/api/admin/catalog/service-categories")).json() });
  const questions = useQuery<any[]>({ queryKey: ["/api/admin/catalog/practical-questions"], queryFn: async () => (await authFetch("/api/admin/catalog/practical-questions")).json() });

  const configs: CatalogConfig[] = [
    {
      slug: "service-categories", label: "Service-categorieën",
      fields: [
        { key: "name", label: "Naam", type: "text" },
        { key: "slug", label: "Slug (auto)", type: "text", optional: true },
        { key: "description", label: "Omschrijving", type: "text", optional: true },
        { key: "sortOrder", label: "Sorteervolgorde", type: "number", optional: true },
        { key: "isSystemDefined", label: "System-defined", type: "boolean", optional: true },
      ],
      display: ["name", "slug", "sortOrder", "isSystemDefined"],
    },
    {
      slug: "specializations", label: "Specialisaties",
      fields: [
        { key: "name", label: "Naam", type: "text" },
        { key: "slug", label: "Slug (auto)", type: "text", optional: true },
        { key: "description", label: "Omschrijving", type: "text", optional: true },
        { key: "serviceCategoryId", label: "Service-categorie", type: "select", options: () => (cats.data || []).map((c: any) => ({ value: c.id, label: c.name })), optional: true },
        { key: "sortOrder", label: "Sorteervolgorde", type: "number", optional: true },
        { key: "isSystemDefined", label: "System-defined", type: "boolean", optional: true },
      ],
      display: ["name", "slug", "sortOrder", "isSystemDefined"],
    },
    {
      slug: "offered-services", label: "Aangeboden diensten",
      fields: [
        { key: "name", label: "Naam", type: "text" },
        { key: "slug", label: "Slug (auto)", type: "text", optional: true },
        { key: "description", label: "Omschrijving", type: "text", optional: true },
        { key: "sortOrder", label: "Sorteervolgorde", type: "number", optional: true },
        { key: "isSystemDefined", label: "System-defined", type: "boolean", optional: true },
      ],
      display: ["name", "slug", "sortOrder", "isSystemDefined"],
    },
    {
      slug: "practical-questions", label: "Praktische vragen",
      fields: [
        { key: "key", label: "Key (uniek)", type: "text" },
        { key: "name", label: "Naam", type: "text" },
        { key: "fieldType", label: "Veldtype", type: "select", options: () => ["INT", "STRING", "DOUBLE", "DATE", "BOOLEAN", "OPTION"].map((v) => ({ value: v, label: v })) },
        { key: "isMulti", label: "Multi-waarde", type: "boolean", optional: true },
        { key: "isRequired", label: "Verplicht", type: "boolean", optional: true },
        { key: "sortOrder", label: "Sorteervolgorde", type: "number", optional: true },
      ],
      display: ["key", "name", "fieldType", "isRequired"],
    },
    {
      slug: "practical-options", label: "Vraag-opties",
      fields: [
        { key: "practicalQuestionId", label: "Vraag", type: "select", options: () => (questions.data || []).map((q: any) => ({ value: q.id, label: q.name })) },
        { key: "key", label: "Key", type: "text" },
        { key: "name", label: "Naam", type: "text" },
        { key: "sortOrder", label: "Sorteervolgorde", type: "number", optional: true },
      ],
      display: ["key", "name", "sortOrder"],
    },
  ];

  return (
    <AdminLayout title="Catalogi" description="Beheer service-categorieën, specialisaties, diensten en praktische vragen">
      <Tabs defaultValue={configs[0].slug}>
        <TabsList className="flex-wrap h-auto">
          {configs.map((c) => <TabsTrigger key={c.slug} value={c.slug} data-testid={`tab-${c.slug}`}>{c.label}</TabsTrigger>)}
        </TabsList>
        {configs.map((c) => <TabsContent key={c.slug} value={c.slug}><CatalogManager config={c} /></TabsContent>)}
      </Tabs>
    </AdminLayout>
  );
}

function CatalogManager({ config }: { config: CatalogConfig }) {
  const { toast } = useToast();
  const [editRow, setEditRow] = useState<any | null>(null);
  const [open, setOpen] = useState(false);

  const q = useQuery<any[]>({
    queryKey: [`/api/admin/catalog/${config.slug}`],
    queryFn: async () => (await authFetch(`/api/admin/catalog/${config.slug}`)).json(),
  });

  const saveM = useMutation({
    mutationFn: async (row: any) => {
      if (row.id) return apiRequest("PUT", `/api/admin/catalog/${config.slug}/${row.id}`, row);
      return apiRequest("POST", `/api/admin/catalog/${config.slug}`, row);
    },
    onSuccess: () => {
      toast({ title: "Opgeslagen" });
      queryClient.invalidateQueries({ queryKey: [`/api/admin/catalog/${config.slug}`] });
      setOpen(false); setEditRow(null);
    },
    onError: (e: any) => toast({ title: "Fout", description: e.message, variant: "destructive" }),
  });
  const delM = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/catalog/${config.slug}/${id}`),
    onSuccess: () => {
      toast({ title: "Verwijderd" });
      queryClient.invalidateQueries({ queryKey: [`/api/admin/catalog/${config.slug}`] });
    },
    onError: (e: any) => toast({ title: "Fout", description: e.message, variant: "destructive" }),
  });

  return (
    <Card className="mt-4">
      <CardContent className="p-4">
        <div className="flex justify-end mb-3">
          <Button size="sm" onClick={() => { setEditRow({}); setOpen(true); }} data-testid={`button-add-${config.slug}`}>
            <Plus className="h-4 w-4 mr-1" />Nieuw
          </Button>
        </div>
        {q.isLoading ? <div className="text-center py-8">Laden…</div> : (
          <Table>
            <TableHeader>
              <TableRow>{config.display.map((f) => <TableHead key={f}>{f}</TableHead>)}<TableHead></TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {(q.data || []).map((row: any) => (
                <TableRow key={row.id}>
                  {config.display.map((f) => <TableCell key={f}>{String(row[f] ?? "—")}</TableCell>)}
                  <TableCell className="space-x-1">
                    <Button size="sm" variant="ghost" onClick={() => { setEditRow(row); setOpen(true); }} data-testid={`button-edit-${row.id}`}><Pencil className="h-3 w-3" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => { if (confirm(`${row.name || row.key} verwijderen?`)) delM.mutate(row.id); }} data-testid={`button-delete-${row.id}`}><Trash2 className="h-3 w-3" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditRow(null); }}>
          <DialogContent>
            <DialogHeader><DialogTitle>{editRow?.id ? "Bewerken" : "Nieuw"} — {config.label}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              {config.fields.map((f) => (
                <div key={f.key}>
                  <label className="text-sm font-medium">{f.label}</label>
                  {f.type === "boolean" ? (
                    <div className="pt-2"><Switch checked={!!editRow?.[f.key]} onCheckedChange={(v) => setEditRow({ ...editRow, [f.key]: v })} /></div>
                  ) : f.type === "select" ? (
                    <Select value={editRow?.[f.key] || ""} onValueChange={(v) => setEditRow({ ...editRow, [f.key]: v })}>
                      <SelectTrigger><SelectValue placeholder="Kies…" /></SelectTrigger>
                      <SelectContent>{(f.options?.() || []).map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                    </Select>
                  ) : (
                    <Input
                      type={f.type === "number" ? "number" : "text"}
                      value={editRow?.[f.key] ?? ""}
                      onChange={(e) => setEditRow({ ...editRow, [f.key]: f.type === "number" ? (e.target.value === "" ? null : Number(e.target.value)) : e.target.value })}
                      data-testid={`input-${f.key}`}
                    />
                  )}
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Annuleren</Button>
              <Button onClick={() => saveM.mutate(editRow)} disabled={saveM.isPending} data-testid="button-save-catalog">Opslaan</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
