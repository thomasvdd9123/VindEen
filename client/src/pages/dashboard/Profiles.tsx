import { useState, useEffect } from "react";
import { Link } from "wouter";
import { DashboardLayout } from "./DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { 
  PlusCircle, 
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  XCircle,
  Leaf,
  Loader2,
} from "lucide-react";
import type { Profile } from "@shared/schema";

export default function DashboardProfiles() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [accountId, setAccountId] = useState<string | null>(null);
  const [isLoadingAccount, setIsLoadingAccount] = useState(true);

  useEffect(() => {
    if (user?.id) {
      setIsLoadingAccount(true);
      apiRequest("POST", "/api/accounts", {
        authUserId: user.id,
        email: user.email,
      }).then((response) => {
        setAccountId((response as { id: string }).id);
      }).catch(console.error)
      .finally(() => setIsLoadingAccount(false));
    } else {
      setIsLoadingAccount(false);
    }
  }, [user?.id, user?.email]);

  const { data: profiles = [], isLoading: isLoadingProfiles } = useQuery<Profile[]>({
    queryKey: ["/api/my-profiles", accountId],
    enabled: !!accountId,
  });

  const isLoading = isLoadingAccount || isLoadingProfiles;

  const deleteMutation = useMutation({
    mutationFn: async (profileId: string) => {
      return apiRequest("DELETE", `/api/profiles/${profileId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-profiles"] });
      toast({
        title: "Profiel verwijderd",
        description: "Je profiel is succesvol verwijderd.",
      });
    },
    onError: () => {
      toast({
        title: "Er ging iets mis",
        description: "Kon profiel niet verwijderen.",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (profileId: string, profileName: string) => {
    if (confirm(`Weet je zeker dat je "${profileName}" wilt verwijderen?`)) {
      deleteMutation.mutate(profileId);
    }
  };

  return (
    <DashboardLayout 
      title="Jouw praktijkprofielen" 
      description="Beheer je bedrijfsprofielen en maak nieuwe aan."
    >
      <div className="space-y-6">
        {/* Create new profile CTA */}
        <Card className="border-dashed border-2 hover-elevate cursor-pointer bg-muted/30" data-testid="card-create-profile">
          <CardContent className="py-8 text-center">
            <PlusCircle className="h-12 w-12 text-primary/40 mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">Nieuw profiel aanmaken</h3>
            <p className="text-muted-foreground mb-4 max-w-md mx-auto">
              Maak een nieuw bedrijfsprofiel aan om zichtbaar te worden voor potentiële klanten.
            </p>
            <Link href="/dashboard/profielen/nieuw">
              <Button className="gap-2" data-testid="button-new-profile">
                <PlusCircle className="h-4 w-4" />
                Start nieuw profiel
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Existing profiles */}
        {!isLoading && profiles.length > 0 ? (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Je profielen</h2>
            {profiles.map((profile: Profile) => (
              <ProfileCard key={profile.id} profile={profile} onDelete={handleDelete} />
            ))}
          </div>
        ) : !isLoading && (
          <Card>
            <CardContent className="py-12 text-center">
              <Leaf className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">Nog geen profielen</h3>
              <p className="text-muted-foreground mb-4">
                Je hebt nog geen bedrijfsprofielen aangemaakt. Maak je eerste profiel aan om zichtbaar te worden.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

function ProfileCard({ profile, onDelete }: { profile: Profile; onDelete: (id: string, name: string) => void }) {
  const statusConfig: Record<string, { label: string; icon: any; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    APPROVED: { label: "Goedgekeurd", icon: CheckCircle, variant: "default" },
    PENDING: { label: "In behandeling", icon: Clock, variant: "secondary" },
    REJECTED: { label: "Afgewezen", icon: XCircle, variant: "destructive" },
  };

  const status = statusConfig[profile.verificationStatus || "PENDING"] || statusConfig.PENDING;
  const StatusIcon = status.icon;

  return (
    <Card data-testid={`card-profile-${profile.id}`}>
      <CardContent className="p-5">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="w-20 h-20 rounded-md bg-muted shrink-0 overflow-hidden">
            {profile.logoUrl ? (
              <img src={profile.logoUrl} alt={profile.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                <Leaf className="h-8 w-8 text-primary/40" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <h3 className="font-semibold text-lg">{profile.name}</h3>
                {profile.title && (
                  <p className="text-sm text-muted-foreground">{profile.title}</p>
                )}
              </div>
              <Badge variant={status.variant} className="gap-1 shrink-0">
                <StatusIcon className="h-3 w-3" />
                {status.label}
              </Badge>
            </div>

            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
              {profile.introduction || "Geen introductie ingesteld"}
            </p>

            <div className="flex flex-wrap gap-2">
              <Link href={`/bedrijf/${profile.slug}`}>
                <Button variant="outline" size="sm" className="gap-1" data-testid={`button-view-${profile.id}`}>
                  <Eye className="h-3.5 w-3.5" />
                  Bekijken
                </Button>
              </Link>
              <Link href={`/dashboard/profielen/${profile.id}/bewerken`}>
                <Button variant="outline" size="sm" className="gap-1" data-testid={`button-edit-${profile.id}`}>
                  <Edit className="h-3.5 w-3.5" />
                  Bewerken
                </Button>
              </Link>
              <Button 
                variant="ghost" 
                size="sm" 
                className="gap-1 text-destructive hover:text-destructive"
                onClick={() => onDelete(profile.id, profile.name)}
                data-testid={`button-delete-${profile.id}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Verwijderen
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
