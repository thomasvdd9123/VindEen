import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Phone, Globe, Star, CheckCircle, ArrowRight } from "lucide-react";
import type { ProfileWithRelations } from "@shared/schema";
import { specializationLabels } from "@shared/schema";

// Canonical specialization key -> URL slug mapping (must match CategoryPage)
const specializationSlugMap: Record<string, string> = {
  GRAS_MAAIEN: "gras-maaien",
  SNOEIEN_BOMEN: "bomen-snoeien",
  SNOEIEN_STRUIKEN: "struiken-snoeien",
  HAAG_KNIPPEN: "hagen-knippen",
  ONKRUID_VERWIJDEREN: "onkruid-verwijderen",
  BLADEREN_RUIMEN: "bladeren-ruimen",
  BEMESTING: "bemesting",
  GAZONONDERHOUD: "gazononderhoud",
  GRASAANLEG: "grasaanleg",
  PADEN_TERRASSEN: "paden-terrassen",
  HOUTEN_CONSTRUCTIES: "houten-constructies",
  AFSLUITINGEN: "afsluitingen",
  VIJVERS: "vijvers",
  BESTRATING: "bestrating",
  BEPLANTING: "beplanting",
  IRRIGATIE: "irrigatie",
};

// Get URL slug for a specialization key
function getSpecializationSlug(spec: string): string | null {
  return specializationSlugMap[spec] || null;
}

interface ProfileCardProps {
  profile: ProfileWithRelations;
}

export function ProfileCard({ profile }: ProfileCardProps) {
  const initials = profile.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card className="group hover-elevate transition-all duration-200" data-testid={`card-profile-${profile.id}`}>
      <CardContent className="p-5">
        <div className="flex gap-4">
          <Avatar className="h-16 w-16 border-2 border-primary/10">
            <AvatarImage src={profile.logoUrl || undefined} alt={profile.name} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <Link href={`/bedrijf/${profile.slug}`}>
                  <h3 className="font-semibold text-lg group-hover:text-primary transition-colors truncate" data-testid={`text-profile-name-${profile.id}`}>
                    {profile.name}
                  </h3>
                </Link>
                {profile.title && (
                  <p className="text-sm text-muted-foreground" data-testid={`text-profile-title-${profile.id}`}>
                    {profile.title}
                  </p>
                )}
              </div>
              {profile.isVerified && (
                <Badge variant="secondary" className="shrink-0 gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Geverifieerd
                </Badge>
              )}
            </div>

            {profile.location && (
              <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                <span data-testid={`text-profile-location-${profile.id}`}>{profile.location.name}, {profile.location.region}</span>
              </div>
            )}

            {profile.introduction && (
              <p className="mt-3 text-sm text-muted-foreground line-clamp-2" data-testid={`text-profile-intro-${profile.id}`}>
                {profile.introduction}
              </p>
            )}

            {profile.specializations && profile.specializations.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {profile.specializations.slice(0, 3).map((spec: string) => {
                  const slug = getSpecializationSlug(spec);
                  const badge = (
                    <Badge 
                      variant="outline" 
                      className={`text-xs font-normal ${slug ? 'cursor-pointer' : ''}`}
                      data-testid={`badge-spec-${spec.toLowerCase()}`}
                    >
                      {specializationLabels[spec] || spec}{/* legacy */}
                    </Badge>
                  );
                  return slug ? (
                    <Link key={spec} href={`/zoek/${slug}`}>
                      {badge}
                    </Link>
                  ) : (
                    <span key={spec}>{badge}</span>
                  );
                })}
                {profile.specializations.length > 3 && (
                  <Badge variant="outline" className="text-xs font-normal">
                    +{profile.specializations.length - 3}
                  </Badge>
                )}
              </div>
            )}

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                {profile.telnr && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" />
                    Beschikbaar
                  </span>
                )}
                {profile.hasWebsite && (
                  <span className="flex items-center gap-1">
                    <Globe className="h-3.5 w-3.5" />
                    Website
                  </span>
                )}
              </div>
              <Link href={`/bedrijf/${profile.slug}`}>
                <Button size="sm" variant="ghost" className="gap-1" data-testid={`button-view-profile-${profile.id}`}>
                  Bekijk profiel
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
