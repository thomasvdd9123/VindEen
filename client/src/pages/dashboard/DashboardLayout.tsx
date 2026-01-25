import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { 
  Leaf, 
  LayoutDashboard, 
  User, 
  UserCircle, 
  MessageSquare, 
  BarChart3,
  LogOut,
  ChevronRight,
  Home,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { siteConfig } from "@/lib/theme.config";
import { queryClient } from "@/lib/queryClient";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
}

const sidebarLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/account", label: "Account & facturatie", icon: User },
  { href: "/dashboard/profielen", label: "Jouw praktijkprofielen", icon: UserCircle },
  { href: "/dashboard/contacten", label: "Contactverzoeken", icon: MessageSquare },
  { href: "/dashboard/statistieken", label: "Statistieken", icon: BarChart3 },
];

export function DashboardLayout({ children, title, description }: DashboardLayoutProps) {
  const [location] = useLocation();
  const { user, signOut, loading, isConfigured } = useAuth();

  // Prefetch all dashboard data when user enters dashboard
  useEffect(() => {
    if (user?.id) {
      // Prefetch account data
      queryClient.prefetchQuery({
        queryKey: ["/api/accounts/by-auth", user.id],
        staleTime: 1000 * 60 * 5,
      });
      
      // Fetch account first, then prefetch related data
      fetch(`/api/accounts/by-auth/${user.id}`)
        .then(res => res.json())
        .then((account: { id: string }) => {
          if (account?.id) {
            // Prefetch profiles
            queryClient.prefetchQuery({
              queryKey: ["/api/my-profiles", account.id],
              staleTime: 1000 * 60 * 5,
            });
            // Prefetch contact requests (for all profiles)
            queryClient.prefetchQuery({
              queryKey: ["/api/contact-requests", account.id],
              staleTime: 1000 * 60 * 5,
            });
          }
        })
        .catch(() => {}); // Silently fail prefetch
    }
  }, [user?.id]);

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/";
  };

  // Redirect if not logged in (but allow access if not configured - for demo)
  if (!loading && !user && isConfigured) {
    window.location.href = "/login";
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="dashboard-layout flex h-screen w-full bg-muted/30 overflow-hidden">
        <Sidebar>
          <SidebarHeader className="border-b border-sidebar-border">
            <Link href="/" className="flex items-center gap-2 px-2 py-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary">
                <Leaf className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-sidebar-foreground">{siteConfig.name}</span>
            </Link>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Account beheren</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {sidebarLinks.map((link) => {
                    const Icon = link.icon;
                    const isActive = location === link.href;
                    return (
                      <SidebarMenuItem key={link.href}>
                        <SidebarMenuButton asChild isActive={isActive}>
                          <Link href={link.href} data-testid={`sidebar-link-${link.href.split('/').pop()}`}>
                            <Icon className="h-4 w-4" />
                            <span>{link.label}</span>
                            {isActive && <ChevronRight className="h-4 w-4 ml-auto" />}
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
                      <Link href="/" data-testid="sidebar-link-home">
                        <Home className="h-4 w-4" />
                        <span>Naar homepage</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t border-sidebar-border">
            <div className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-medium">
                  {user?.email?.substring(0, 2).toUpperCase() || "U"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-sidebar-foreground truncate">
                    {user?.email?.split("@")[0] || "Demo gebruiker"}
                  </p>
                  <p className="text-xs text-sidebar-foreground/60 truncate">
                    {user?.email || "demo@example.com"}
                  </p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full justify-start text-sidebar-foreground/80 hover:text-destructive"
                onClick={handleSignOut}
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Uitloggen
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>

        {/* Main content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Page header */}
          <div className="bg-background border-b border-border sticky top-0 z-10">
            <div className="flex items-center gap-4 px-4 sm:px-6 lg:px-8 py-4">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <div>
                <h1 className="text-xl font-bold text-foreground" data-testid="text-page-title">
                  {title}
                </h1>
                {description && (
                  <p className="text-sm text-muted-foreground">{description}</p>
                )}
              </div>
            </div>
          </div>

          {/* Page content */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-4 sm:px-6 lg:px-8 py-6">
              {children}
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
