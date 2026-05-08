import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MapPin } from "lucide-react";
import type { Location } from "@shared/schema";
import { siteConfig, fillCopy } from "@/lib/theme.config";
import { useSpecializationMap } from "@/lib/useSpecializations";

// ─── Fuzzy location matching ──────────────────────────────────────────────────

/** Normalize: lowercase, trim, strip diacritics (é→e, ë→e, etc.) */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/** Simple Levenshtein distance */
function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[] = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const temp = dp[j];
      dp[j] = a[i - 1] === b[j - 1] ? prev : 1 + Math.min(prev, dp[j], dp[j - 1]);
      prev = temp;
    }
  }
  return dp[n];
}

/**
 * Score a location against a query. Higher = better match.
 * Returns 0 if no reasonable match.
 */
function scoreLocation(loc: Location, rawQuery: string): number {
  const q = normalize(rawQuery);
  if (q.length < 2) return 0;

  const name = normalize(loc.name);
  const muni = normalize(loc.municipality ?? "");
  const pc = loc.postcode;

  // Postcode: exact or prefix match
  if (pc === rawQuery.trim() || pc.startsWith(rawQuery.trim())) return 100;

  // Exact name/municipality match
  if (name === q || muni === q) return 95;

  // Starts-with match on name or municipality
  if (name.startsWith(q) || muni.startsWith(q)) return 80;

  // Word-level starts-with (e.g. "bertem" matches "Sint-Agatha-Berchem")
  const words = name.split(/[\s\-]+/);
  const muniWords = muni.split(/[\s\-]+/);
  for (const w of [...words, ...muniWords]) {
    if (w.startsWith(q)) return 72;
  }

  // Contains match
  if (name.includes(q) || muni.includes(q)) return 60;

  // Fuzzy: compare query against the beginning of name (same length + 1)
  const namePrefix = name.substring(0, q.length + 1);
  const dist = levenshtein(q, namePrefix);
  if (dist <= 1) return 50;
  if (dist <= 2 && q.length >= 4) return 30;

  // Fuzzy per word
  for (const w of [...words, ...muniWords]) {
    if (w.length < 2) continue;
    const d = levenshtein(q, w.substring(0, q.length + 1));
    if (d <= 1) return 45;
    if (d <= 2 && q.length >= 5) return 25;
  }

  return 0;
}

/** Find best fuzzy-matched location from list (returns undefined if no good match) */
function bestMatch(locations: Location[], rawQuery: string): Location | undefined {
  const q = normalize(rawQuery);
  if (q.length < 2) return undefined;
  let best: Location | undefined;
  let bestScore = 0;
  for (const loc of locations) {
    const score = scoreLocation(loc, rawQuery);
    if (score > bestScore) { bestScore = score; best = loc; }
  }
  return bestScore >= 30 ? best : undefined;
}

interface SearchBoxProps {
  locations: Location[];
  initialCategory?: string;
  initialSpecialization?: string;
  initialLocation?: string;
  initialQuery?: string;
  variant?: "hero" | "compact";
  showCount?: boolean;
}

