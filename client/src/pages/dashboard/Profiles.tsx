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
  Ban,
  RefreshCw,
} from "lucide-react";
import type { Profile, SubscriptionItem } from "@shared/schema";
import { OnboardingWizard } from "@/components/OnboardingWizard";

export default function DashboardProfiles() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [showAddWizard, setShowAddWizard] = useState(false);

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

  const handleWizardComplete = () => {
    setShowAddWizard(false);
    queryClient.invalidateQueries({ queryKey: ["/api/my-profiles"] });
  };

  return (
    <DashboardLayout
      title="Jouw profielen"
      description="Beheer je bedrijfsprofielen en maak nieuwe aan."
    >
      {/* Add-profile wizard (skips welcome + billing) */}
      {showAddWizard && accountId && (
        <OnboardingWizard
          accountId={accountId}
          initialStep={2}
          onComplete={handleWizardComplete}
        />
      )}

      <div className="space-y-4">
        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Empty state */}
        {!isLoading && profiles.length === 0 && (
          <Card
            className="border-2 border-dashed border-primary/30 bg-primary/5 hover:border-primary/50 hover:bg-primary/10 transition-colors cursor-pointer"
            data-testid="card-create-profile"
            onClick={() => accountId && setShowAddWizard(true)}
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

            {/* Add another profile */}
            <div className="pt-4">
              <Card
                className="border-2 border-dashed border-muted-foreground/25 hover:border-primary/40 hover:bg-muted/40 transition-colors cursor-pointer group"
                data-testid="button-add-profile"
                onClick={() => accountId && setShowAddWizard(true)}
              >
                <CardContent className="py-7 flex items-center justify-center gap-3 text-muted-foreground group-hover:text-foreground transition-colors">
                  <div className="flex items-center justify-center w-9 h-9 rounded-full border-2 border-dashed border-current">
                    <Plus className="h-4 w-4" />
                  </div>
                  <span className="font-medium">Nog een profiel toevoegen</span>
                </CardContent>
              </Card>
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
}> = {
  APPROVED: {
    label: "Goedgekeurd",
    icon: ShieldCheck,
    bar: "bg-emerald-500",
    pill: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  },
  PENDING: {
    label: "In behandeling",
    icon: Clock4,
    bar: "bg-amber-400",
    pill: "bg-amber-50 text-amber-700 border border-amber-200",
  },
  REJECTED: {
    label: "Afgewezen",
    icon: XCircle,
    bar: "bg-red-500",
    pill: "bg-red-50 text-red-700 border border-red-200",
  },
};

function ProfileCard({ profile, onDelete }: {
  profile: Profile;
  onDelete: (id: string, name: string) => void;
}) {
  const { toast } = useToast();
  const [cancelTarget, setCancelTarget] = useState(false);

  const { data: subscription, isLoading: isLoadingSubscription } = useQuery<SubscriptionItem | null>({
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

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const res = await authFetch(`/api/profiles/${profile.id}/cancel-subscription`, { method: "POST" });
      if (!res.ok) throw new Error("Annuleren mislukt");
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions/profile", profile.id] });
      const endDate = data.endDate
        ? new Date(data.endDate).toLocaleDateString("nl-BE", { day: "numeric", month: "long", year: "numeric" })
        : null;
      toast({
        title: "Lidmaatschap opgezegd",
        description: endDate
          ? `Uw profiel blijft actief tot ${endDate}.`
          : "Uw lidmaatschap wordt niet verlengd.",
      });
    },
    onError: () => {
      toast({ title: "Er ging iets mis", description: "Kon lidmaatschap niet opzeggen.", variant: "destructive" });
    },
  });

  const verifKey = (profile.verificationStatus || "PENDING") as VerifStatus;
  const verif = VERIF_CONFIG[verifKey] ?? VERIF_CONFIG.PENDING;
  const VerifIcon = verif.icon;

  const subStatus = subscription?.status;
  const hasActiveSub = subStatus === "ACTIVE";
  const isCancelled = subStatus === "CANCELLED";
  const isExpired = subStatus === "EXPIRED";
  const endDate = subscription?.endDate ? new Date(subscription.endDate) : null;
  const expiringSoon = endDate && hasActiveSub && endDate.getTime() - Date.now() < 30 * 24 * 60 * 60 * 1000;
  const needsPayment = !hasActiveSub && !isCancelled;

  const subPill = hasActiveSub
    ? expiringSoon
      ? { cls: "bg-orange-50 text-orange-700 border border-orange-200", icon: AlertTriangle, label: "Verloopt binnenkort" }
      : { cls: "bg-emerald-50 text-emerald-700 border border-emerald-200", icon: CheckCircle2, label: "Actief lidmaatschap" }
    : isCancelled
      ? { cls: "bg-slate-100 text-slate-600 border border-slate-200", icon: Ban, label: "Opgezegd" }
      : isExpired
        ? { cls: "bg-red-50 text-red-700 border border-red-200", icon: XCircle, label: "Verlopen" }
        : { cls: "bg-slate-100 text-slate-500 border border-slate-200", icon: CreditCard, label: "Geen lidmaatschap" };

  const SubIcon = subPill.icon;

  return (
    <>
      <Card className="overflow-hidden" data-testid={`card-profile-${profile.id}`}>
        <div className="flex">
          <div className={`w-1 shrink-0 ${verif.bar}`} />

          <CardContent className="flex-1 p-5">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Logo */}
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
                {/* Name + status pills */}
                <div className="flex items-start justify-between gap-3 mb-1">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-base leading-snug truncate">{profile.name}</h3>
                    {profile.title && (
                      <p className="text-sm text-muted-foreground truncate">{profile.title}</p>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${verif.pill}`}>
                      <VerifIcon className="h-3 w-3" />
                      {verif.label}
                    </span>
                    {isLoadingSubscription ? (
                      <span className="h-5 w-28 rounded-full bg-muted animate-pulse" />
                    ) : (
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${subPill.cls}`}
                        data-testid={`badge-subscription-${profile.id}`}
                      >
                        <SubIcon className="h-3 w-3" />
                        {subPill.label}
                      </span>
                    )}
                  </div>
                </div>

                {/* Subscription end date */}
                {endDate && (hasActiveSub || isCancelled) && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                    <Calendar className="h-3 w-3" />
                    {isCancelled ? "Blijft actief t/m" : "Geldig t/m"}{" "}
                    {endDate.toLocaleDateString("nl-BE", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                )}

                {/* Introduction */}
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1 mb-4">
                  {profile.introduction || <span className="italic">Geen introductie ingesteld</span>}
                </p>

                {/* Action row */}
                <div className="flex flex-wrap items-center gap-2">
                  {!isLoadingSubscription && (
                    <>
                      {needsPayment && (
                        <Link href={`/dashboard/profielen/${profile.id}/betalen`}>
                          <Button size="sm" className="gap-1.5 h-8" data-testid={`button-pay-${profile.id}`}>
                            <CreditCard className="h-3.5 w-3.5" />
                            {isExpired ? "Opnieuw activeren" : "Activeren"}
                          </Button>
                        </Link>
                      )}

                      {isCancelled && (
                        <Link href={`/dashboard/profielen/${profile.id}/betalen`}>
                          <Button size="sm" variant="outline" className="gap-1.5 h-8" data-testid={`button-renew-${profile.id}`}>
                            <RefreshCw className="h-3.5 w-3.5" />
                            Heractiveren
                          </Button>
                        </Link>
                      )}

                      {hasActiveSub && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 h-8 text-slate-600 border-slate-300 hover:text-destructive hover:border-destructive/50"
                          onClick={() => setCancelTarget(true)}
                          disabled={cancelMutation.isPending}
                          data-testid={`button-cancel-subscription-${profile.id}`}
                        >
                          <Ban className="h-3.5 w-3.5" />
                          Stop lidmaatschap
                        </Button>
                      )}
                    </>
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

            {!isLoadingSubscription && needsPayment && (
              <div className="mt-4 -mx-5 -mb-5 px-5 py-3 bg-amber-50 border-t border-amber-100 flex items-center gap-2 text-amber-700 text-xs">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                <span>
                  {isExpired
                    ? "Uw lidmaatschap is verlopen — activeer opnieuw om zichtbaar te worden voor klanten."
                    : "Dit profiel is nog niet actief — activeer een lidmaatschap om zichtbaar te worden voor klanten."}
                </span>
              </div>
            )}
            {!isLoadingSubscription && isCancelled && endDate && (
              <div className="mt-4 -mx-5 -mb-5 px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center gap-2 text-slate-600 text-xs">
                <Ban className="h-3.5 w-3.5 shrink-0" />
                <span>
                  Lidmaatschap opgezegd. Uw profiel blijft zichtbaar tot{" "}
                  {endDate.toLocaleDateString("nl-BE", { day: "numeric", month: "long", year: "numeric" })}.
                </span>
              </div>
            )}
          </CardContent>
        </div>
      </Card>

      <AlertDialog open={cancelTarget} onOpenChange={(o) => !o && setCancelTarget(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Lidmaatschap opzeggen?</AlertDialogTitle>
            <AlertDialogDescription>
              {endDate
                ? `Uw profiel blijft zichtbaar tot ${endDate.toLocaleDateString("nl-BE", { day: "numeric", month: "long", year: "numeric" })}. Daarna wordt het automatisch offline gehaald.`
                : "Uw lidmaatschap wordt niet automatisch verlengd. Uw profiel wordt na de verloopdatum offline gehaald."}
              <br /><br />
              U kunt uw lidmaatschap op elk moment opnieuw activeren.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-sub-dismiss">Annuleren</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={cancelMutation.isPending}
              onClick={() => {
                cancelMutation.mutate();
                setCancelTarget(false);
              }}
              data-testid="button-cancel-sub-confirm"
            >
              {cancelMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Opzeggen bevestigen"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
