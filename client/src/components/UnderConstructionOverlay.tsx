import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Construction, Leaf } from "lucide-react";
import { useSiteConfig } from "@/lib/useSiteConfig";

const COOKIE_KEY = "zoek_construction_dismissed";

export function UnderConstructionOverlay() {
  const [isDismissed, setIsDismissed] = useState(true);
  const { siteName } = useSiteConfig();

  useEffect(() => {
    const dismissed = localStorage.getItem(COOKIE_KEY);
    if (!dismissed) {
      setIsDismissed(false);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(COOKIE_KEY, "true");
    setIsDismissed(true);
  };

  if (isDismissed) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 z-[100] bg-background flex items-center justify-center"
      data-testid="overlay-under-construction"
    >
      <div className="max-w-md mx-auto px-6 text-center space-y-6">
        <div className="flex justify-center">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
            <Construction className="h-8 w-8 text-primary" />
          </div>
        </div>

        <div className="flex items-center justify-center gap-2">
          <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary">
            <Leaf className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="font-bold text-2xl">{siteName}</span>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Website in aanbouw</h1>
          <p className="text-muted-foreground">
            We werken hard aan deze website. Sommige functies werken mogelijk nog niet zoals verwacht.
          </p>
        </div>

        <Button 
          onClick={handleDismiss}
          size="lg"
          className="w-full"
          data-testid="button-dismiss-construction"
        >
          Toch bekijken
        </Button>
      </div>
    </div>
  );
}