export function SearchBox({ 
  locations, 
  initialCategory,
  initialSpecialization,
  initialLocation,
  initialQuery = "",
  variant = "hero",
  showCount = true,
}: SearchBoxProps) {
  const [, navigate] = useLocation();
  const [cityQuery, setCityQuery] = useState(initialLocation || "");
  const [selectedMainCategory, setSelectedMainCategory] = useState(initialCategory || "all");
  const [selectedSpecialization, setSelectedSpecialization] = useState(initialSpecialization || "all");

  // CategoryPage may resolve initialSpecialization async (slug→key map). Sync local state when prop changes.
  useEffect(() => {
    if (initialSpecialization && initialSpecialization !== selectedSpecialization) {
      setSelectedSpecialization(initialSpecialization);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSpecialization]);
  const [keyword, setKeyword] = useState(initialQuery);
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([]);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [isUserTyping, setIsUserTyping] = useState(false); // Track if user is actively typing

  // Vertical-agnostic catalog from normalized /api/specializations +
  // /api/service-categories (no dependency on legacy grouped endpoint).
  const {
    mainCategoryLabels,
    labelByKey: specializationLabels,
    specializationsByCategory,
    keyToSlug: specKeyToSlug,
  } = useSpecializationMap();

  // Get available specializations based on selected main category
  const availableSpecializations = selectedMainCategory !== "all" 
    ? specializationsByCategory[selectedMainCategory] || []
    : [];

  // Reset specialization when main category changes
  const handleMainCategoryChange = (value: string) => {
    setSelectedMainCategory(value);
    // Always reset specialization when category changes
    setSelectedSpecialization("all");
  };

  // Fetch total count for the button based on current filters
  const countParams = new URLSearchParams();
  if (selectedMainCategory && selectedMainCategory !== "all") {
    countParams.set("mainCategory", selectedMainCategory);
  }
  if (selectedSpecialization && selectedSpecialization !== "all") {
    countParams.set("spec", selectedSpecialization);
  }
  // Find location slug for count
  const selectedLocation = bestMatch(locations, cityQuery);
  if (selectedLocation) {
    countParams.set("location", selectedLocation.slug);
  }
  if (keyword) {
    countParams.set("q", keyword);
  }
  
  const countQueryString = countParams.toString();
  const countUrl = countQueryString 
    ? `/api/profiles/count?${countQueryString}`
    : "/api/profiles/count";
  const { data: searchData } = useQuery<{ total: number }>({
    queryKey: [countUrl],
    enabled: true,
  });

  const totalCount = searchData?.total || 0;

  // Filter locations with fuzzy scoring — only show dropdown if user is actively typing
  useEffect(() => {
    if (cityQuery.length > 0 && isUserTyping) {
      const scored = locations
        .map((loc) => ({ loc, score: scoreLocation(loc, cityQuery) }))
        .filter(({ score }) => score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 6)
        .map(({ loc }) => loc);
      setFilteredLocations(scored);
      setShowLocationDropdown(scored.length > 0 && cityQuery.trim().length >= 2);
    } else {
      setFilteredLocations([]);
      setShowLocationDropdown(false);
    }
  }, [cityQuery, locations, isUserTyping]);

  const handleSearch = () => {
    // New URL structure:
    // /zoek/{postcode-city} - location only
    // /zoek/{postcode-city}/{specialization-slug} - location + specialization
    // /zoek/{specialization-slug} - specialization only

    const locationMatch = bestMatch(locations, cityQuery);

    const specSlug = selectedSpecialization && selectedSpecialization !== "all" 
      ? specKeyToSlug[selectedSpecialization] 
      : null;

    let url = "/zoek/alle";
    
    if (locationMatch) {
      // Location-first URL: /zoek/{postcode}-{city}
      url = `/zoek/${locationMatch.postcode}-${locationMatch.slug}`;
      if (specSlug) {
        url += `/${specSlug}`;
      }
    } else if (specSlug) {
      // Specialization-only URL: /zoek/{specialization}
      url = `/zoek/${specSlug}`;
    }
    // If nothing selected, url stays "/zoek/alle" to show all results

    const params = new URLSearchParams();
    if (keyword) params.set("q", keyword);
    // Add main category as query param (not in URL path)
    if (selectedMainCategory && selectedMainCategory !== "all") {
      params.set("cat", selectedMainCategory);
    }

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    navigate(url);
  };

  const selectLocation = (loc: Location) => {
    setCityQuery(loc.name);
    setShowLocationDropdown(false);
    setIsUserTyping(false); // Stop showing dropdown after selection
  };

  const handleCityInputChange = (value: string) => {
    setCityQuery(value);
    setIsUserTyping(true); // User is typing, show dropdown
  };

  if (variant === "compact") {
    return (
      <div className="bg-card/80 backdrop-blur border-b border-border sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <div className="relative flex-1 w-full sm:max-w-xs">
              <Input
                type="text"
                placeholder="Postcode of stad"
                value={cityQuery}
                onChange={(e) => handleCityInputChange(e.target.value)}
                className="w-full"
                data-testid="input-city-compact"
              />
              {showLocationDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-md shadow-lg z-50 max-h-48 overflow-y-auto">
                  {filteredLocations.map((loc) => (
                    <button
                      key={loc.id}
                      type="button"
                      className="w-full text-left px-4 py-2 hover:bg-muted transition-colors text-sm flex items-center gap-2"
                      onClick={() => selectLocation(loc)}
                      data-testid={`location-option-${loc.slug}`}
                    >
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                      <span className="font-semibold">{loc.postcode}</span>
                      <span className="font-medium">{loc.name}</span>
                      {loc.municipality !== loc.name && (
                        <span className="text-muted-foreground">({loc.municipality})</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Main Category */}
            <Select value={selectedMainCategory} onValueChange={handleMainCategoryChange}>
              <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-main-category-compact">
                <SelectValue placeholder="Type werk" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle types</SelectItem>
                {Object.entries(mainCategoryLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Specialization sub-filter */}
            {selectedMainCategory !== "all" && availableSpecializations.length > 0 && (
              <Select value={selectedSpecialization} onValueChange={setSelectedSpecialization}>
                <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-specialization-compact">
                  <SelectValue placeholder="Specialisatie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle specialisaties</SelectItem>
                  {availableSpecializations.map((spec) => (
                    <SelectItem key={spec} value={spec}>
                      {specializationLabels[spec] || spec}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Button onClick={handleSearch} className="gap-2 whitespace-nowrap" data-testid="button-search-compact">
              <Search className="h-4 w-4" />
              Zoeken
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Hero variant - matches vind-een-psycholoog.be style
  return (
    <div className="w-full">
      {/* Main search box — wrapped in <form> so Enter in any input triggers search */}
      <form
        onSubmit={(e) => { e.preventDefault(); handleSearch(); }}
        className="bg-card rounded-xl border border-border shadow-lg p-5 sm:p-7"
      >
        {/* Row 1: City/Postcode input + Search button */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Input
              type="text"
              placeholder="Postcode of stad (bv. 9000, Gent)"
              value={cityQuery}
              onChange={(e) => handleCityInputChange(e.target.value)}
              className="w-full h-11 text-base pl-4"
              data-testid="input-city-hero"
              onFocus={() => isUserTyping && cityQuery.length >= 2 && setShowLocationDropdown(true)}
              onBlur={() => setTimeout(() => setShowLocationDropdown(false), 200)}
            />
            {showLocationDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
                {filteredLocations.map((loc) => (
                  <button
                    key={loc.id}
                    type="button"
                    className="w-full text-left px-4 py-3 hover:bg-muted transition-colors border-b border-border last:border-b-0 flex items-center gap-3"
                    onClick={() => selectLocation(loc)}
                    data-testid={`hero-location-option-${loc.slug}`}
                  >
                    <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex items-center gap-2">
                      <span className="font-semibold min-w-[50px]">{loc.postcode}</span>
                      <span className="font-medium">{loc.name}</span>
                      {loc.municipality !== loc.name && (
                        <span className="text-muted-foreground text-sm">({loc.municipality})</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <Button 
            type="submit"
            size="lg" 
            className="h-11 px-8 text-base font-medium whitespace-nowrap"
            data-testid="button-search-hero"
          >
            {showCount && totalCount > 0 
              ? `Toon ${totalCount} ${siteConfig.businessTypePlural}`
              : fillCopy("Zoek {plural}")
            }
          </Button>
        </div>

        {/* Row 2: Category and Specialization filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          {/* Main Category filter */}
          <Select value={selectedMainCategory} onValueChange={handleMainCategoryChange}>
            <SelectTrigger className="w-full sm:w-[200px] h-10" data-testid="select-main-category-hero">
              <SelectValue placeholder="Type werk" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle types</SelectItem>
              {Object.entries(mainCategoryLabels).map(([key, label]) => (
                <SelectItem key={key} value={key} data-testid={`main-category-option-${key.toLowerCase()}`}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Specialization sub-filter - only shown when main category selected */}
          {selectedMainCategory !== "all" && availableSpecializations.length > 0 && (
            <Select value={selectedSpecialization} onValueChange={setSelectedSpecialization}>
              <SelectTrigger className="w-full sm:w-[200px] h-10" data-testid="select-specialization-hero">
                <SelectValue placeholder="Specialisatie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle specialisaties</SelectItem>
                {availableSpecializations.map((spec) => (
                  <SelectItem key={spec} value={spec} data-testid={`specialization-option-${spec.toLowerCase()}`}>
                    {specializationLabels[spec] || spec}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Keyword search */}
          <div className="flex-1 w-full">
            <Input
              type="text"
              placeholder="Zoek op trefwoord (bedrijfsnaam, diensten...)"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="h-10"
              data-testid="input-keyword"
            />
          </div>
        </div>
      </form>
    </div>
  );
}
