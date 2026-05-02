import { Link } from "wouter";
import { Leaf, ExternalLink } from "lucide-react";
import { siteConfig } from "@/lib/theme.config";
import { openCookieSettings } from "@/lib/cookieConsent";

export function Footer() {
  const currentYear = new Date().getFullYear();

  const categoryLinks = [
    { href: "/zoek/tuinaanlegger", label: "Tuinaanleggers" },
    { href: "/zoek/tuinarchitect", label: "Tuinarchitecten" },
    { href: "/zoek/hovenier", label: "Hoveniers" },
    { href: "/zoek/boomverzorger", label: "Boomverzorgers" },
  ];

  const locationLinks = [
    { href: "/zoek/tuinaanlegger/gent", label: "Tuinmannen Gent" },
    { href: "/zoek/tuinaanlegger/antwerpen", label: "Tuinmannen Antwerpen" },
    { href: "/zoek/tuinaanlegger/brussel", label: "Tuinmannen Brussel" },
    { href: "/zoek/tuinaanlegger/brugge", label: "Tuinmannen Brugge" },
  ];

  const infoLinks = [
    { href: "/prijzen", label: "Prijzen" },
    { href: "/privacy", label: "Privacybeleid" },
    { href: "/algemene-voorwaarden", label: "Algemene voorwaarden" },
    { href: "/cookies", label: "Cookiebeleid" },
  ];

  return (
    <footer className="bg-muted border-t border-border">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2" data-testid="link-footer-home">
              <div className="flex items-center justify-center w-9 h-9 rounded-md bg-primary">
                <Leaf className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-semibold text-lg">{siteConfig.name}</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              {siteConfig.description}
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Categorieën</h3>
            <ul className="space-y-2">
              {categoryLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    data-testid={`link-footer-${link.href.slice(1)}`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Populaire steden</h3>
            <ul className="space-y-2">
              {locationLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    data-testid={`link-footer-${link.label.toLowerCase().replace(/\s/g, '-')}`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Informatie</h3>
            <ul className="space-y-2">
              {infoLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    data-testid={`link-footer-${link.href.slice(1)}`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  onClick={openCookieSettings}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors text-left"
                  data-testid="button-cookie-settings-footer"
                >
                  Cookie-instellingen
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © {currentYear} {siteConfig.name}. Alle rechten voorbehouden.
            </p>
            <a 
              href={siteConfig.parentCompany.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              data-testid="link-parent-company"
            >
              Een project van {siteConfig.parentCompany.name}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
