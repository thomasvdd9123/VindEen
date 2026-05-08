import { useState } from "react";
import { Link } from "wouter";
import { DashboardLayout } from "./DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  User, 
  UserCircle, 
  MessageSquare, 
  BarChart3, 
  ArrowRight,
  PlusCircle,
  Eye,
  Mail,
  Loader2,
  PartyPopper,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Account } from "@shared/schema";
import { OnboardingWizard } from "@/components/OnboardingWizard";

interface ProfileWithStats {
  id: string;
  isPublic: boolean;
  viewCount?: number;
}

interface ClaimedProfile { id: string; companyName: string | null; slug: string; }

export default function Dashboard() {
  const { user } = useAuth();
  const [wizardDismissed, setWizardDismissed] = useState(false);
  const [claimBannerDismissed, setClaimBannerDismissed] = useState(false);

  // Auto-claimed profiles stored by DashboardLayout after first signup
  const autoClaimedProfiles: ClaimedProfile[] = (() => {
    if (!user?.id) return [];
    try {
      const raw = localStorage.getItem(`auto_claimed_${user.id}`);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  })();

  const { data: account, isLoading: accountLoading } = useQuery<Account>({
    queryKey: ["/api/accounts/by-auth", user?.id],
    enabled: !!user?.id,
  });

  const { data: profiles = [], isLoading: profilesLoading } = useQuery<ProfileWithStats[]>({
    queryKey: ["/api/my-profiles", account?.id],
    queryFn: async () => {
      if (!account?.id) return [];
      return apiRequest("GET", `/api/my-profiles/${account.id}`);
    },
    enabled: !!account?.id,
  });

  const { data: contacts = [], isLoading: contactsLoading } = useQuery<{ id: string }[]>({
    queryKey: ["/api/contact-requests", account?.id],
    queryFn: async () => {
      if (!account?.id) return [];
      return apiRequest("GET", `/api/contact-requests/${account.id}`);
    },
    enabled: !!account?.id,
  });

  const isLoading = accountLoading || profilesLoading || contactsLoading;

  const onboardingDone = !!user?.id && !!localStorage.getItem(`onboarding_done_${user.id}`);
  const showWizard =
    !isLoading &&
    !!account?.id &&
    profiles.length === 0 &&
    !onboardingDone &&
    !wizardDismissed;
  const totalViews = profiles.reduce((acc, p) => acc + (p.viewCount || 0), 0);
  const activeProfiles = profiles.filter(p => p.isPublic).length;
  const totalContacts = contacts.length;

  const quickLinks = [
    {
      title: "Account & facturatie",
      description: "Beheer je persoonlijke gegevens en facturatiedetails",
      href: "/dashboard/account",
      icon: User,
    },
    {
      title: "Jouw praktijkprofielen",
      description: "Bekijk en bewerk je bedrijfsprofielen",
      href: "/dashboard/profielen",
      icon: UserCircle,
    },
    {
      title: "Contactverzoeken",
      description: "Bekijk berichten van potentiële klanten",
      href: "/dashboard/contacten",
      icon: MessageSquare,
    },
    {
      title: "Statistieken",
      description: "Bekijk bezoekersstatistieken van je profielen",
      href: "/dashboard/statistieken",
      icon: BarChart3,
    },
  ];

  const stats = [
    { label: "Profielweergaven", value: isLoading ? "-" : totalViews.toString(), icon: Eye },
    { label: "Contactverzoeken", value: isLoading ? "-" : totalContacts.toString(), icon: Mail },
    { label: "Actieve profielen", value: isLoading ? "-" : activeProfiles.toString(), icon: UserCircle },
  ];

  return (
    <DashboardLayout 
      title="Dashboard" 
      description={`Welkom terug${user?.email ? `, ${user.email.split("@")[0]}` : ""}!`}
    >
      {/* Onboarding wizard — auto-opens for new users with no profiles */}
      {showWizard && account?.id && (
        <OnboardingWizard
          accountId={account.id}
          onComplete={() => setWizardDismissed(true)}
        />
      )}

      {/* Auto-claim banner — shown once after signup when profiles were auto-claimed by email match */}
      {autoClaimedProfiles.length > 0 && !claimBannerDismissed && (
        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 relative" data-testid="banner-auto-claimed">
          <button
            className="absolute top-3 right-3 text-emerald-700 hover:text-emerald-900"
            onClick={() => {
              setClaimBannerDismissed(true);
              if (user?.id) localStorage.removeItem(`auto_claimed_${user.id}`);
            }}
            aria-label="Sluiten"
            data-testid="btn-dismiss-claim-banner"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-start gap-3 pr-6">
            <PartyPopper className="h-6 w-6 text-emerald-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-emerald-800 mb-1">
                {autoClaimedProfiles.length === 1
                  ? "We vonden uw bedrijfsprofiel!"
                  : `We vonden ${autoClaimedProfiles.length} bedrijfsprofielen!`}
              </p>
              <p className="text-sm text-emerald-700 mb-3">
                {autoClaimedProfiles.length === 1
                  ? `Het profiel van ${autoClaimedProfiles[0].companyName || "uw bedrijf"} is automatisch aan uw account gekoppeld. U kunt het nu bewerken en activeren.`
                  : "De volgende profielen zijn automatisch aan uw account gekoppeld. U kunt ze nu bewerken en activeren."}
              </p>
              <div className="flex flex-wrap gap-2">
                {autoClaimedProfiles.map(p => (
                  <Link key={p.id} href={`/dashboard/profielen`}>
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-100 border border-emerald-300 text-emerald-800 text-sm font-medium px-3 py-1.5 hover:bg-emerald-200 transition-colors cursor-pointer" data-testid={`link-claimed-profile-${p.id}`}>
                      {p.companyName || p.slug}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Create profile CTA - only show if no profiles, data is loaded, and wizard was dismissed */}
      {profiles.length === 0 && !isLoading && (onboardingDone || wizardDismissed) && (
        <Card className="mb-8 border-primary/20 bg-primary/5">
          <CardContent className="py-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-lg mb-1">Maak uw eerste profiel aan</h3>
                <p className="text-muted-foreground">
                  Word zichtbaar voor potentiële klanten door een bedrijfsprofiel aan te maken.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  className="gap-2"
                  onClick={() => setWizardDismissed(false)}
                  data-testid="button-reopen-wizard"
                >
                  <PlusCircle className="h-4 w-4" />
                  Profiel aanmaken
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick links grid */}
      <h2 className="text-lg font-semibold mb-4">Snelle navigatie</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {quickLinks.map((link, index) => {
          const Icon = link.icon;
          return (
            <Link key={index} href={link.href}>
              <Card className="hover-elevate cursor-pointer h-full" data-testid={`card-${link.href.split('/').pop()}`}>
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary/10 shrink-0">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium mb-1 flex items-center gap-2">
                        {link.title}
                        <ArrowRight className="h-4 w-4 text-primary" />
                      </h3>
                      <p className="text-sm text-muted-foreground">{link.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </DashboardLayout>
  );
}
