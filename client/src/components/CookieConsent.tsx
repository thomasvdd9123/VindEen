import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";
import { readConsent, saveConsent } from "@/lib/cookieConsent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!readConsent()) setVisible(true);
    const open = () => setVisible(true);
    window.addEventListener("cookie-consent-open", open);
    return () => window.removeEventListener("cookie-consent-open", open);
  }, []);

  if (!visible) return null;

  const accept = (choice: "all" | "necessary") => {
    saveConsent(choice);
    setVisible(false);
  };

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie-toestemming"
      className="fixed inset-x-0 bottom-0 z-50 p-4 sm:p-6"
      data-testid="cookie-consent-banner"
    >
      <div className="mx-auto max-w-4xl rounded-lg border border-border bg-background shadow-lg">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start">
          <div className="flex-shrink-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
              <Cookie className="h-5 w-5 text-primary" />
            </div>
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Wij gebruiken cookies
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                We gebruiken noodzakelijke cookies om de site te laten werken. Met
                jouw toestemming gebruiken we ook cookies voor statistieken en
                marketing om onze dienstverlening te verbeteren. Lees meer in ons{" "}
                <Link
                  href="/cookies"
                  className="underline underline-offset-2 hover:text-foreground"
                  data-testid="link-cookie-policy-banner"
                >
                  cookiebeleid
                </Link>
                .
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Button
                onClick={() => accept("all")}
                data-testid="button-accept-all-cookies"
              >
                Alles aanvaarden
              </Button>
              <Button
                variant="outline"
                onClick={() => accept("necessary")}
                data-testid="button-accept-necessary-cookies"
              >
                Alleen noodzakelijke
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/cookies" data-testid="link-cookie-settings-banner">
                  Instellingen
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
