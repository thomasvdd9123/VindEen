import { Link } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Leaf, Search, Home } from "lucide-react";

export default function NotFound() {
  return (
    <Layout>
      <SEO
        title="Pagina niet gevonden (404)"
        description="De pagina die je zoekt bestaat niet of is verplaatst."
        noindex={true}
      />
      <div className="min-h-[calc(100vh-300px)] flex items-center justify-center py-16 px-4">
        <div className="text-center max-w-md">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="flex items-center justify-center w-24 h-24 rounded-full bg-muted">
                <Leaf className="h-12 w-12 text-muted-foreground" />
              </div>
              <div className="absolute -top-1 -right-1 flex items-center justify-center w-8 h-8 rounded-full bg-destructive text-destructive-foreground font-bold text-sm">
                404
              </div>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold mb-3" data-testid="text-404-title">
            Pagina niet gevonden
          </h1>
          <p className="text-muted-foreground mb-8" data-testid="text-404-description">
            De pagina die je zoekt bestaat niet of is verplaatst. 
            Misschien kunnen we je helpen vinden wat je zoekt?
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/">
              <Button className="gap-2" data-testid="button-go-home">
                <Home className="h-4 w-4" />
                Naar homepage
              </Button>
            </Link>
            <Link href="/zoek/tuinaanlegger">
              <Button variant="outline" className="gap-2" data-testid="button-search">
                <Search className="h-4 w-4" />
                Zoek tuinmannen
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
