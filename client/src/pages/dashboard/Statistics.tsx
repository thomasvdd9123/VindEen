import { useState } from "react";
import { DashboardLayout } from "./DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import type { Account } from "@shared/schema";

interface ProfileWithStats {
  id: string;
  name: string;
  logoUrl: string | null;
  isPublic: boolean;
  viewCount?: number;
}
import { 
  BarChart3,
  Eye,
  MousePointerClick,
  TrendingUp,
  Calendar,
  Loader2,
} from "lucide-react";

type TimeRange = "7d" | "30d" | "90d" | "all";

interface ProfileStats {
  profileId: string;
  profileName: string;
  views: number;
  contactRequests: number;
}

export default function DashboardStatistics() {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");

  const { data: account } = useQuery<Account>({
    queryKey: ["/api/accounts/by-user", user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error("No user");
      return apiRequest("POST", "/api/accounts", {
        authUserId: user.id,
        email: user.email,
      });
    },
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

  const { data: contactCounts = {}, isLoading: contactsLoading } = useQuery<Record<string, number>>({
    queryKey: ["/api/contact-requests/counts", account?.id],
    queryFn: async () => {
      if (!account?.id) return {};
      const requests = await apiRequest("GET", `/api/contact-requests/${account.id}`) as { profileId: string }[];
      const counts: Record<string, number> = {};
      requests.forEach((req) => {
        counts[req.profileId] = (counts[req.profileId] || 0) + 1;
      });
      return counts;
    },
    enabled: !!account?.id,
  });

  const isLoading = profilesLoading || contactsLoading;

  const totalViews = profiles.reduce((acc, p) => acc + (p.viewCount || 0), 0);
  const totalContacts = Object.values(contactCounts).reduce((acc, count) => acc + count, 0);

  const getTimeRangeLabel = (range: TimeRange) => {
    switch (range) {
      case "7d": return "Afgelopen 7 dagen";
      case "30d": return "Afgelopen 30 dagen";
      case "90d": return "Afgelopen 90 dagen";
      case "all": return "Alle tijd";
    }
  };

  return (
    <DashboardLayout 
      title="Statistieken" 
      description="Bekijk hoe je profielen presteren."
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
            <SelectTrigger className="w-[200px]" data-testid="select-time-range">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Afgelopen 7 dagen</SelectItem>
              <SelectItem value="30d">Afgelopen 30 dagen</SelectItem>
              <SelectItem value="90d">Afgelopen 90 dagen</SelectItem>
              <SelectItem value="all">Alle tijd</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <Card data-testid="card-total-views">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Profielweergaven</CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalViews}</div>
                  <p className="text-xs text-muted-foreground">
                    {getTimeRangeLabel(timeRange)}
                  </p>
                </CardContent>
              </Card>

              <Card data-testid="card-total-contacts">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Contactverzoeken</CardTitle>
                  <MousePointerClick className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalContacts}</div>
                  <p className="text-xs text-muted-foreground">
                    {getTimeRangeLabel(timeRange)}
                  </p>
                </CardContent>
              </Card>

              <Card data-testid="card-conversion-rate">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Conversieratio</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {totalViews > 0 ? ((totalContacts / totalViews) * 100).toFixed(1) : 0}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Contact per weergave
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card data-testid="card-profile-breakdown">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Statistieken per profiel
                </CardTitle>
                <CardDescription>
                  Bekijk de prestaties van elk profiel apart
                </CardDescription>
              </CardHeader>
              <CardContent>
                {profiles.length > 0 ? (
                  <div className="space-y-4">
                    {profiles.map((profile) => (
                      <div 
                        key={profile.id} 
                        className="flex items-center justify-between p-4 rounded-lg border"
                        data-testid={`profile-stats-${profile.id}`}
                      >
                        <div className="flex items-center gap-3">
                          {profile.logoUrl ? (
                            <img 
                              src={profile.logoUrl} 
                              alt={profile.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-primary font-semibold">
                                {profile.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div>
                            <p className="font-medium">{profile.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {profile.isPublic ? "Gepubliceerd" : "Niet gepubliceerd"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6 text-sm">
                          <div className="text-center">
                            <p className="font-semibold">{profile.viewCount || 0}</p>
                            <p className="text-muted-foreground">Weergaven</p>
                          </div>
                          <div className="text-center">
                            <p className="font-semibold">{contactCounts[profile.id] || 0}</p>
                            <p className="text-muted-foreground">Contacten</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Geen profielen gevonden</p>
                    <p className="text-sm">Maak eerst een profiel aan om statistieken te zien.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
