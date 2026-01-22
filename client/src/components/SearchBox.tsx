import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MapPin, Briefcase } from "lucide-react";
import type { Category, Location } from "@shared/schema";

interface SearchBoxProps {
  categories: Category[];
  locations: Location[];
  initialCategory?: string;
  initialLocation?: string;
  variant?: "hero" | "compact";
}

export function SearchBox({ 
  categories, 
  locations, 
  initialCategory, 
  initialLocation,
  variant = "hero" 
}: SearchBoxProps) {
  const [, setLocation] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState(initialCategory || "");
  const [selectedLocation, setSelectedLocation] = useState(initialLocation || "");

  const handleSearch = () => {
    if (selectedCategory && selectedLocation) {
      setLocation(`/vind-een-${selectedCategory}/${selectedLocation}`);
    } else if (selectedCategory) {
      setLocation(`/vind-een-${selectedCategory}`);
    }
  };

  if (variant === "compact") {
    return (
      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-[200px]" data-testid="select-category">
            <Briefcase className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Categorie" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.slug} data-testid={`option-category-${cat.slug}`}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedLocation} onValueChange={setSelectedLocation}>
          <SelectTrigger className="w-full sm:w-[200px]" data-testid="select-location">
            <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Locatie" />
          </SelectTrigger>
          <SelectContent>
            {locations.map((loc) => (
              <SelectItem key={loc.id} value={loc.slug} data-testid={`option-location-${loc.slug}`}>
                {loc.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button onClick={handleSearch} className="gap-2" data-testid="button-search">
          <Search className="h-4 w-4" />
          Zoeken
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border p-4 sm:p-6 shadow-lg">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-primary" />
            Welk type tuinman zoek je?
          </label>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger data-testid="hero-select-category">
              <SelectValue placeholder="Selecteer een categorie..." />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.slug} data-testid={`hero-option-category-${cat.slug}`}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            In welke regio?
          </label>
          <Select value={selectedLocation} onValueChange={setSelectedLocation}>
            <SelectTrigger data-testid="hero-select-location">
              <SelectValue placeholder="Selecteer een locatie..." />
            </SelectTrigger>
            <SelectContent>
              {locations.map((loc) => (
                <SelectItem key={loc.id} value={loc.slug} data-testid={`hero-option-location-${loc.slug}`}>
                  {loc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-end">
          <Button 
            onClick={handleSearch} 
            className="w-full gap-2 h-10"
            size="lg"
            data-testid="hero-button-search"
          >
            <Search className="h-4 w-4" />
            Zoek tuinmannen
          </Button>
        </div>
      </div>
    </div>
  );
}
