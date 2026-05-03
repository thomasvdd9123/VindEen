import { useQuery } from "@tanstack/react-query";
import { authFetch } from "@/lib/queryClient";
import { AdminLayout } from "./AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";

function useAdminQ<T>(key: string) {
  return useQuery<T>({
    queryKey: [key],
    queryFn: async () => (await authFetch(key)).json(),
  });
}

export default function AdminDashboard() {
  const profilesQ = useAdminQ<any[]>("/api/admin/profiles");
  const usersQ = useAdminQ<any[]>("/api/admin/users");
  const paymentsQ = useAdminQ<any[]>("/api/admin/payments");

  const profiles = profilesQ.data || [];
  const pending = profiles.filter((p) => p.verificationStatus === "PENDING").length;
  const approved = profiles.filter((p) => p.verificationStatus === "APPROVED").length;
  const rejected = profiles.filter((p) => p.verificationStatus === "REJECTED").length;

  const stats = [
    { label: "Profielen totaal", value: profiles.length, href: "/admin/profielen" },
    { label: "Wachtend op moderatie", value: pending, href: "/admin/profielen?status=PENDING", highlight: pending > 0 },
    { label: "Goedgekeurd", value: approved, href: "/admin/profielen?status=APPROVED" },
    { label: "Afgekeurd", value: rejected, href: "/admin/profielen?status=REJECTED" },
    { label: "Gebruikers", value: (usersQ.data || []).length, href: "/admin/gebruikers" },
    { label: "Betalingen (laatste 200)", value: (paymentsQ.data || []).length, href: "/admin/betalingen" },
  ];

  return (
    <AdminLayout title="Admin dashboard" description="Overzicht van platformactiviteit">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href}>
            <Card className={`hover-elevate cursor-pointer ${s.highlight ? "border-primary" : ""}`} data-testid={`stat-${s.label}`}>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">{s.label}</CardTitle></CardHeader>
              <CardContent><div className="text-3xl font-bold">{s.value}</div></CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </AdminLayout>
  );
}
