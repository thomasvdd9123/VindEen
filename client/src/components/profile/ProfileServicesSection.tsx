import { useMemo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { useSpecializationMap } from "@/lib/useSpecializations";

export interface ServicesValues {
  mainCategories: string[];
  specializations: string[];
}

interface Props {
  value: ServicesValues;
  onChange: (mainCategories: string[], specializations: string[]) => void;
}

export function ProfileServicesSection({ value, onChange }: Props) {
  const { mainCategoryLabels, specializationsByCategory, serviceCategories, labelByKey } = useSpecializationMap();

  const mainCategoryDescriptions = useMemo(() => {
    const m: Record<string, string> = {};
    serviceCategories.forEach(c => { m[c.slug] = c.description || ""; });
    return m;
  }, [serviceCategories]);

  const toggleCategory = (slug: string, checked: boolean) => {
    let nextCats: string[];
    let nextSpecs = value.specializations;
    if (checked) {
      nextCats = [...value.mainCategories, slug];
    } else {
      nextCats = value.mainCategories.filter(c => c !== slug);
      const categorySpecs = specializationsByCategory[slug] || [];
      nextSpecs = nextSpecs.filter(s => !categorySpecs.includes(s));
    }
    onChange(nextCats, nextSpecs);
  };

  const toggleSpec = (spec: string, checked: boolean) => {
    const nextSpecs = checked
      ? [...value.specializations, spec]
      : value.specializations.filter(s => s !== spec);
    onChange(value.mainCategories, nextSpecs);
  };

  return (
    <div className="space-y-6">
      {/* Main categories */}
      <div className="space-y-6">
        <div className="border-b pb-2">
          <h3 className="text-lg font-semibold">Categorieën</h3>
          <p className="text-sm text-muted-foreground">
            In welk type tuinwerk ben je gespecialiseerd?
          </p>
        </div>

        <div>
          <p className="text-sm font-medium mb-1">Selecteer je hoofdcategorieën</p>
          <p className="text-sm text-muted-foreground mb-3">
            Je kunt beide categorieën selecteren als je in beide actief bent
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.entries(mainCategoryLabels).map(([slug, label]) => {
              const isSelected = value.mainCategories.includes(slug);
              return (
                <label
                  key={slug}
                  htmlFor={`main-cat-${slug}`}
                  className={`relative rounded-lg border-2 p-4 cursor-pointer transition-colors block ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-muted hover:border-muted-foreground/50"
                  }`}
                  data-testid={`card-main-cat-${slug.toLowerCase()}`}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id={`main-cat-${slug}`}
                      checked={isSelected}
                      onCheckedChange={checked => toggleCategory(slug, !!checked)}
                      className="mt-1"
                      data-testid={`checkbox-main-cat-${slug.toLowerCase()}`}
                    />
                    <div className="flex-1">
                      <span className="text-base font-medium">{label}</span>
                      <p className="text-sm text-muted-foreground mt-1">
                        {mainCategoryDescriptions[slug] || ""}
                      </p>
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      </div>

      {/* Specializations per category */}
      {value.mainCategories.length === 0 ? (
        <div className="space-y-6">
          <div className="border-b pb-2">
            <h3 className="text-lg font-semibold text-muted-foreground">Specialisaties</h3>
            <p className="text-sm text-muted-foreground">
              Selecteer eerst een hoofdcategorie hierboven
            </p>
          </div>
          <div className="rounded-lg border border-dashed p-6 text-center">
            <p className="text-muted-foreground">
              Selecteer eerst een hoofdcategorie om je specialisaties te kiezen
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="border-b pb-2">
            <h3 className="text-lg font-semibold">Specialisaties</h3>
            <p className="text-sm text-muted-foreground">
              Selecteer je specifieke specialisaties per categorie
            </p>
          </div>
          {value.mainCategories.map(cat => (
            <div key={cat} className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary" />
                <h4 className="font-medium">{mainCategoryLabels[cat]}</h4>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pl-4 border-l-2 border-primary/20">
                {(specializationsByCategory[cat] || []).map(spec => (
                  <div key={spec} className="flex items-center space-x-2">
                    <Checkbox
                      id={`spec-${spec}`}
                      checked={value.specializations.includes(spec)}
                      onCheckedChange={checked => toggleSpec(spec, !!checked)}
                      data-testid={`checkbox-spec-${spec.toLowerCase()}`}
                    />
                    <label htmlFor={`spec-${spec}`} className="text-sm cursor-pointer">
                      {labelByKey[spec] || spec}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
