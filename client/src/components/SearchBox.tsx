import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MapPin } from "lucide-react";
import type { Location } from "@shared/schema";

// Types for grouped categories API response
interface CategoryOption {
  key: string;
  name: string;
  slug: string;
  description: string | null;
}

interface GroupedCategoriesResponse {
  mainCategories: { key: string; name: string; description: string }[];
  specializations: Record<string, CategoryOption[]>;
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
  const [keyword, setKeyword] = useState(initialQuery);
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([]);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [isUserTyping, setIsUserTyping] = useState(false); // Track if user is actively typing

  // Fetch grouped categories from API
  const { data: groupedCategories } = useQuery<GroupedCategoriesResponse>({
    queryKey: ["/api/categories/grouped"],
  });
  
  // Build lookup objects from API data (memoized for performance)
  const mainCategoryLabels = useMemo(() => {
    return groupedCategories?.mainCategories?.reduce((acc, cat) => {
      acc[cat.key] = cat.name;
      return acc;
    }, {} as Record<string, string>) || { TUINONDERHOUD: "Tuinonderhoud", TUINAANLEG: "Tuinaanleg" };
  }, [groupedCategories]);
  
  const specializationLabels = useMemo(() => {
    return Object.values(groupedCategories?.specializations || {}).flat().reduce((acc, spec) => {
      acc[spec.key] = spec.name;
      return acc;
    }, {} as Record<string, string>) || {};
  }, [groupedCategories]);
  
  const specializationsByCategory = useMemo(() => {
    return groupedCategories?.specializations 
      ? Object.fromEntries(
          Object.entries(groupedCategories.specializations).map(([key, specs]) => [key, specs.map(s => s.key)])
        )
      : { TUINONDERHOUD: [], TUINAANLEG: [] };
  }, [groupedCategories]);

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
  const selectedLocation = locations.find(
    (loc) =>
      loc.name.toLowerCase() === cityQuery.toLowerCase() ||
      loc.postcode === cityQuery ||
      loc.slug === cityQuery.toLowerCase() ||
      // Also match full location slug format like "3060-bertem"
      `${loc.postcode}-${loc.slug}` === cityQuery.toLowerCase()
  );
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

  // Filter locations based on input - only show dropdown if user is actively typing
  useEffect(() => {
    if (cityQuery.length > 0 && isUserTyping) {
      const filtered = locations.filter(
        (loc) =>
          loc.name.toLowerCase().includes(cityQuery.toLowerCase()) ||
          loc.postcode.includes(cityQuery) ||
          (loc.municipality ?? "").toLowerCase().includes(cityQuery.toLowerCase())
      );
      setFilteredLocations(filtered.slice(0, 6));
      setShowLocationDropdown(filtered.length > 0 && cityQuery.length >= 2);
    } else {
      setFilteredLocations([]);
      setShowLocationDropdown(false);
    }
  }, [cityQuery, locations, isUserTyping]);

  // Specialization key to URL slug mapping
  const specKeyToSlug: Record<string, string> = {
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

  const handleSearch = () => {
    // New URL structure:
    // /zoek/{postcode-city} - location only
    // /zoek/{postcode-city}/{specialization-slug} - location + specialization
    // /zoek/{specialization-slug} - specialization only
    
    const locationMatch = locations.find(
      (loc) =>
        loc.name.toLowerCase() === cityQuery.toLowerCase() ||
        loc.postcode === cityQuery ||
        loc.slug === cityQuery.toLowerCase() ||
        // Also match full location slug format like "9000-gent"
        `${loc.postcode}-${loc.slug}` === cityQuery.toLowerCase()
    );

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
      {/* Main search box */}
      <div className="bg-card rounded-xl border border-border shadow-lg p-5 sm:p-7">
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
            onClick={handleSearch} 
            size="lg" 
            className="h-11 px-8 text-base font-medium whitespace-nowrap"
            data-testid="button-search-hero"
          >
            {showCount && totalCount > 0 
              ? `Toon ${totalCount} tuinmannen`
              : "Zoek tuinmannen"
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
      </div>
    </div>
  );
}
