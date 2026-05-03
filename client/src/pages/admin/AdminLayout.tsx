import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { authFetch, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarProvider, SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  ShieldCheck, LayoutDashboard, FileCheck, Users, Database, CreditCard,
  Settings, Repeat, LogOut, Home, Receipt,
} from "lucide-react";
import { useSiteConfig } from "@/lib/useSiteConfig";

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
}

const links = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/profielen", label: "Profielen", icon: FileCheck },
  { href: "/admin/gebruikers", label: "Gebruikers", icon: Users },
  { href: "/admin/catalogi", label: "Catalogi", icon: Database },
  { href: "/admin/abonnementen", label: "Abonnementen", icon: CreditCard },
  { href: "/admin/betalingen", label: "Betalingen", icon: Receipt },
  { href: "/admin/instellingen", label: "Project defaults", icon: Settings },
  { href: "/admin/verticalen", label: "Verticaal switchen", icon: Repeat },
];

export function useIsAdmin() {
  return useQuery<{ isAdmin: boolean; adminId?: string }>({
    queryKey: ["/api/admin/me"],
    queryFn: async () => {
      const r = await authFetch("/api/admin/me");
      if (r.status === 403) return { isAdmin: false };
      if (!r.ok) throw new Error(`${r.status}`);
      return r.json();
    },
    retry: false,
    staleTime: 60_000,
  });
}

export function AdminLayout({ children, title, description }: AdminLayoutProps) {
  const { siteName } = useSiteConfig();
  const [location] = useLocation();
  const { user, signOut, loading } = useAuth();
  const adminQ = useIsAdmin();

  if (!loading && !user) {
    window.location.href = "/login";
    return null;
  }

  if (loading || adminQ.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!adminQ.data?.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md text-center" data-testid="admin-forbidden">
          <ShieldCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Geen toegang</h1>
          <p className="text-muted-foreground mb-6">
            Je hebt geen admin-rechten op {siteName}. Neem contact op met de eigenaar als dit een vergissing is.
          </p>
          <Link href="/dashboard"><Button>Terug naar dashboard</Button></Link>
        </div>
      </div>
    );
  }

  const handleSignOut = async () => {
    await signOut();
    queryClient.clear();
    setTimeout(() => { window.location.href = "/"; }, 100);
  };

  return (
    <SidebarProvider style={{ "--sidebar-width": "16rem", "--sidebar-width-icon": "3rem" } as React.CSSProperties}>
      <div className="flex h-screen w-full bg-muted/30 overflow-hidden">
        <Sidebar>
          <SidebarHeader className="border-b">
            <Link href="/admin" className="flex items-center gap-2 px-2 py-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary">
                <ShieldCheck className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold">Admin · {siteName}</span>
            </Link>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Beheer</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {links.map((l) => {
                    const Icon = l.icon;
                    const active = location === l.href || (l.href !== "/admin" && location.startsWith(l.href));
                    return (
                      <SidebarMenuItem key={l.href}>
                        <SidebarMenuButton asChild isActive={active}>
                          <Link href={l.href} data-testid={`admin-nav-${l.href.split("/").pop()}`}>
                            <Icon className="h-4 w-4" />
                            <span>{l.label}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarGroup>
              <SidebarGroupLabel>Snelle links</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link href="/dashboard"><LayoutDashboard className="h-4 w-4" /><span>Mijn dashboard</span></Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link href="/"><Home className="h-4 w-4" /><span>Naar website</span></Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="border-t">
            <div className="p-3">
              <p className="text-xs text-muted-foreground truncate mb-2">{user?.email}</p>
              <Button variant="ghost" size="sm" className="w-full justify-start" onClick={handleSignOut} data-testid="admin-button-logout">
                <LogOut className="h-4 w-4 mr-2" />Uitloggen
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="bg-background border-b sticky top-0 z-10">
            <div className="flex items-center gap-4 px-4 sm:px-6 py-4">
              <SidebarTrigger />
              <div>
                <h1 className="text-xl font-bold" data-testid="admin-page-title">{title}</h1>
                {description && <p className="text-sm text-muted-foreground">{description}</p>}
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="px-4 sm:px-6 py-6 max-w-7xl">{children}</div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
