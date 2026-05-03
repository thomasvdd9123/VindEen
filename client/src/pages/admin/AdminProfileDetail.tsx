import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { apiRequest, queryClient, authFetch } from "@/lib/queryClient";
import { AdminLayout } from "./AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ExternalLink } from "lucide-react";

export default function AdminProfileDetail() {
  const [, params] = useRoute("/admin/profielen/:id");
  const id = params?.id || "";
  const { toast } = useToast();
  const [reason, setReason] = useState("");

  const q = useQuery<any>({
    queryKey: ["/api/admin/profiles", id],
    queryFn: async () => (await authFetch(`/api/admin/profiles/${id}`)).json(),
    enabled: !!id,
  });

  const verifyM = useMutation({
    mutationFn: (action: "APPROVE" | "REJECT" | "RESET") =>
      apiRequest("POST", `/api/admin/profiles/${id}/verify`, { action, reason: action === "RESET" ? null : reason }),
    onSuccess: (_d, action) => {
      toast({ title: "Status bijgewerkt", description: `Profiel werd ${action.toLowerCase()}.` });
      setReason("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/profiles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/profiles", id] });
    },
    onError: (e: any) => toast({ title: "Fout", description: e.message, variant: "destructive" }),
  });

  if (q.isLoading) return <AdminLayout title="Laden…">…</AdminLayout>;
  if (!q.data) return <AdminLayout title="Niet gevonden">Profiel niet gevonden.</AdminLayout>;

  const { profile, events, practitioner } = q.data;
  const status = profile.verificationStatus;

  return (
    <AdminLayout title={profile.companyName || "Profiel"} description={`Slug: ${profile.slug}`}>
      <div className="mb-4 flex items-center gap-2">
        <Link href="/admin/profielen"><Button variant="outline" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />Terug</Button></Link>
        <a href={`/bedrijf/${profile.slug}`} target="_blank" rel="noreferrer">
          <Button variant="ghost" size="sm"><ExternalLink className="h-4 w-4 mr-1" />Publieke pagina</Button>
        </a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Profielgegevens</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div><b>Status:</b> <Badge variant={status === "APPROVED" ? "default" : status === "REJECTED" ? "destructive" : "secondary"}>{status}</Badge></div>
            <div><b>Titel:</b> {profile.title || "—"}</div>
            <div><b>Email:</b> {profile.contactEmail || "—"}</div>
            <div><b>Telefoon:</b> {profile.telnr || "—"}</div>
            <div><b>Website:</b> {profile.websiteurl || "—"}</div>
            <div><b>Specialisaties:</b> {(profile.specializations || []).map((s: any) => s.name || s.slug).join(", ") || "—"}</div>
            <div><b>Service-zones:</b> {(profile.serviceAreas || []).map((s: any) => s.municipality || s.name).join(", ") || "—"}</div>
            <div><b>Introductie:</b><div className="mt-1 p-3 bg-muted rounded text-xs whitespace-pre-wrap">{profile.introduction || "—"}</div></div>
            {practitioner && (
              <div className="pt-3 border-t">
                <b>Eigenaar:</b> {practitioner.firstname} {practitioner.lastname} ({practitioner.email})
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Moderatie</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium">Reden (verplicht bij goedkeuren/afwijzen)</label>
                <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="bv. Profiel volledig en geverifieerd…" data-testid="input-reason" />
              </div>
              <div className="flex flex-col gap-2">
                <Button onClick={() => verifyM.mutate("APPROVE")} disabled={verifyM.isPending || !reason} data-testid="button-approve">Goedkeuren</Button>
                <Button onClick={() => verifyM.mutate("REJECT")} disabled={verifyM.isPending || !reason} variant="destructive" data-testid="button-reject">Afwijzen</Button>
                <Button onClick={() => verifyM.mutate("RESET")} disabled={verifyM.isPending} variant="outline" data-testid="button-reset">Reset naar PENDING</Button>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Audit trail</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {(events || []).length === 0 && <p className="text-sm text-muted-foreground">Nog geen events.</p>}
              {(events || []).map((e: any) => (
                <div key={e.id} className="text-xs border-l-2 border-primary pl-2">
                  <div className="font-medium">{e.fromStatus || "—"} → {e.toStatus}</div>
                  <div className="text-muted-foreground">{new Date(e.createdAt).toLocaleString("nl-BE")}</div>
                  {e.reason && <div className="mt-1">{e.reason}</div>}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
