import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Leaf, Menu, X, User, LogIn } from "lucide-react";
import { useState } from "react";
import { siteConfig } from "@/lib/theme.config";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [location] = useLocation();

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/vind-een-tuinaanlegger", label: "Tuinaanleggers" },
    { href: "/vind-een-tuinarchitect", label: "Tuinarchitecten" },
    { href: "/vind-een-hovenier", label: "Hoveniers" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 hover-elevate rounded-md px-2 py-1 -ml-2" data-testid="link-home">
            <div className="flex items-center justify-center w-9 h-9 rounded-md bg-primary">
              <Leaf className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg hidden sm:inline-block">{siteConfig.name}</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <Button
                  variant={location === link.href ? "secondary" : "ghost"}
                  size="sm"
                  data-testid={`nav-${link.href.replace(/\//g, '-').slice(1) || 'home'}`}
                >
                  {link.label}
                </Button>
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
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
                    variant={location === link.href ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    data-testid={`mobile-nav-${link.href.replace(/\//g, '-').slice(1) || 'home'}`}
                  >
                    {link.label}
                  </Button>
                </Link>
              ))}
              <Link href="/login" onClick={() => setIsMenuOpen(false)} className="sm:hidden">
                <Button variant="ghost" className="w-full justify-start" data-testid="mobile-button-login">
                  <LogIn className="h-4 w-4 mr-2" />
                  Inloggen
                </Button>
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
