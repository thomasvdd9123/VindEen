import { Link } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { SEO } from "@/components/SEO";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { siteConfig, hasUnresolvedLegalPlaceholders } from "@/lib/theme.config";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

interface LegalPageLayoutProps {
  title: string;
  description: string;
  canonical: string;
  children: React.ReactNode;
}

export function LegalPageLayout({
  title,
  description,
  canonical,
  children,
}: LegalPageLayoutProps) {
  return (
    <Layout>
      <SEO title={title} description={description} canonical={canonical} />

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
                <BreadcrumbPage>{title}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 md:py-12">
        <article className="max-w-3xl mx-auto">
          <header className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2" data-testid="text-legal-title">
              {title}
            </h1>
            <p className="text-sm text-muted-foreground">
              Laatst bijgewerkt: {siteConfig.legal.lastUpdated}
            </p>
          </header>

          {import.meta.env.DEV && hasUnresolvedLegalPlaceholders() && (
            <Alert className="mb-8" data-testid="alert-legal-placeholders">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Nog enkele velden in te vullen</AlertTitle>
              <AlertDescription>
                Deze pagina bevat velden zoals
                <code className="mx-1 rounded bg-muted px-1 py-0.5 font-mono text-xs">
                  [in te vullen — …]
                </code>
                . Vul ze aan in
                <code className="mx-1 rounded bg-muted px-1 py-0.5 font-mono text-xs">
                  client/src/lib/theme.config.ts → siteConfig.legal
                </code>
                en laat de definitieve tekst door een jurist nakijken. Deze
                melding is enkel zichtbaar in development.
              </AlertDescription>
            </Alert>
          )}
          <div
            className="prose prose-slate dark:prose-invert max-w-none prose-headings:scroll-mt-24 prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground prose-a:text-primary"
            data-testid="legal-content"
          >
            {children}
          </div>
        </article>
      </div>
    </Layout>
  );
}
