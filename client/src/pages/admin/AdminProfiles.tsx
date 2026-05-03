import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { authFetch } from "@/lib/queryClient";
import { AdminLayout } from "./AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "In behandeling",
  APPROVED: "Goedgekeurd",
  REJECTED: "Afgekeurd",
};

function statusBadge(s: string) {
  const variant = s === "APPROVED" ? "default" : s === "REJECTED" ? "destructive" : "secondary";
  return <Badge variant={variant as any}>{STATUS_LABEL[s] || s}</Badge>;
}

export default function AdminProfiles() {
  const [location] = useLocation();
  const initialStatus = new URLSearchParams(location.split("?")[1] || "").get("status") || "ALL";
  const [status, setStatus] = useState<string>(initialStatus);

  const q = useQuery<any[]>({
    queryKey: ["/api/admin/profiles", status],
    queryFn: async () => {
      const url = status === "ALL" ? "/api/admin/profiles" : `/api/admin/profiles?status=${status}`;
      return (await authFetch(url)).json();
    },
  });

  return (
    <AdminLayout title="Profielen" description="Modereer en beheer alle profielen">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-sm text-muted-foreground">Filter:</span>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-56" data-testid="select-profile-status"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Alles</SelectItem>
            <SelectItem value="PENDING">In behandeling</SelectItem>
            <SelectItem value="APPROVED">Goedgekeurd</SelectItem>
            <SelectItem value="REJECTED">Afgekeurd</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Card>
        <CardContent className="p-0">
          {q.isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Laden…</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bedrijf</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Publiek</TableHead>
                  <TableHead>Aangemaakt</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(q.data || []).map((p: any) => (
                  <TableRow key={p.id} data-testid={`row-profile-${p.id}`}>
                    <TableCell className="font-medium">{p.companyName || "(geen naam)"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{p.slug}</TableCell>
                    <TableCell>{statusBadge(p.verificationStatus)}</TableCell>
                    <TableCell>{p.isPublic ? <Badge>Live</Badge> : <Badge variant="outline">Verborgen</Badge>}</TableCell>
                    <TableCell className="text-xs">{new Date(p.createdAt).toLocaleDateString("nl-BE")}</TableCell>
                    <TableCell>
                      <Link href={`/admin/profielen/${p.id}`}>
                        <Button size="sm" variant="outline" data-testid={`button-view-${p.id}`}>Bekijken</Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
                {!q.data?.length && (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Geen profielen</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
