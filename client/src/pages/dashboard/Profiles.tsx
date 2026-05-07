import { useState } from "react";
import { Link } from "wouter";
import { DashboardLayout } from "./DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient, authFetch } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Eye,
  Edit,
  Trash2,
  CheckCircle2,
  Clock4,
  XCircle,
  Leaf,
  Loader2,
  CreditCard,
  Calendar,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";
import type { Profile, SubscriptionItem } from "@shared/schema";

export default function DashboardProfiles() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const { data: account, isLoading: isLoadingAccount } = useQuery<{ id: string }>({
    queryKey: ["/api/accounts/by-auth", user?.id],
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  });

  const accountId = account?.id || null;

  const { data: profiles = [], isLoading: isLoadingProfiles } = useQuery<Profile[]>({
    queryKey: ["/api/my-profiles", accountId],
    enabled: !!accountId,
    staleTime: 1000 * 60 * 5,
  });

  const isLoading = isLoadingAccount || isLoadingProfiles;

  const deleteMutation = useMutation({
    mutationFn: async (profileId: string) => {
      return apiRequest("DELETE", `/api/profiles/${profileId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/contact-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/contact-requests/counts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/profiles/featured"] });
      toast({ title: "Profiel verwijderd", description: "Je profiel is succesvol verwijderd." });
    },
    onError: () => {
      toast({ title: "Er ging iets mis", description: "Kon profiel niet verwijderen.", variant: "destructive" });
    },
  });

  return (
    <DashboardLayout
      title="Jouw profielen"
      description="Beheer je bedrijfsprofielen en maak nieuwe aan."
    >
      <div className="space-y-4">
        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Empty state */}
        {!isLoading && profiles.length === 0 && (
          <Link href="/dashboard/profielen/nieuw">
            <Card
              className="border-2 border-dashed border-primary/30 bg-primary/5 hover:border-primary/50 hover:bg-primary/10 transition-colors cursor-pointer"
              data-testid="card-create-profile"
            >
              <CardContent className="py-14 text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-4">
                  <Leaf className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-1">Maak je eerste profiel aan</h3>
                <p className="text-sm text-muted-foreground mb-5 max-w-sm mx-auto">
                  Word zichtbaar voor potentiële klanten door een bedrijfsprofiel aan te maken.
                </p>
                <Button className="gap-2" data-testid="button-new-profile">
                  <Plus className="h-4 w-4" />
                  Profiel aanmaken
                </Button>
              </CardContent>
            </Card>
          </Link>
        )}

        {/* Profile list */}
        {!isLoading && profiles.length > 0 && (
          <>
            {profiles.map((profile: Profile) => (
              <ProfileCard
                key={profile.id}
                profile={profile}
                onDelete={(id, name) => setDeleteTarget({ id, name })}
              />
            ))}

            {/* Add another profile — more spacious, prominent */}
            <div className="pt-4">
              <Link href="/dashboard/profielen/nieuw">
                <Card
                  className="border-2 border-dashed border-muted-foreground/25 hover:border-primary/40 hover:bg-muted/40 transition-colors cursor-pointer group"
                  data-testid="button-add-profile"
                >
                  <CardContent className="py-7 flex items-center justify-center gap-3 text-muted-foreground group-hover:text-foreground transition-colors">
                    <div className="flex items-center justify-center w-9 h-9 rounded-full border-2 border-dashed border-current">
                      <Plus className="h-4 w-4" />
                    </div>
                    <span className="font-medium">Nog een profiel toevoegen</span>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </>
        )}
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Profiel verwijderen?</AlertDialogTitle>
            <AlertDialogDescription>
              Weet je zeker dat je &quot;{deleteTarget?.name}&quot; wilt verwijderen? Deze actie kan niet ongedaan gemaakt worden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-delete-profile-cancel">Annuleren</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (deleteMutation.isPending || !deleteTarget) return;
                deleteMutation.mutate(deleteTarget.id);
                setDeleteTarget(null);
              }}
              data-testid="button-delete-profile-confirm"
            >
              Verwijderen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}

// ─── Profile Card ─────────────────────────────────────────────────────────────

type VerifStatus = "APPROVED" | "PENDING" | "REJECTED";

const VERIF_CONFIG: Record<VerifStatus, {
  label: string;
  icon: any;
  bar: string;
  pill: string;
  pillText: string;
}> = {
  APPROVED: {
    label: "Goedgekeurd",
    icon: ShieldCheck,
    bar: "bg-emerald-500",
    pill: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    pillText: "text-emerald-700",
  },
  PENDING: {
    label: "In behandeling",
    icon: Clock4,
    bar: "bg-amber-400",
    pill: "bg-amber-50 text-amber-700 border border-amber-200",
    pillText: "text-amber-700",
  },
  REJECTED: {
    label: "Afgewezen",
    icon: XCircle,
    bar: "bg-red-500",
    pill: "bg-red-50 text-red-700 border border-red-200",
    pillText: "text-red-700",
  },
};

function ProfileCard({ profile, onDelete }: {
  profile: Profile;
  onDelete: (id: string, name: string) => void;
}) {
  const { data: subscription } = useQuery<SubscriptionItem | null>({
    queryKey: ["/api/subscriptions/profile", profile.id],
    queryFn: async () => {
      const res = await authFetch(`/api/subscriptions/profile/${profile.id}`);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch subscription");
      return res.json();
    },
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  const verifKey = (profile.verificationStatus || "PENDING") as VerifStatus;
  const verif = VERIF_CONFIG[verifKey] ?? VERIF_CONFIG.PENDING;
  const VerifIcon = verif.icon;

  const hasActiveSub = subscription?.status === "ACTIVE";
  const endDate = subscription?.endDate ? new Date(subscription.endDate) : null;
  const expiringSoon = endDate && endDate.getTime() - Date.now() < 30 * 24 * 60 * 60 * 1000;

  return (
    <Card className="overflow-hidden" data-testid={`card-profile-${profile.id}`}>
      {/* Coloured status bar along the left */}
      <div className="flex">
        <div className={`w-1 shrink-0 ${verif.bar}`} />

        <CardContent className="flex-1 p-5">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Logo / avatar */}
            <div className="w-16 h-16 rounded-lg bg-muted shrink-0 overflow-hidden">
              {profile.logoUrl ? (
                <img src={profile.logoUrl} alt={profile.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                  <Leaf className="h-6 w-6 text-primary/40" />
                </div>
              )}
            </div>

            {/* Main info */}
            <div className="flex-1 min-w-0">
              {/* Name row + status pills */}
              <div className="flex items-start justify-between gap-3 mb-1">
                <div className="min-w-0">
                  <h3 className="font-semibold text-base leading-snug truncate">{profile.name}</h3>
                  {profile.title && (
                    <p className="text-sm text-muted-foreground truncate">{profile.title}</p>
                  )}
                </div>

                {/* Status pills — clean, not badge */}
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${verif.pill}`}>
                    <VerifIcon className="h-3 w-3" />
                    {verif.label}
                  </span>

                  {hasActiveSub ? (
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${expiringSoon ? "bg-orange-50 text-orange-700 border border-orange-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}
                      data-testid={`badge-subscription-${profile.id}`}
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      {expiringSoon ? "Verloopt binnenkort" : "Betaald"}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200"
                      data-testid={`badge-subscription-${profile.id}`}
                    >
                      <CreditCard className="h-3 w-3" />
                      Geen abonnement
                    </span>
                  )}
                </div>
              </div>

              {/* Subscription end date */}
              {hasActiveSub && endDate && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                  <Calendar className="h-3 w-3" />
                  Geldig t/m {endDate.toLocaleDateString("nl-BE", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              )}

              {/* Introduction */}
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1 mb-4">
                {profile.introduction || <span className="italic">Geen introductie ingesteld</span>}
              </p>

              {/* Action row */}
              <div className="flex flex-wrap items-center gap-2">
                {!hasActiveSub && (
                  <Link href={`/dashboard/profielen/${profile.id}/betalen`}>
                    <Button size="sm" className="gap-1.5 h-8" data-testid={`button-pay-${profile.id}`}>
                      <CreditCard className="h-3.5 w-3.5" />
                      Activeren
                    </Button>
                  </Link>
                )}
                <Link href={`/dashboard/profielen/${profile.id}/bewerken`}>
                  <Button variant="outline" size="sm" className="gap-1.5 h-8" data-testid={`button-edit-${profile.id}`}>
                    <Edit className="h-3.5 w-3.5" />
                    Bewerken
                  </Button>
                </Link>
                <Link href={
                  profile.isActive && profile.isPublic && profile.verificationStatus === "APPROVED"
                    ? `/bedrijf/${profile.slug}`
                    : `/bedrijf/${profile.slug}?preview=${profile.id}`
                }>
                  <Button variant="outline" size="sm" className="gap-1.5 h-8" data-testid={`button-view-${profile.id}`}>
                    <Eye className="h-3.5 w-3.5" />
                    Bekijken
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 h-8 text-destructive/70 hover:text-destructive ml-auto"
                  onClick={() => onDelete(profile.id, profile.name)}
                  data-testid={`button-delete-${profile.id}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Verwijderen
                </Button>
              </div>
            </div>
          </div>

          {/* Warning strip — only when no subscription */}
          {!hasActiveSub && (
            <div className="mt-4 -mx-5 -mb-5 px-5 py-3 bg-amber-50 border-t border-amber-100 flex items-center gap-2 text-amber-700 text-xs">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              <span>Dit profiel is nog niet actief — activeer een abonnement om zichtbaar te worden voor klanten.</span>
            </div>
          )}
        </CardContent>
      </div>
    </Card>
  );
}
