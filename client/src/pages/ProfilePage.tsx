import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link, useSearch } from "wouter";
import { authFetch } from "@/lib/queryClient";
import { Layout } from "@/components/layout/Layout";
import { SEO, generateLocalBusinessSchema, generateBreadcrumbSchema } from "@/components/SEO";
import { ContactForm } from "@/components/ContactForm";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
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
  ShieldCheck,
  Wrench,
  CalendarDays,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { ProfileWithRelations, PortfolioProject } from "@shared/schema";
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

  const { data: profile, isPending, error } = useQuery<ProfileWithRelations>(
    previewId
      ? {
          queryKey: ["/api/profiles/by-id", previewId],
          queryFn: async () => {
            const res = await authFetch(`/api/profiles/by-id/${previewId}`);
            if (!res.ok) throw new Error("Profile not found");
            return res.json();
          },
        }
      : {
          queryKey: ["/api/profiles", params.slug],
          enabled: !!params.slug,
          retry: 1,
        },
  );

  const { data: portfolio = [] } = useQuery<PortfolioProject[]>({
    queryKey: ["/api/profiles", profile?.id, "portfolio"],
    queryFn: async () => {
      const res = await fetch(`/api/profiles/${profile!.id}/portfolio`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!profile?.id,
  });

  if (isPending) {
    return (
      <Layout>
        <div className="bg-muted/30 border-b border-border">
          <div className="container mx-auto px-4 py-10 sm:py-14">
            <div className="flex flex-col-reverse sm:flex-row gap-8 items-start">
              <div className="flex-1 space-y-4">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-12 w-3/4" />
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-1/3" />
                <div className="flex gap-2 pt-2">
                  <Skeleton className="h-6 w-24 rounded-full" />
                  <Skeleton className="h-6 w-28 rounded-full" />
                </div>
                <div className="flex gap-3 pt-2">
                  <Skeleton className="h-10 w-36 rounded-md" />
                  <Skeleton className="h-10 w-36 rounded-md" />
                </div>
              </div>
              <Skeleton className="h-40 w-40 rounded-2xl shrink-0" />
            </div>
          </div>
        </div>
        <div className="container mx-auto px-4 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            <div className="lg:col-span-2 space-y-8">
              <Skeleton className="h-48 w-full rounded-xl" />
              <Skeleton className="h-48 w-full rounded-xl" />
            </div>
            <div className="space-y-5">
              <Skeleton className="h-52 w-full rounded-xl" />
              <Skeleton className="h-72 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !profile) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
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
    : fillCopy(
        locationName
          ? siteConfig.pages.profile.seoDescriptionWithLocation
          : siteConfig.pages.profile.seoDescriptionNoLocation,
      )
        .replace("{name}", profile.name)
        .replace("{location}", locationName);

  const locationSlug = profile.location ? `${profile.location.postcode}-${profile.location.slug}` : null;
  const categoryInLocation =
    profile.category && profile.location ? `${profile.category.name} in ${profile.location.name}` : null;

  const breadcrumbItems = [
    { name: "Home", url: "/" },
    { name: fillCopy(siteConfig.pages.profile.breadcrumbSearchLabel), url: "/zoek" },
  ];
  if (profile.location) {
    breadcrumbItems.push({ name: profile.location.name, url: `/zoek/${locationSlug}` });
  }
  if (categoryInLocation && locationSlug) {
    breadcrumbItems.push({ name: categoryInLocation, url: `/zoek/${locationSlug}/${profile.category!.slug}` });
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
        ? [
            {
              street: office.street ?? null,
              number: office.number ?? null,
              town: office.town ?? office.municipality ?? null,
              postcode: office.postcode ?? null,
              province: office.province ?? null,
              latitude: typeof office.latitude === "number" ? office.latitude : null,
              longitude: typeof office.longitude === "number" ? office.longitude : null,
            },
          ]
        : undefined,
      experienceYears: profile.practical?.experienceYears,
      specializations: profile.specializations || undefined,
      specializationLabels: profile.specializations?.map((slug: string) => specLabels[slug]).filter(Boolean),
      languages: Array.isArray(profile.practical?.languages) ? profile.practical.languages : undefined,
      hourlyRateEur: typeof profile.practical?.tariff === "number" ? profile.practical.tariff : null,
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
              <strong>Voorbeeldweergave</strong> — Dit profiel is nog niet zichtbaar voor bezoekers. Alleen jij kan het
              bekijken als eigenaar.
            </span>
            <Link href="/dashboard/profielen" className="ml-auto text-amber-700 underline text-xs whitespace-nowrap">
              ← Terug naar dashboard
            </Link>
          </div>
        </div>
      )}

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <div className="bg-muted/30 border-b border-border">
        <div className="container mx-auto px-4 pt-6 pb-10 sm:pt-8 sm:pb-14">

          {/* Breadcrumb */}
          <Breadcrumb className="mb-8">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/" data-testid="breadcrumb-home">Home</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/zoek" data-testid="breadcrumb-search">
                    {fillCopy(siteConfig.pages.profile.breadcrumbSearchLabel)}
                  </Link>
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

          {/* Identity row */}
          <div className="flex flex-col-reverse sm:flex-row gap-8 sm:gap-12 items-start">

            {/* Left: name, tagline, location, specs, CTAs */}
            <div className="flex-1 min-w-0">

              {/* Name + badge */}
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight" data-testid="text-profile-name">
                  {profile.name}
                </h1>
                {profile.isVerified && (
                  <Badge className="gap-1.5 shrink-0 self-center text-sm px-3 py-1">
                    <CheckCircle className="h-3.5 w-3.5" />
                    Geverifieerd
                  </Badge>
                )}
              </div>

              {/* Tagline / intro */}
              {cleanIntroduction && (
                <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed mb-4" data-testid="text-profile-tagline">
                  {cleanIntroduction}
                </p>
              )}

              {/* Location */}
              {(profile.location || office) && (
                <div className="flex items-center gap-2 text-muted-foreground mb-5">
                  <MapPin className="h-4 w-4 shrink-0 text-primary" />
                  <span className="text-base" data-testid="text-profile-location">
                    {office && !profile.hideAddress && office.street
                      ? `${office.street} ${office.number ?? ""}`.trim() + ", "
                      : ""}
                    {office?.postcode ?? ""} {office?.municipality || office?.town || profile.location?.name || ""}
                  </span>
                </div>
              )}

              {/* Specializations */}
              {profile.specializations && profile.specializations.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-7">
                  {profile.specializations.map((spec: string) => {
                    const slug = specKeyToSlug[spec] || spec;
                    return (
                      <Link key={spec} href={`/zoek/${slug}`}>
                        <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80 transition-colors text-sm px-3 py-1">
                          {specLabels[spec] || spec}
                        </Badge>
                      </Link>
                    );
                  })}
                </div>
              )}

              {/* CTA buttons */}
              <div className="flex flex-wrap gap-3">
                {profile.telnr && (
                  <a href={`tel:${profile.telnr}`} data-testid="link-phone-hero">
                    <Button size="lg" className="gap-2 h-12 px-6 text-base font-semibold shadow-sm">
                      <Phone className="h-5 w-5" />
                      {profile.telnr}
                    </Button>
                  </a>
                )}
                {profile.email && (
                  <a href={`mailto:${profile.email}`} data-testid="link-email-hero">
                    <Button size="lg" variant="outline" className="gap-2 h-12 px-6 text-base bg-white shadow-sm">
                      <Mail className="h-5 w-5" />
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
                    <Button size="lg" variant="outline" className="gap-2 h-12 px-6 text-base bg-white shadow-sm">
                      <Globe className="h-5 w-5" />
                      Website
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </a>
                )}
              </div>
            </div>

            {/* Right: avatar */}
            <div className="shrink-0">
              <Avatar
                className="h-32 w-32 sm:h-44 sm:w-44 rounded-2xl border-2 border-white shadow-md"
                data-testid="img-profile-avatar"
              >
                <AvatarImage src={profile.logoUrl || undefined} alt={profile.name} className="object-cover" />
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-4xl sm:text-5xl rounded-2xl">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </div>

      {/* ── Content grid ──────────────────────────────────────────────────────── */}
      <div className="bg-muted/20 min-h-screen">
        <div className="container mx-auto px-4 py-10 sm:py-14">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 items-start">

            {/* ── Main: 2/3 ─────────────────────────────────────────────── */}
            <div className="lg:col-span-2 space-y-6">

              {/* Description */}
              {profile.description && (
                <ProfileCard title={`Over ${profile.name}`} testId="card-profile-description">
                  {profile.description.startsWith("<") ? (
                    <div
                      className="rich-text-content text-muted-foreground leading-relaxed prose prose-sm max-w-none"
                      data-testid="text-profile-description"
                      dangerouslySetInnerHTML={{ __html: profile.description }}
                    />
                  ) : (
                    <div className="text-muted-foreground" data-testid="text-profile-description">
                      {profile.description.split("\n").map((paragraph: string, i: number) => (
                        <p key={i} className="mb-4 last:mb-0 leading-relaxed text-base">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  )}
                </ProfileCard>
              )}

              {/* Portfolio */}
              {portfolio.length > 0 && <PortfolioShowcase projects={portfolio} />}

              {/* Practical info */}
              <PracticalInfoSection practical={profile.practical} />
            </div>

            {/* ── Sidebar: 1/3 ──────────────────────────────────────────── */}
            <div className="space-y-6 lg:sticky lg:top-6">

              {/* Contact card */}
              <Card className="overflow-hidden shadow-sm" data-testid="card-profile-contact-info">
                <div className="bg-primary px-6 py-4">
                  <h2 className="text-base font-semibold text-primary-foreground">Contactgegevens</h2>
                </div>
                <CardContent className="p-0">
                  {profile.telnr && (
                    <a
                      href={`tel:${profile.telnr}`}
                      className="flex items-center gap-4 px-6 py-4 hover:bg-muted/50 transition-colors border-b border-border"
                      data-testid="link-phone"
                    >
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Phone className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Telefoon</p>
                        <p className="font-semibold text-sm">{profile.telnr}</p>
                      </div>
                    </a>
                  )}
                  {profile.email && (
                    <a
                      href={`mailto:${profile.email}`}
                      className="flex items-center gap-4 px-6 py-4 hover:bg-muted/50 transition-colors border-b border-border"
                      data-testid="link-email"
                    >
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Mail className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">E-mail</p>
                        <p className="font-semibold text-sm truncate">{profile.email}</p>
                      </div>
                    </a>
                  )}
                  {profile.hasWebsite && profile.website && (
                    <a
                      href={profile.website.match(/^https?:\/\//) ? profile.website : `https://${profile.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-4 px-6 py-4 hover:bg-muted/50 transition-colors border-b border-border"
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
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Globe className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Website</p>
                        <p className="font-semibold text-sm truncate">
                          {profile.website.replace(/^https?:\/\//, "")}
                        </p>
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
                    </a>
                  )}
                  {office && (
                    <div className="flex items-start gap-4 px-6 py-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <MapPin className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Locatie</p>
                        {!profile.hideAddress && office.street && (
                          <p className="font-semibold text-sm">
                            {office.street} {office.number}
                          </p>
                        )}
                        <p className={`text-sm ${profile.hideAddress ? "font-semibold" : "text-muted-foreground"}`}>
                          {office.postcode} {office.municipality || office.town}
                        </p>
                        <p className="text-muted-foreground text-sm">{siteConfig.country}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Contact form */}
              <ContactForm profileId={profile.id} profileName={profile.name} />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

/* ── Reusable card wrapper ──────────────────────────────────────────────────── */
function ProfileCard({
  title,
  testId,
  children,
}: {
  title: string;
  testId?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="overflow-hidden shadow-sm" data-testid={testId}>
      <div className="border-b border-border px-6 py-4">
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      <CardContent className="px-6 py-6">{children}</CardContent>
    </Card>
  );
}

/* ── Practical info ─────────────────────────────────────────────────────────── */
function PracticalInfoSection({ practical }: { practical: any }) {
  const { questions } = usePracticalQuestions();
  if (!practical || !questions.length) return null;

  const ICONS: Record<string, any> = {
    experienceYears: Clock,
    languages: Languages,
    tariff: Euro,
    acceptedPaymentMethods: CreditCard,
    priceRange: Euro,
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
    <Card className="overflow-hidden shadow-sm" data-testid="card-profile-practical">
      <div className="border-b border-border px-6 py-4">
        <h2 className="text-lg font-semibold">Praktische informatie</h2>
      </div>
      <CardContent className="p-0">
        {rows.map(({ q, display }, index) => {
          const Icon = ICONS[q.camelKey] || Briefcase;
          return (
            <div
              key={q.id}
              className={`flex items-center gap-4 px-6 py-4 ${index < rows.length - 1 ? "border-b border-border" : ""}`}
              data-testid={`practical-${q.camelKey}`}
            >
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                <span className="text-sm text-muted-foreground">{q.name}</span>
                <span className="font-semibold text-sm sm:text-right">{display}</span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

/* ── Portfolio showcase ─────────────────────────────────────────────────────── */
function PortfolioShowcase({ projects }: { projects: PortfolioProject[] }) {
  const [activePhoto, setActivePhoto] = useState<{ projectId: string; index: number } | null>(null);

  if (!projects.length) return null;

  return (
    <Card className="overflow-hidden shadow-sm" data-testid="section-portfolio">
      <div className="border-b border-border px-6 py-4">
        <h2 className="text-lg font-semibold">Projecten</h2>
      </div>
      <CardContent className="px-6 py-6">
        <div className="space-y-8">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              activePhotoIndex={activePhoto?.projectId === project.id ? activePhoto.index : null}
              onPhotoClick={(index) => setActivePhoto({ projectId: project.id, index })}
              onClosePhoto={() => setActivePhoto(null)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ProjectCard({
  project,
  activePhotoIndex,
  onPhotoClick,
  onClosePhoto,
}: {
  project: PortfolioProject;
  activePhotoIndex: number | null;
  onPhotoClick: (i: number) => void;
  onClosePhoto: () => void;
}) {
  const photos = project.imageUrls || [];
  const hasPhotos = photos.length > 0;

  const prev = () => {
    if (activePhotoIndex === null) return;
    onPhotoClick((activePhotoIndex - 1 + photos.length) % photos.length);
  };
  const next = () => {
    if (activePhotoIndex === null) return;
    onPhotoClick((activePhotoIndex + 1) % photos.length);
  };

  return (
    <div className="rounded-xl border border-border overflow-hidden bg-white" data-testid={`showcase-project-${project.id}`}>
      {hasPhotos && (
        <div className="relative">
          {photos.length === 1 ? (
            <div className="aspect-video cursor-zoom-in" onClick={() => onPhotoClick(0)}>
              <img
                src={photos[0]}
                alt={project.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                crossOrigin="anonymous"
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 max-h-64 overflow-hidden">
              {photos.slice(0, 5).map((url, i) => (
                <div
                  key={url}
                  className={`relative overflow-hidden cursor-zoom-in ${i === 0 && photos.length >= 2 ? "row-span-2 sm:row-span-1" : ""}`}
                  onClick={() => onPhotoClick(i)}
                >
                  <img
                    src={url}
                    alt=""
                    className="w-full h-full object-cover min-h-[8rem]"
                    referrerPolicy="no-referrer"
                    crossOrigin="anonymous"
                  />
                  {i === 4 && photos.length > 5 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-semibold text-lg">
                      +{photos.length - 5}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          {activePhotoIndex !== null && (
            <div
              className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
              onClick={onClosePhoto}
            >
              <button
                onClick={(e) => { e.stopPropagation(); prev(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <img
                src={photos[activePhotoIndex]}
                alt=""
                className="max-h-[85vh] max-w-[90vw] object-contain rounded-md"
                onClick={(e) => e.stopPropagation()}
                referrerPolicy="no-referrer"
                crossOrigin="anonymous"
              />
              <button
                onClick={(e) => { e.stopPropagation(); next(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
              <button
                onClick={onClosePhoto}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors text-sm"
              >
                ✕
              </button>
              {photos.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-sm">
                  {activePhotoIndex + 1} / {photos.length}
                </div>
              )}
            </div>
          )}
        </div>
      )}
      <div className="p-5">
        <h3 className="font-semibold text-base mb-3">{project.title}</h3>
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
          {project.priceEur != null && (
            <span className="flex items-center gap-1.5">
              <Euro className="h-3.5 w-3.5" />€ {project.priceEur.toLocaleString("nl-BE")}
            </span>
          )}
          {project.durationDays != null && (
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {project.durationDays} {project.durationDays === 1 ? "werkdag" : "werkdagen"}
            </span>
          )}
          {project.completedAt && (
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {new Date(project.completedAt).toLocaleDateString("nl-BE", { month: "long", year: "numeric" })}
            </span>
          )}
        </div>
        {project.description && (
          <p className="text-sm text-muted-foreground leading-relaxed">{project.description}</p>
        )}
        {project.workDetails && (
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{project.workDetails}</p>
        )}
      </div>
    </div>
  );
}
