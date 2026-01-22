import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search, 
  SlidersHorizontal,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import type { Category, Location } from "@shared/schema";

interface SearchBoxProps {
  categories: Category[];
  locations: Location[];
  initialCategory?: string;
  initialLocation?: string;
  initialQuery?: string;
  variant?: "hero" | "compact";
  showCount?: boolean;
}

// Specialization options for tuinmannen
const SPECIALIZATIONS = [
  { value: "all", label: "Ondersteuning bij (alle)" },
  { value: "TUINAANLEG", label: "Tuinaanleg" },
  { value: "ONDERHOUD", label: "Tuinonderhoud" },
  { value: "SNOEIWERK", label: "Snoeiwerk" },
  { value: "BESTRATING", label: "Bestrating" },
  { value: "VIJVERS", label: "Vijvers & waterpartijen" },
  { value: "GAZON", label: "Gazonaanleg" },
  { value: "BEPLANTING", label: "Beplanting" },
  { value: "AFSLUITINGEN", label: "Afsluitingen & hagen" },
];


export function SearchBox({ 
  categories, 
  locations, 
  initialCategory,
  initialLocation,
  initialQuery = "",
  variant = "hero",
  showCount = true,
}: SearchBoxProps) {
  const [, navigate] = useLocation();
  const [cityQuery, setCityQuery] = useState(initialLocation || "");
  const [selectedCategory, setSelectedCategory] = useState(initialCategory || "all");
  const [selectedSpecialization, setSelectedSpecialization] = useState("all");
  const [keyword, setKeyword] = useState(initialQuery);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([]);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);

  // Fetch total count for the button based on current filters
  const countParams = new URLSearchParams();
  if (selectedCategory && selectedCategory !== "all") {
    countParams.set("category", selectedCategory);
  }
  if (selectedSpecialization && selectedSpecialization !== "all") {
    countParams.set("spec", selectedSpecialization);
  }
  // Find location slug for count
  const selectedLocation = locations.find(
    (loc) =>
      loc.name.toLowerCase() === cityQuery.toLowerCase() ||
      loc.postcode === cityQuery ||
      loc.slug === cityQuery.toLowerCase()
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

  // Filter locations based on input
  useEffect(() => {
    if (cityQuery.length > 0) {
      const filtered = locations.filter(
        (loc) =>
          loc.name.toLowerCase().includes(cityQuery.toLowerCase()) ||
          loc.postcode.includes(cityQuery) ||
          loc.municipality.toLowerCase().includes(cityQuery.toLowerCase())
      );
      setFilteredLocations(filtered.slice(0, 6));
      setShowLocationDropdown(filtered.length > 0 && cityQuery.length >= 2);
    } else {
      setFilteredLocations([]);
      setShowLocationDropdown(false);
    }
  }, [cityQuery, locations]);

  const handleSearch = () => {
    const categorySlug = selectedCategory !== "all" ? selectedCategory : "tuinaanlegger";
    const locationMatch = locations.find(
      (loc) =>
        loc.name.toLowerCase() === cityQuery.toLowerCase() ||
        loc.postcode === cityQuery ||
        loc.slug === cityQuery.toLowerCase()
    );

    let url = `/zoek/${categorySlug}`;
    if (locationMatch) {
      url += `/${locationMatch.slug}`;
    }

    const params = new URLSearchParams();
    if (keyword) params.set("q", keyword);
    if (selectedSpecialization !== "all") params.set("spec", selectedSpecialization);

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    navigate(url);
  };

  const selectLocation = (loc: Location) => {
    setCityQuery(loc.name);
    setShowLocationDropdown(false);
  };

  if (variant === "compact") {
    return (
      <div className="bg-card/80 backdrop-blur border-b border-border sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <div className="relative flex-1 w-full sm:max-w-xs">
              <Input
                type="text"
                placeholder="Stad of gemeente"
                value={cityQuery}
                onChange={(e) => setCityQuery(e.target.value)}
                className="w-full"
                data-testid="input-city-compact"
              />
              {showLocationDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-md shadow-lg z-50 max-h-48 overflow-y-auto">
                  {filteredLocations.map((loc) => (
                    <button
                      key={loc.id}
                      className="w-full text-left px-4 py-2 hover:bg-muted transition-colors text-sm"
                      onClick={() => selectLocation(loc)}
                      data-testid={`location-option-${loc.slug}`}
                    >
                      <span className="font-medium">{loc.name}</span>
                      <span className="text-muted-foreground ml-2">{loc.postcode}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-category-compact">
                <SelectValue placeholder="Categorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle categorieën</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.slug}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

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
      <div className="bg-card/95 backdrop-blur rounded-lg border border-border shadow-xl p-4 sm:p-6">
        {/* Row 1: City/Postcode input + Search button */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Input
              type="text"
              placeholder="Stad of gemeente"
              value={cityQuery}
              onChange={(e) => setCityQuery(e.target.value)}
              className="w-full h-11 text-base pl-4"
              data-testid="input-city-hero"
              onFocus={() => cityQuery.length >= 2 && setShowLocationDropdown(true)}
              onBlur={() => setTimeout(() => setShowLocationDropdown(false), 200)}
            />
            {showLocationDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
                {filteredLocations.map((loc) => (
                  <button
                    key={loc.id}
                    className="w-full text-left px-4 py-3 hover:bg-muted transition-colors border-b border-border last:border-b-0"
                    onClick={() => selectLocation(loc)}
                    data-testid={`hero-location-option-${loc.slug}`}
                  >
                    <span className="font-medium">{loc.name}</span>
                    <span className="text-muted-foreground ml-2 text-sm">{loc.postcode} - {loc.municipality}</span>
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

        {/* Row 2: Category + Specialization filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-[220px] h-10" data-testid="select-category-hero">
              <SelectValue placeholder="Categorie (alle)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Categorie (alle)</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.slug} data-testid={`category-option-${cat.slug}`}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedSpecialization} onValueChange={setSelectedSpecialization}>
            <SelectTrigger className="w-full sm:w-[220px] h-10" data-testid="select-specialization-hero">
              <SelectValue placeholder="Ondersteuning bij (alle)" />
            </SelectTrigger>
            <SelectContent>
              {SPECIALIZATIONS.map((spec) => (
                <SelectItem key={spec.value} value={spec.value} data-testid={`spec-option-${spec.value}`}>
                  {spec.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors ml-auto"
            data-testid="button-advanced-filter"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Verfijn je zoekopdracht
            {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>

        {/* Advanced filters (expandable) - keyword search */}
        {showAdvanced && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Zoek op trefwoord (bedrijfsnaam, diensten, etc.)"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="h-10"
                  data-testid="input-keyword"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
