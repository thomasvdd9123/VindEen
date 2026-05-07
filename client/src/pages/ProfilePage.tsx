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
  CalendarCheck,
  MessageCircle,
  Timer,
  ShieldCheck,
  Wrench,
  CalendarDays,
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
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              <div className="lg:col-span-2 space-y-4">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-10 w-3/4" />
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-4 w-1/3" />
                <div className="flex gap-2 pt-2">
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-6 w-24 rounded-full" />
                </div>
              </div>
              <div className="flex justify-center lg:justify-end">
                <Skeleton className="h-36 w-36 rounded-2xl" />
              </div>
            </div>
          </div>
        </div>
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
            <div className="space-y-4">
              <Card>
                <CardContent className="p-5 space-y-3">
                  <Skeleton className="h-10 w-full rounded-md" />
                  <Skeleton className="h-10 w-full rounded-md" />
                  <Skeleton className="h-10 w-full rounded-md" />
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

  const cleanIntroduction = profile.introduction
    ? profile.introduction.startsWith("<")
      ? profile.introduction.replace(/<[^>]*>/g, "").replace(/&[^;]+;/g, " ").trim()
      : profile.introduction
    : null;

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

      {/* Preview banner */}
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

      {/* ── Hero ────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-border">
        <div className="container mx-auto px-4 pt-5 pb-8">

          {/* Breadcrumb */}
          <Breadcrumb className="mb-6">
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
                      <Link href={`/zoek/${locationSlug}`} data-testid="breadcrumb-location">
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
                      <Link href={`/zoek/${locationSlug}/${profile.category!.slug}`} data-testid="breadcrumb-category-location">
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

          {/* Name + avatar row */}
          <div className="flex flex-col-reverse sm:flex-row gap-6 sm:gap-10 items-start">

            {/* Left: identity */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight" data-testid="text-profile-name">
                  {profile.name}
                </h1>
                {profile.isVerified && (
                  <Badge className="gap-1 shrink-0 self-center">
                    <CheckCircle className="h-3 w-3" />
                    Geverifieerd
                  </Badge>
                )}
              </div>

              {cleanIntroduction && (
                <p className="text-lg text-muted-foreground italic mt-1 mb-3" data-testid="text-profile-tagline">
                  {cleanIntroduction}
                </p>
              )}

              {(profile.location || office) && (
                <div className="flex items-center gap-1.5 text-muted-foreground mb-4">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span data-testid="text-profile-location">
                    {office && !profile.hideAddress && office.street
                      ? `${office.street} ${office.number ?? ""}`.trim() + `, `
                      : ""}
                    {office?.postcode ?? ""} {office?.municipality || office?.town || profile.location?.name || ""}
                  </span>
                </div>
              )}

              {profile.specializations && profile.specializations.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-5">
                  {profile.specializations.map((spec: string) => {
                    const slug = specKeyToSlug[spec] || spec;
                    return (
                      <Link key={spec} href={`/zoek/${slug}`}>
                        <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80 transition-colors">
                          {specLabels[spec] || spec}
                        </Badge>
                      </Link>
                    );
                  })}
                </div>
              )}

              {/* Quick-contact row */}
              <div className="flex flex-wrap gap-2">
                {profile.telnr && (
                  <a href={`tel:${profile.telnr}`} data-testid="link-phone-hero">
                    <Button size="sm" className="gap-2">
                      <Phone className="h-4 w-4" />
                      {profile.telnr}
                    </Button>
                  </a>
                )}
                {profile.email && (
                  <a href={`mailto:${profile.email}`} data-testid="link-email-hero">
                    <Button size="sm" variant="outline" className="gap-2">
                      <Mail className="h-4 w-4" />
                      Stuur een e-mail
                    </Button>
                  </a>
                )}
                {profile.hasWebsite && profile.website && (
                  <a
                    href={profile.website.match(/^https?:\/\//) ? profile.website : `https://${profile.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid="link-website-hero"
                    onMouseDown={(e) => {
                      if (e.button === 0 || e.button === 1) {
                        fetch(`/api/profiles/${profile.id}/track-click`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ type: "website" }),
                        }).catch(() => {});
                      }
                    }}
                  >
                    <Button size="sm" variant="outline" className="gap-2">
                      <Globe className="h-4 w-4" />
                      Website
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </a>
                )}
              </div>
            </div>

            {/* Right: avatar */}
            <div className="shrink-0">
              <Avatar className="h-28 w-28 sm:h-36 sm:w-36 rounded-2xl border border-border shadow-sm" data-testid="img-profile-avatar">
                <AvatarImage src={profile.logoUrl || undefined} alt={profile.name} className="object-cover" />
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-3xl rounded-2xl">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </div>

      {/* ── Content grid ────────────────────────────────────────────── */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 items-start">

          {/* Main: 2/3 */}
          <div className="lg:col-span-2">

            {/* Description */}
            {profile.description && (
              <section className="pb-8 mb-8 border-b border-border" data-testid="card-profile-description">
                <h2 className="text-lg font-semibold mb-4">Over {profile.name}</h2>
                {profile.description.startsWith("<") ? (
                  <div
                    className="rich-text-content text-muted-foreground leading-relaxed"
                    data-testid="text-profile-description"
                    dangerouslySetInnerHTML={{ __html: profile.description }}
                  />
                ) : (
                  <div className="text-muted-foreground" data-testid="text-profile-description">
                    {profile.description.split("\n").map((paragraph: string, i: number) => (
                      <p key={i} className="mb-3 last:mb-0 leading-relaxed">{paragraph}</p>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* Practical info */}
            <PracticalInfoSection practical={profile.practical} />
          </div>

          {/* Sidebar: 1/3 */}
          <div className="space-y-6 lg:sticky lg:top-6">

            {/* Contact details card */}
            <Card data-testid="card-profile-contact-info">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Contactgegevens</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                {profile.telnr && (
                  <a
                    href={`tel:${profile.telnr}`}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/60 transition-colors"
                    data-testid="link-phone"
                  >
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Phone className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Telefoon</p>
                      <p className="font-medium text-sm">{profile.telnr}</p>
                    </div>
                  </a>
                )}
                {profile.email && (
                  <a
                    href={`mailto:${profile.email}`}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/60 transition-colors"
                    data-testid="link-email"
                  >
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Mail className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">E-mail</p>
                      <p className="font-medium text-sm truncate">{profile.email}</p>
                    </div>
                  </a>
                )}
                {profile.hasWebsite && profile.website && (
                  <a
                    href={profile.website.match(/^https?:\/\//) ? profile.website : `https://${profile.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/60 transition-colors"
                    data-testid="link-website"
                    onMouseDown={(e) => {
                      if (e.button === 0 || e.button === 1) {
                        fetch(`/api/profiles/${profile.id}/track-click`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ type: "website" }),
                        }).catch(() => {});
                      }
                    }}
                  >
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Globe className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">Website</p>
                      <p className="font-medium text-sm truncate">{profile.website.replace(/^https?:\/\//, "")}</p>
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  </a>
                )}

                {office && (
                  <>
                    <Separator className="my-1" />
                    <div className="flex items-start gap-3 p-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <MapPin className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Locatie</p>
                        {!profile.hideAddress && office.street && (
                          <p className="font-medium text-sm">{office.street} {office.number}</p>
                        )}
                        <p className={`text-sm ${profile.hideAddress ? "font-medium" : "text-muted-foreground"}`}>
                          {office.postcode} {office.municipality || office.town}
                        </p>
                        <p className="text-muted-foreground text-sm">{siteConfig.country}</p>
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

// Practical info as an open section (no card border) with subtle bg
function PracticalInfoSection({ practical }: { practical: any }) {
  const { questions } = usePracticalQuestions();
  if (!practical || !questions.length) return null;

  const ICONS: Record<string, any> = {
    experienceYears: Clock,
    languages: Languages,
    tariff: Euro,
    acceptedPaymentMethods: CreditCard,
    priceRange: Euro,
    waitingList: Timer,
    responseTime: MessageCircle,
    availability: CalendarCheck,
    worksWeekends: CalendarDays,
    insured: ShieldCheck,
    providesEquipment: Wrench,
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
    <section data-testid="card-profile-practical">
      <h2 className="text-lg font-semibold mb-4">Praktische informatie</h2>
      <div className="bg-muted/40 rounded-xl p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
          {rows.map(({ q, display }) => {
            const Icon = ICONS[q.camelKey] || Briefcase;
            return (
              <div key={q.id} className="flex items-start gap-3" data-testid={`practical-${q.camelKey}`}>
                <Icon className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">{q.name}</p>
                  <p className="font-medium text-sm">{display}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
