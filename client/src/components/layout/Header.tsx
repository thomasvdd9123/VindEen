import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Leaf, Menu, X, User, LogIn, LayoutDashboard, LogOut, Settings, UserCircle } from "lucide-react";
import { useState } from "react";
import { siteConfig } from "@/lib/theme.config";
import { useSiteConfig } from "@/lib/useSiteConfig";
import { useAuth } from "@/lib/auth";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [location] = useLocation();
  const { user, signOut, loading } = useAuth();
  // Site-naam uit DB (admin-bewerkbaar in /admin/instellingen). Valt terug
  // op de hardcoded defaults uit theme.config.ts wanneer de fetch nog laadt.
  const { siteName } = useSiteConfig();

  const navLinks: { href: string; label: string }[] = [];

  const handleSignOut = async () => {
    await signOut();
    // Small delay to ensure session is fully cleared before redirect
    setTimeout(() => {
      window.location.href = "/";
    }, 100);
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 hover-elevate rounded-md px-2 py-1 -ml-2" data-testid="link-home">
            <div className="flex items-center justify-center w-9 h-9 rounded-md bg-primary">
              <Leaf className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg hidden sm:inline-block">{siteName || siteConfig.name}</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <Button
                  variant={location.startsWith(link.href) ? "secondary" : "ghost"}
                  size="sm"
                  data-testid={`nav-${link.href.replace(/\//g, '-').slice(1) || 'home'}`}
                >
                  {link.label}
                </Button>
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {loading ? (
              <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2" data-testid="button-user-menu">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {user.email?.substring(0, 2).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline max-w-[120px] truncate">
                      {user.email?.split("@")[0]}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium truncate">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <Link href="/dashboard">
                    <DropdownMenuItem className="cursor-pointer" data-testid="menu-dashboard">
                      <LayoutDashboard className="h-4 w-4 mr-2" />
                      Dashboard
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/dashboard/profielen">
                    <DropdownMenuItem className="cursor-pointer" data-testid="menu-profiles">
                      <UserCircle className="h-4 w-4 mr-2" />
                      Mijn profielen
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/dashboard/account">
                    <DropdownMenuItem className="cursor-pointer" data-testid="menu-account">
                      <Settings className="h-4 w-4 mr-2" />
                      Accountinstellingen
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer text-destructive" onClick={handleSignOut} data-testid="menu-logout">
                    <LogOut className="h-4 w-4 mr-2" />
                    Uitloggen
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link href="/login" className="hidden sm:block">
                  <Button variant="ghost" size="sm" data-testid="button-login">
                    <LogIn className="h-4 w-4 mr-2" />
                    Inloggen
                  </Button>
                </Link>
                <Link href="/registreren">
                  <Button size="sm" data-testid="button-register">
                    <User className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Registreren</span>
                    <span className="sm:hidden">Start</span>
                  </Button>
                </Link>
              </>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              data-testid="button-mobile-menu"
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <nav className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href} onClick={() => setIsMenuOpen(false)}>
                  <Button
                    variant={location.startsWith(link.href) ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    data-testid={`mobile-nav-${link.href.replace(/\//g, '-').slice(1) || 'home'}`}
                  >
                    {link.label}
                  </Button>
                </Link>
              ))}
              {user ? (
                <>
                  <Link href="/dashboard" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start">
                      <LayoutDashboard className="h-4 w-4 mr-2" />
                      Dashboard
                    </Button>
                  </Link>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-destructive" 
                    onClick={() => { handleSignOut(); setIsMenuOpen(false); }}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Uitloggen
                  </Button>
                </>
              ) : (
                <Link href="/login" onClick={() => setIsMenuOpen(false)} className="sm:hidden">
                  <Button variant="ghost" className="w-full justify-start" data-testid="mobile-button-login">
                    <LogIn className="h-4 w-4 mr-2" />
                    Inloggen
                  </Button>
                </Link>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
