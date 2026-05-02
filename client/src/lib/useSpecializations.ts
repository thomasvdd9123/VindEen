import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

interface CategoryOption {
  key: string; // upper-snake e.g. GRAS_MAAIEN
  name: string;
  slug: string; // kebab-case e.g. gras-maaien
  description: string | null;
}

interface GroupedCategoriesResponse {
  mainCategories: { key: string; name: string; description: string }[];
  specializations: Record<string, CategoryOption[]>;
}

// Single source of truth for specialization key/slug/label mapping.
// Used by SearchBox, CategoryPage and anywhere else that needs to convert
// between the URL slug and the upper-snake API key.
export function useSpecializationMap() {
  const query = useQuery<GroupedCategoriesResponse>({
    queryKey: ["/api/categories/grouped"],
  });

  const all = useMemo(() => {
    return Object.values(query.data?.specializations || {}).flat();
  }, [query.data]);

  const slugToKey = useMemo(() => {
    const m: Record<string, string> = {};
    all.forEach((s) => { m[s.slug] = s.key; });
    return m;
  }, [all]);

  const keyToSlug = useMemo(() => {
    const m: Record<string, string> = {};
    all.forEach((s) => { m[s.key] = s.slug; });
    return m;
  }, [all]);

  const labelByKey = useMemo(() => {
    const m: Record<string, string> = {};
    all.forEach((s) => { m[s.key] = s.name; });
    return m;
  }, [all]);

  const labelBySlug = useMemo(() => {
    const m: Record<string, string> = {};
    all.forEach((s) => { m[s.slug] = s.name; });
    return m;
  }, [all]);

  return { ...query, slugToKey, keyToSlug, labelByKey, labelBySlug };
}
