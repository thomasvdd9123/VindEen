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

// Single source of truth for specialization slug ↔ label mapping.
// Sourced from the normalized /api/specializations endpoint (no dependency on
// the legacy /api/categories/grouped shape) so any vertical's catalog works.
//
// IMPORTANT — canonical identifier is the **slug** (kebab-case). This matches
// the wire format used by `hydrateProfile()` (profile.specializations[]) and
// by the create/update profile API. The `key` field is kept as an alias of
// `slug` for back-compat with consumers using `keyToSlug` / `labelByKey`.
export function useSpecializationMap() {
  const query = useQuery<SpecializationRow[]>({
    queryKey: ["/api/specializations"],
    staleTime: Infinity,
  });
  const cats = useQuery<ServiceCategoryRow[]>({
    queryKey: ["/api/service-categories"],
    staleTime: Infinity,
  });

  // key === slug. Single canonical identifier across the app.
  const all = useMemo(() => (query.data || []).map((s) => ({ ...s, key: s.slug })), [query.data]);

  const slugToKeyMap = useMemo(() => {
    const m: Record<string, string> = {};
    all.forEach((s) => { m[s.slug] = s.slug; });
    return m;
  }, [all]);

  const keyToSlug = useMemo(() => {
    const m: Record<string, string> = {};
    all.forEach((s) => { m[s.slug] = s.slug; });
    return m;
  }, [all]);

  const labelByKey = useMemo(() => {
    const m: Record<string, string> = {};
    all.forEach((s) => { m[s.slug] = s.name; });
    return m;
  }, [all]);

  const labelBySlug = labelByKey;

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

  // mainCategoryLabels: { categorySlug → name } and
  // specializationsByCategory: { categorySlug → [specSlug,...] }.
  // All keyed by slug (no upper-snake transformation) so values match
  // profile.specializations[] coming from /api/profiles.
  const mainCategoryLabels = useMemo(() => {
    const m: Record<string, string> = {};
    (cats.data || []).forEach((c) => { m[c.slug] = c.name; });
    return m;
  }, [cats.data]);

  const specializationsByCategory = useMemo(() => {
    const m: Record<string, string[]> = {};
    (cats.data || []).forEach((c) => {
      m[c.slug] = (grouped[c.slug] || []).map((s) => s.slug);
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
