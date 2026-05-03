import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

// Normalized rows returned by /api/specializations and /api/service-categories.
export interface SpecializationRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  serviceCategorySlug: string | null;
  sortOrder: number;
}
export interface ServiceCategoryRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
}

// Single source of truth for specialization key ↔ slug ↔ label mapping.
// Sourced from the normalized /api/specializations endpoint (no dependency on
// the legacy /api/categories/grouped shape) so any vertical's catalog works.
//
// `key` here is the upper-snake form of the slug — this is the wire format
// stored on profile.specializations[]. `slug` is the kebab-case URL form.
function slugToKey(slug: string): string {
  return slug.toUpperCase().replace(/-/g, "_");
}

export function useSpecializationMap() {
  const query = useQuery<SpecializationRow[]>({
    queryKey: ["/api/specializations"],
    staleTime: Infinity,
  });
  const cats = useQuery<ServiceCategoryRow[]>({
    queryKey: ["/api/service-categories"],
    staleTime: Infinity,
  });

  const all = useMemo(() => (query.data || []).map((s) => ({ ...s, key: slugToKey(s.slug) })), [query.data]);

  const slugToKeyMap = useMemo(() => {
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

  // Grouped { categorySlug → [specs] } — used by ProfileCreate/Edit/SearchBox.
  const grouped = useMemo(() => {
    const m: Record<string, typeof all> = {};
    (cats.data || []).forEach((c) => { m[c.slug] = []; });
    all.forEach((s) => {
      const k = s.serviceCategorySlug || "_uncategorized";
      if (!m[k]) m[k] = [];
      m[k].push(s);
    });
    return m;
  }, [all, cats.data]);

  // Legacy shape used by SearchBox/ProfileCreate/ProfileEdit forms:
  // mainCategoryLabels: { CAT_KEY → name } and specializationsByCategory:
  // { CAT_KEY → [SPEC_KEY,...] } where keys are upper-snake form of slug.
  const mainCategoryLabels = useMemo(() => {
    const m: Record<string, string> = {};
    (cats.data || []).forEach((c) => { m[slugToKey(c.slug)] = c.name; });
    return m;
  }, [cats.data]);

  const specializationsByCategory = useMemo(() => {
    const m: Record<string, string[]> = {};
    (cats.data || []).forEach((c) => {
      m[slugToKey(c.slug)] = (grouped[c.slug] || []).map((s) => s.key);
    });
    return m;
  }, [cats.data, grouped]);

  return {
    ...query,
    serviceCategories: cats.data || [],
    specializations: all,
    grouped,
    slugToKey: slugToKeyMap,
    keyToSlug,
    labelByKey,
    labelBySlug,
    mainCategoryLabels,
    specializationsByCategory,
  };
}
