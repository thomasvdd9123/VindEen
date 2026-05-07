import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link, useSearch } from "wouter";
import { authFetch } from "@/lib/queryClient";
import { Layout } from "@/components/layout/Layout";
import { SEO, generateLocalBusinessSchema, generateBreadcrumbSchema } from "@/components/SEO";
import { ContactForm } from "@/components/ContactForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from "@/components/ui/breadcrumb";
import {
  MapPin,
  Phone,
  Mail,
  Globe,
  CheckCircle,
  Clock,
  Languages,
  Euro,
  CreditCard,
  Briefcase,
  TreeDeciduous,
  ArrowLeft,
  ExternalLink,
  EyeOff,
} from "lucide-react";
import type { ProfileWithRelations } from "@shared/schema";
import { siteConfig, fillCopy } from "@/lib/theme.config";
import { usePracticalQuestions, type PracticalQuestion } from "@/lib/usePracticalQuestions";
import { useSpecializationMap } from "@/lib/useSpecializations";

export default function ProfilePage() {
  const params = useParams<{ slug: string }>();
  const searchString = useSearch();
  const previewId = new URLSearchParams(searchString).get("preview");
  const { labelByKey: specLabels, keyToSlug: specKeyToSlug } = useSpecializationMap();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [params.slug]);

  const { data: profile, isLoading, error } = useQuery<ProfileWithRelations>({
    queryKey: previewId
      ? ["/api/profiles/by-id", previewId]
      : ["/api/profiles", params.slug],
    enabled: !!params.slug,
    queryFn: previewId
      ? async () => {
          const res = await authFetch(`/api/profiles/by-id/${previewId}`);
          if (!res.ok) throw new Error("Profile not found");
          return res.json();
        }
      : undefined,
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-6 w-64 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex gap-6">
                    <Skeleton className="h-24 w-24 rounded-full" />
                    <div className="flex-1 space-y-3">
                      <Skeleton className="h-8 w-3/4" />
                      <Skeleton className="h-5 w-1/2" />
                      <Skeleton className="h-4 w-1/3" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <Skeleton className="h-6 w-32 mb-4" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4" />
                </CardContent>
              </Card>
            </div>
            <div className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <Skeleton className="h-6 w-32 mb-4" />
                  <div className="space-y-3">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !profile) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center">
          <TreeDeciduous className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Profiel niet gevonden</h1>
          <p className="text-muted-foreground mb-6">
            Dit profiel bestaat niet of is niet meer beschikbaar.
          </p>
          <Link href="/">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Terug naar home
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const initials = profile.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const office = profile.office;
  const locationName = office?.municipality || office?.town || profile.location?.name || "";
  
  const seoTitle = locationName 
    ? fillCopy(siteConfig.pages.profile.seoTitle).replace("{name}", profile.name).replace("{location}", locationName)
    : profile.name;

  const seoDescription = profile.description
    ? profile.description.slice(0, 155) + (profile.description.length > 155 ? "..." : "")
    : fillCopy(locationName
        ? siteConfig.pages.profile.seoDescriptionWithLocation
        : siteConfig.pages.profile.seoDescriptionNoLocation
      ).replace("{name}", profile.name).replace("{location}", locationName);

  const locationSlug = profile.location ? `${profile.location.postcode}-${profile.location.slug}` : null;
  const categoryInLocation = profile.category && profile.location 
    ? `${profile.category.name} in ${profile.location.name}`
    : null;

  const breadcrumbItems = [
    { name: "Home", url: "/" },
    { name: fillCopy(siteConfig.pages.profile.breadcrumbSearchLabel), url: "/zoek" },
  ];
  if (profile.location) {
    breadcrumbItems.push({ 
      name: profile.location.name, 
      url: `/zoek/${locationSlug}` 
    });
  }
  if (categoryInLocation && locationSlug) {
    breadcrumbItems.push({ 
      name: categoryInLocation, 
      url: `/zoek/${locationSlug}/${profile.category!.slug}` 
    });
  }
  breadcrumbItems.push({ name: profile.name, url: `/bedrijf/${profile.slug}` });

  const structuredData = [
    generateLocalBusinessSchema({
      name: profile.name,
      description: profile.description || undefined,
      slug: profile.slug,
      profileImageUrl: profile.logoUrl,
      phone: profile.telnr,
      email: profile.email,
      website: profile.website,
      offices: office
        ? [{
            street: office.street ?? null,
            number: office.number ?? null,
            town: office.town ?? office.municipality ?? null,
            postcode: office.postcode ?? null,
            province: office.province ?? null,
            latitude: typeof office.latitude === "number" ? office.latitude : null,
            longitude: typeof office.longitude === "number" ? office.longitude : null,
          }]
        : undefined,
      experienceYears: profile.practical?.experienceYears,
      specializations: profile.specializations || undefined,
      specializationLabels: profile.specializations
        ?.map((slug: string) => specLabels[slug])
        .filter(Boolean),
      languages: Array.isArray(profile.practical?.languages)
        ? profile.practical.languages
        : undefined,
      hourlyRateEur:
        typeof profile.practical?.tariff === "number" ? profile.practical.tariff : null,
    }),
    generateBreadcrumbSchema(breadcrumbItems),
  ];

  return (
    <Layout>
      <SEO
        title={seoTitle}
        description={seoDescription}
        canonical={`/bedrijf/${profile.slug}`}
        ogType="profile"
        ogImage={profile.logoUrl || undefined}
        structuredData={structuredData}
        noindex={!(profile.isPublic && profile.isVerified)}
      />

      {/* Preview banner — only visible to the owner when profile isn't public yet */}
      {previewId && (
        <div className="bg-amber-50 border-b border-amber-200">
          <div className="container mx-auto px-4 py-3 flex flex-wrap items-center gap-3 text-amber-800 text-sm">
            <EyeOff className="h-4 w-4 shrink-0" />
            <span>
              <strong>Voorbeeldweergave</strong> — Dit profiel is nog niet zichtbaar voor bezoekers. Alleen jij kan het bekijken als eigenaar.
            </span>
            <Link href="/dashboard/profielen" className="ml-auto text-amber-700 underline text-xs whitespace-nowrap">
              ← Terug naar dashboard
            </Link>
          </div>
        </div>
      )}

      <div className="bg-muted/30 border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/" data-testid="breadcrumb-home">Home</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/zoek" data-testid="breadcrumb-search">{fillCopy(siteConfig.pages.profile.breadcrumbSearchLabel)}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              {profile.location && (
                <>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link 
                        href={`/zoek/${locationSlug}`}
                        data-testid="breadcrumb-location"
                      >
                        {profile.location.name}
                      </Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                </>
              )}
              {categoryInLocation && locationSlug && (
                <>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link 
                        href={`/zoek/${locationSlug}/${profile.category!.slug}`}
                        data-testid="breadcrumb-category-location"
                      >
                        {categoryInLocation}
                      </Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                </>
              )}
              <BreadcrumbItem>
                <BreadcrumbPage data-testid="breadcrumb-profile">{profile.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card data-testid="card-profile-header">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row gap-6">
                  <Avatar className="h-24 w-24 border-4 border-primary/10 shrink-0">
                    <AvatarImage src={profile.logoUrl || undefined} alt={profile.name} />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-2xl">
                      {initials}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <div className="flex flex-wrap items-start gap-2 mb-2">
                      <h1 className="text-2xl sm:text-3xl font-bold" data-testid="text-profile-name">
                        {profile.name}
                      </h1>
                      {profile.isVerified && (
                        <Badge className="gap-1 shrink-0">
                          <CheckCircle className="h-3 w-3" />
                          Geverifieerd
                        </Badge>
                      )}
                    </div>

                    {profile.title && (
                      <p className="text-lg text-muted-foreground mb-2" data-testid="text-profile-title">
                        {profile.title}
                      </p>
                    )}

                    {profile.location && (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span data-testid="text-profile-location">
                          {profile.location.name}, {profile.location.region}
                        </span>
                      </div>
                    )}

                    {profile.specializations && profile.specializations.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-4">
                        {profile.specializations.map((spec: string) => {
                          const slug = specKeyToSlug[spec] || spec;
                          return (
                            <Link key={spec} href={`/zoek/${slug}`}>
                              <Badge variant="outline" className="cursor-pointer">
                                {specLabels[spec] || spec}
                              </Badge>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {profile.introduction && (
              <Card data-testid="card-profile-intro">
                <CardHeader>
                  <CardTitle className="text-lg">Over {profile.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  {profile.introduction.startsWith("<") ? (
                    <div
                      className="rich-text-content text-muted-foreground"
                      data-testid="text-profile-introduction"
                      dangerouslySetInnerHTML={{ __html: profile.introduction }}
                    />
                  ) : (
                    <p className="text-muted-foreground leading-relaxed" data-testid="text-profile-introduction">
                      {profile.introduction}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {profile.description && (
              <Card data-testid="card-profile-description">
                <CardHeader>
                  <CardTitle className="text-lg">Beschrijving</CardTitle>
                </CardHeader>
                <CardContent>
                  {profile.description.startsWith("<") ? (
                    <div
                      className="rich-text-content text-muted-foreground"
                      data-testid="text-profile-description"
                      dangerouslySetInnerHTML={{ __html: profile.description }}
                    />
                  ) : (
                    <div
                      className="text-muted-foreground"
                      data-testid="text-profile-description"
                    >
                      {profile.description.split('\n').map((paragraph: string, i: number) => (
                        <p key={i} className="mb-2 last:mb-0 leading-relaxed">{paragraph}</p>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}


            <PracticalInfoCard practical={profile.practical} />
          </div>

          <div className="space-y-6">
            <Card data-testid="card-profile-contact-info">
              <CardHeader>
                <CardTitle className="text-lg">Contactgegevens</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile.telnr && (
                  <a 
                    href={`tel:${profile.telnr}`}
                    className="flex items-center gap-3 p-3 rounded-md bg-muted/50 hover:bg-muted transition-colors"
                    data-testid="link-phone"
                  >
                    <Phone className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Telefoon</p>
                      <p className="font-medium">{profile.telnr}</p>
                    </div>
                  </a>
                )}
                {profile.email && (
                  <a 
                    href={`mailto:${profile.email}`}
                    className="flex items-center gap-3 p-3 rounded-md bg-muted/50 hover:bg-muted transition-colors"
                    data-testid="link-email"
                  >
                    <Mail className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium truncate">{profile.email}</p>
                    </div>
                  </a>
                )}
                {profile.hasWebsite && profile.website && (
                  <a 
                    href={profile.website.match(/^https?:\/\//) ? profile.website : `https://${profile.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-md bg-muted/50 hover:bg-muted transition-colors"
                    data-testid="link-website"
                    onMouseDown={(e) => {
                      // Track website click for left-click (0) and middle-click (1)
                      if (e.button === 0 || e.button === 1) {
                        fetch(`/api/profiles/${profile.id}/track-click`, { 
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ type: 'website' })
                        }).catch(() => {});
                      }
                    }}
                  >
                    <Globe className="h-5 w-5 text-primary" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-muted-foreground">Website</p>
                      <p className="font-medium truncate">{profile.website.replace(/^https?:\/\//, '')}</p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </a>
                )}

                {profile.office && (
                  <>
                    <Separator />
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Locatie</p>
                        {!profile.hideAddress && (
                          <p className="font-medium">{profile.office.street} {profile.office.number}</p>
                        )}
                        <p className={profile.hideAddress ? "font-medium" : "text-muted-foreground"}>{profile.office.postcode} {profile.office.town}</p>
                        <p className="text-muted-foreground">{siteConfig.country}</p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <ContactForm profileId={profile.id} profileName={profile.name} />
          </div>
        </div>
      </div>
    </Layout>
  );
}

// Vertical-agnostic "Praktische informatie" card. Renders one row per
// practical_question that has an answer on the profile, so adding a new
// question in the DB shows up automatically without any frontend change.
function PracticalInfoCard({ practical }: { practical: any }) {
  const { questions } = usePracticalQuestions();
  if (!practical || !questions.length) return null;

  const ICONS: Record<string, any> = {
    experienceYears: Clock,
    languages: Languages,
    tariff: Euro,
    acceptedPaymentMethods: CreditCard,
  };

  const rows = questions
    .map((q: PracticalQuestion) => {
      const v = practical[q.camelKey];
      if (v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0)) return null;

      let display: string;
      if (q.fieldType === "OPTION" && Array.isArray(v)) {
        display = v
          .map((id: string) => q.options.find((o) => o.id === id || o.key === id)?.name || id)
          .join(", ");
      } else if (q.fieldType === "OPTION") {
        display = q.options.find((o) => o.id === v || o.key === v)?.name || String(v);
      } else if (q.fieldType === "BOOLEAN") {
        display = v ? "Ja" : "Nee";
      } else if (Array.isArray(v)) {
        display = v.join(", ");
      } else {
        display = String(v);
      }

      return { q, display };
    })
    .filter(Boolean) as { q: PracticalQuestion; display: string }[];

  if (!rows.length) return null;

  return (
    <Card data-testid="card-profile-practical">
      <CardHeader>
        <CardTitle className="text-lg">Praktische informatie</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {rows.map(({ q, display }) => {
            const Icon = ICONS[q.camelKey] || Briefcase;
            return (
              <div key={q.id} className="flex items-start gap-3" data-testid={`practical-${q.camelKey}`}>
                <Icon className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-sm">{q.name}</p>
                  <p className="text-muted-foreground text-sm">{display}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
