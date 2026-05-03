import { Link } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { SEO } from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from "@/components/ui/breadcrumb";
import { ArrowRight, Leaf } from "lucide-react";
import { siteConfig } from "@/lib/theme.config";
import { useSiteConfig } from "@/lib/useSiteConfig";

interface InfoPageLayoutProps {
  title: string;
  description: string;
  canonical: string;
  breadcrumbTitle: string;
  heroImage?: string;
  heroImageAlt?: string;
  children: React.ReactNode;
  showCta?: boolean;
  showTuinmanCta?: boolean;
  relatedLinks?: Array<{ title: string; href: string; description?: string }>;
  wideContent?: boolean;
}

const defaultRelatedLinks = [
  { title: "Vind een tuinman", href: "/zoek", description: "Zoek professionals in jouw regio" },
  { title: "Veelgestelde vragen", href: "/faq", description: "Antwoorden op veel voorkomende vragen" },
  { title: "Kosten & prijzen", href: "/info/kosten-prijzen", description: "Wat kost een tuinman?" },
];

export function InfoPageLayout({
  title,
  description,
  canonical,
  breadcrumbTitle,
  heroImage,
  heroImageAlt,
  children,
  showCta = true,
  showTuinmanCta = true,
  relatedLinks = defaultRelatedLinks,
  wideContent = false,
}: InfoPageLayoutProps) {
  return (
    <Layout>
      <SEO
        title={title}
        description={description}
        canonical={canonical}
      />

      <div className="bg-muted/30 border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/">Home</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{breadcrumbTitle}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      {heroImage && (
        <div className="relative h-48 sm:h-64 md:h-80 overflow-hidden">
          <img 
            src={heroImage} 
            alt={heroImageAlt || title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 container mx-auto px-4 pb-6">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground drop-shadow-sm">
              {title}
            </h1>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className={wideContent ? "max-w-4xl mx-auto" : "grid grid-cols-1 lg:grid-cols-3 gap-8"}>
          <div className={wideContent ? "" : "lg:col-span-2"}>
            {!heroImage && (
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6">{title}</h1>
            )}
            <div className="prose prose-lg max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground">
              {children}
            </div>
          </div>

          {!wideContent && (
            <aside className="space-y-6">
              {showCta && (
                <Card className="border-primary/20 bg-primary/5">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Leaf className="h-5 w-5 text-primary" />
                      Zoek een tuinman
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Vind de perfecte tuinprofessional voor jouw project in heel België.
                    </p>
                    <Link href="/zoek">
                      <Button className="w-full gap-2">
                        Start je zoekopdracht
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Gerelateerde onderwerpen</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {relatedLinks.map((link, index) => (
                    <Link key={index} href={link.href}>
                      <div className="group cursor-pointer">
                        <p className="font-medium text-sm group-hover:text-primary transition-colors flex items-center gap-1">
                          {link.title}
                          <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </p>
                        {link.description && (
                          <p className="text-xs text-muted-foreground">{link.description}</p>
                        )}
                      </div>
                    </Link>
                  ))}
                </CardContent>
              </Card>

              {showTuinmanCta && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Ben je tuinman?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Sluit je aan bij {siteConfig.name} en bereik meer klanten.
                    </p>
                    <Link href="/info/voor-tuinmannen">
                      <Button variant="outline" className="w-full gap-2">
                        Meer informatie
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}
            </aside>
          )}
        </div>
      </div>
    </Layout>
  );
}
