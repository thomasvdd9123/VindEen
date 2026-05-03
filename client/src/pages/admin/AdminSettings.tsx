import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient, authFetch } from "@/lib/queryClient";
import { AdminLayout } from "./AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Save } from "lucide-react";

const SECTIONS = [
  {
    title: "Branding",
    fields: [
      { k: "siteName", l: "Site-naam" },
      { k: "siteTagline", l: "Tagline" },
      { k: "supportEmail", l: "Support-email" },
      { k: "companyLegalName", l: "Wettelijke bedrijfsnaam" },
      { k: "companyVatNumber", l: "BTW-nummer (intern)" },
    ],
  },
  {
    title: "Locale defaults",
    fields: [
      { k: "defaultCountryCode", l: "Landcode (bv. BE)" },
      { k: "defaultCountryName", l: "Landnaam" },
      { k: "defaultRegion", l: "Regio" },
      { k: "defaultLanguage", l: "Taal (bv. nl-BE)" },
      { k: "defaultCurrencyCode", l: "Munteenheid (bv. EUR)" },
      { k: "defaultVatPercentage", l: "Standaard BTW %", type: "number" },
    ],
  },
  {
    title: "Format-patterns",
    fields: [
      { k: "postcodePattern", l: "Postcode-regex (bv. ^[0-9]{4}$)" },
      { k: "phonePattern", l: "Telefoon-regex" },
      { k: "phoneCountryCode", l: "Telefoon-landcode (bv. +32)" },
    ],
  },
];

export default function AdminSettings() {
  const { toast } = useToast();
  const cfgQ = useQuery<any>({ queryKey: ["/api/admin/site-config"], queryFn: async () => (await authFetch("/api/admin/site-config")).json() });
  const plansQ = useQuery<any[]>({ queryKey: ["/api/admin/catalog/subscription-plans"], queryFn: async () => (await authFetch("/api/admin/catalog/subscription-plans")).json() });
  const countriesQ = useQuery<any[]>({ queryKey: ["/api/admin/catalog/countries"], queryFn: async () => (await authFetch("/api/admin/catalog/countries")).json() });
  const practitionerTypesQ = useQuery<any[]>({ queryKey: ["/api/admin/catalog/practitioner-types"], queryFn: async () => (await authFetch("/api/admin/catalog/practitioner-types")).json() });
  const [form, setForm] = useState<any>(null);

  const [themeCopyJson, setThemeCopyJson] = useState<string>("");
  const [themeCopyError, setThemeCopyError] = useState<string | null>(null);
  useEffect(() => {
    if (cfgQ.data && !form) {
      setForm(cfgQ.data);
      setThemeCopyJson(JSON.stringify(cfgQ.data.themeCopy ?? {}, null, 2));
    }
  }, [cfgQ.data]);

  const save = useMutation({
    mutationFn: (payload: any) => apiRequest("PUT", "/api/admin/site-config", payload),
    onSuccess: () => {
      toast({ title: "Project defaults opgeslagen", description: "De site herlaadt de configuratie automatisch." });
      queryClient.invalidateQueries({ queryKey: ["/api/site-config"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/site-config"] });
    },
    onError: (e: any) => toast({ title: "Fout", description: e.message, variant: "destructive" }),
  });

  if (!form) return <AdminLayout title="Project defaults">Laden…</AdminLayout>;

  return (
    <AdminLayout title="Project defaults" description="Centrale site-configuratie en rebrand-control-panel">
      <div className="space-y-6">
        {SECTIONS.map((sec) => (
          <Card key={sec.title}>
            <CardHeader><CardTitle>{sec.title}</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sec.fields.map((f) => (
                <div key={f.k}>
                  <label className="text-sm font-medium">{f.l}</label>
                  <Input
                    type={(f as any).type === "number" ? "number" : "text"}
                    value={form[f.k] ?? ""}
                    onChange={(e) => setForm({ ...form, [f.k]: (f as any).type === "number" ? (e.target.value === "" ? null : Number(e.target.value)) : e.target.value })}
                    data-testid={`input-${f.k}`}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}

        <Card>
          <CardHeader>
            <CardTitle>Defaults voor nieuwe gebruikers</CardTitle>
            <CardDescription>FK-velden die de UX van nieuwe registraties bepalen.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Standaard abonnementsplan</label>
              <Select value={form.defaultSubscriptionPlanId || ""} onValueChange={(v) => setForm({ ...form, defaultSubscriptionPlanId: v })}>
                <SelectTrigger data-testid="select-default-plan"><SelectValue placeholder="Kies plan…" /></SelectTrigger>
                <SelectContent>{(plansQ.data || []).map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Standaard practitioner-type</label>
              <Select value={form.defaultPractitionerTypeId || ""} onValueChange={(v) => setForm({ ...form, defaultPractitionerTypeId: v })}>
                <SelectTrigger data-testid="select-default-practitioner-type"><SelectValue placeholder="Kies type…" /></SelectTrigger>
                <SelectContent>{(practitionerTypesQ.data || []).map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Standaard land</label>
              <Select value={form.defaultCountryId || ""} onValueChange={(v) => setForm({ ...form, defaultCountryId: v })}>
                <SelectTrigger data-testid="select-default-country"><SelectValue placeholder="Kies land…" /></SelectTrigger>
                <SelectContent>{(countriesQ.data || []).map((c) => <SelectItem key={c.id} value={c.id}>{c.name} ({c.code})</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vertical-copy (theme override)</CardTitle>
            <CardDescription>
              JSON-overrides voor vertical-specifieke labels (businessType, businessTypePlural, ...) en vrije copy. Deze waarden worden via <code>useThemeCopy()</code> over <code>theme.config.ts</code> heen gemerget — zo kun je rebranden zonder code-deploy.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Textarea
              value={themeCopyJson}
              onChange={(e) => {
                setThemeCopyJson(e.target.value);
                try {
                  const parsed = e.target.value.trim() === "" ? null : JSON.parse(e.target.value);
                  setThemeCopyError(null);
                  setForm({ ...form, themeCopy: parsed });
                } catch (err: any) {
                  setThemeCopyError(`Ongeldig JSON: ${err.message}`);
                }
              }}
              rows={10}
              className="font-mono text-xs"
              data-testid="textarea-theme-copy"
            />
            {themeCopyError && <p className="text-sm text-destructive">{themeCopyError}</p>}
            <p className="text-xs text-muted-foreground">
              Voorbeeld: <code>{`{"businessType":"kapper","businessTypePlural":"kappers"}`}</code>
            </p>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={() => save.mutate(form)} disabled={save.isPending || !!themeCopyError} data-testid="button-save-settings">
            <Save className="h-4 w-4 mr-2" />Opslaan
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}
