import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
// @ts-expect-error - busboy heeft geen type declaraties geïnstalleerd
import BusboyImport from "busboy";
const Busboy = BusboyImport as unknown as (opts: { headers: Record<string, string>; limits?: { fileSize?: number; files?: number } }) => NodeJS.WritableStream & {
  on(event: "field", cb: (name: string, val: string) => void): void;
  on(event: "file", cb: (name: string, file: NodeJS.ReadableStream, info: { filename: string; mimeType: string }) => void): void;
  on(event: "finish" | "close", cb: () => void): void;
  on(event: "error", cb: (err: Error) => void): void;
};

async function parseMultipartFile(req: VercelRequest): Promise<{ filename: string; mime: string; buffer: Buffer; type: string } | null> {
  return new Promise((resolve, reject) => {
    try {
      const bb = Busboy({ headers: req.headers as Record<string, string>, limits: { fileSize: 8 * 1024 * 1024, files: 1 } });
      let result: { filename: string; mime: string; buffer: Buffer; type: string } | null = null;
      let typeField = "extra";
      bb.on("field", (name: string, val: string) => { if (name === "type") typeField = val; });
      bb.on("file", (_name, file, info) => {
        const chunks: Buffer[] = [];
        file.on("data", (c: Buffer) => chunks.push(c));
        file.on("end", () => {
          result = { filename: info.filename, mime: info.mimeType, buffer: Buffer.concat(chunks), type: typeField };
        });
      });
      bb.on("finish", () => resolve(result));
      bb.on("error", reject);
      (req as unknown as NodeJS.ReadableStream).pipe(bb as unknown as NodeJS.WritableStream);
    } catch (e) { reject(e); }
  });
}

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;

const SITEMAP_BASE_URL = "https://www.zoek-een-tuinman.be";

// ---------------------------------------------------------------------------
// AUTH — verify Supabase Bearer token uit Authorization header
// ---------------------------------------------------------------------------
type AuthCtx = { authUserId: string; practitionerId: string | null };

async function getAuthContext(req: VercelRequest): Promise<AuthCtx | null> {
  const header = (req.headers["authorization"] || req.headers["Authorization"]) as string | undefined;
  if (!header || !header.toLowerCase().startsWith("bearer ")) return null;
  const token = header.slice(7).trim();
  if (!token) return null;
  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data, error } = await userClient.auth.getUser();
  if (error || !data?.user) return null;
  const authUserId = data.user.id;
  const { data: prac } = await supabase
    .from("practitioner")
    .select("id")
    .eq("auth_user_id", authUserId)
    .maybeSingle();
  return { authUserId, practitionerId: (prac as { id: string } | null)?.id ?? null };
}

function generateSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function snakeToCamel(s: string): string {
  return s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}
function camelToSnake(s: string): string {
  return s.replace(/[A-Z]/g, (c) => "_" + c.toLowerCase());
}
function toCamelCase(o: any): any {
  if (!o || typeof o !== "object") return o;
  if (Array.isArray(o)) return o.map(toCamelCase);
  const r: any = {};
  for (const k in o) {
    const v = o[k];
    r[snakeToCamel(k)] = (v && typeof v === "object" && !Array.isArray(v)) ? toCamelCase(v) : Array.isArray(v) ? v.map((x) => (x && typeof x === "object" ? toCamelCase(x) : x)) : v;
  }
  return r;
}
function toSnakeCase(o: Record<string, any>): Record<string, any> {
  const r: any = {};
  for (const k in o) r[camelToSnake(k)] = o[k];
  return r;
}

const toRad = (deg: number) => (deg * Math.PI) / 180;
function calcDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ---------------------------------------------------------------------------
// In-memory caches voor catalogi (refreshen zelden)
// ---------------------------------------------------------------------------
let _catalogCache: {
  serviceCategories: any[];
  specializations: any[];
  serviceAreas: any[];
  ts: number;
} | null = null;
const CATALOG_TTL_MS = 60_000;

async function getCatalogs() {
  if (_catalogCache && Date.now() - _catalogCache.ts < CATALOG_TTL_MS) return _catalogCache;
  const [{ data: cats }, { data: specs }, { data: areas }] = await Promise.all([
    supabase.from("service_category").select("*").order("sort_order"),
    supabase.from("specialization").select("*").order("sort_order"),
    supabase.from("service_area").select("*"),
  ]);
  _catalogCache = {
    serviceCategories: cats || [],
    specializations: specs || [],
    serviceAreas: areas || [],
    ts: Date.now(),
  };
  return _catalogCache;
}

function mainCategoryKey(slug: string | null | undefined): string {
  return (slug || "").toUpperCase().replace(/-/g, "_");
}

// Synthesize "category" object in old shape from a specialization row + parent service_category
function legacyCategoryFromSpec(spec: any, cats: any[]) {
  const parent = cats.find((c) => c.id === spec.service_category_id);
  return {
    id: spec.id,
    slug: spec.slug,
    name: spec.name,
    description: spec.description,
    main_category: mainCategoryKey(parent?.slug),
    is_active: true,
    sort_order: spec.sort_order,
  };
}

// Convert service_area row to old "location" shape
function legacyLocationFromArea(a: any) {
  return {
    id: a.id,
    slug: a.slug,
    name: a.municipality,
    municipality: a.municipality,
    postcode: a.postcode,
    province: a.province,
    region: a.region,
    latitude: a.latitude,
    longitude: a.longitude,
    is_active: true,
  };
}

// Apply junction-table updates (categories, specs, service areas, office addr, practicals)
async function applyProfileJunctions(profileId: string, body: Record<string, any>) {
  const { specializations, serviceCategories, serviceAreas } = await getCatalogs();

  if (Array.isArray(body.specializations)) {
    await supabase.from("profile_specialization").delete().eq("profile_id", profileId);
    const rows = body.specializations
      .map((slug: string) => specializations.find((s) => s.slug === slug || s.slug === String(slug).toLowerCase().replace(/_/g, "-")))
      .filter(Boolean)
      .map((sp: any, i: number) => ({ profile_id: profileId, specialization_id: sp.id, is_main: i === 0 }));
    if (rows.length) await supabase.from("profile_specialization").insert(rows);
  }

  if (Array.isArray(body.mainCategories)) {
    await supabase.from("profile_service_category").delete().eq("profile_id", profileId);
    const rows = body.mainCategories
      .map((key: string) => serviceCategories.find((c) => mainCategoryKey(c.slug) === String(key).toUpperCase() || c.slug === String(key).toLowerCase().replace(/_/g, "-")))
      .filter(Boolean)
      .map((sc: any, i: number) => ({ profile_id: profileId, service_category_id: sc.id, is_main: i === 0 }));
    if (rows.length) await supabase.from("profile_service_category").insert(rows);
  }

  if (Array.isArray(body.serviceAreas)) {
    await supabase.from("profile_service_area").delete().eq("profile_id", profileId);
    const rows = body.serviceAreas
      .map((slugOrId: string) => serviceAreas.find((a) => a.id === slugOrId || a.slug === slugOrId))
      .filter(Boolean)
      .map((a: any) => ({ profile_id: profileId, service_area_id: a.id }));
    if (rows.length) await supabase.from("profile_service_area").insert(rows);
  }

  if (body.office || body.officeStreet !== undefined || body.officePostcode !== undefined) {
    const o = body.office || {
      street: body.officeStreet,
      number: body.officeNumber,
      municipality: body.officeTown,
      postcode: body.officePostcode,
    };
    const { data: prof } = await supabase.from("profile").select("office_address_id").eq("id", profileId).single();
    const existingAddrId = (prof as { office_address_id: string | null } | null)?.office_address_id || null;
    const { data: cfg } = await supabase.from("site_config").select("default_country_name").limit(1).single();
    const payload: Record<string, any> = {
      street: o.street ?? null,
      number: o.number ?? null,
      municipality: o.municipality ?? o.town ?? null,
      postcode: o.postcode ?? null,
      country: o.country ?? (cfg as { default_country_name: string } | null)?.default_country_name ?? null,
      latitude: o.latitude ?? null,
      longitude: o.longitude ?? null,
      show_address: o.showAddress ?? o.show_address ?? true,
    };
    if (existingAddrId) {
      await supabase.from("address").update(payload).eq("id", existingAddrId);
    } else {
      const { data: addr } = await supabase.from("address").insert(payload).select("id").single();
      if (addr) await supabase.from("profile").update({ office_address_id: (addr as { id: string }).id }).eq("id", profileId);
    }
  }

  if (body.practical && typeof body.practical === "object") {
    const { data: questions } = await supabase.from("practical_question").select("*");
    if (questions) {
      for (const q of questions as any[]) {
        const camelKey = q.key.charAt(0).toLowerCase() + q.key.slice(1);
        const value = body.practical[camelKey] ?? body.practical[q.key];
        if (value === undefined) continue;
        const { data: prevAnswers } = await supabase.from("practical_answer").select("id").eq("profile_id", profileId).eq("practical_question_id", q.id);
        for (const pa of (prevAnswers as { id: string }[] | null) || []) {
          await supabase.from("practical_answer").delete().eq("id", pa.id);
        }
        const { data: ans } = await supabase
          .from("practical_answer")
          .insert({ profile_id: profileId, practical_question_id: q.id })
          .select("id")
          .single();
        if (!ans) continue;
        const ansId = (ans as { id: string }).id;
        if (q.field_type === "OPTION" && Array.isArray(value)) {
          const { data: opts } = await supabase.from("practical_option").select("id, name").eq("practical_question_id", q.id);
          const optRows = (value as string[])
            .map((v) => (opts as { id: string; name: string }[] | null)?.find((o) => o.name === v || o.name.toLowerCase() === String(v).toLowerCase()))
            .filter(Boolean)
            .map((o: any) => ({ practical_answer_id: ansId, practical_option_id: o.id }));
          if (optRows.length) await supabase.from("practical_answer_option").insert(optRows);
        } else if (q.field_type === "INT") {
          await supabase.from("practical_answer_int").insert({ practical_answer_id: ansId, value: parseInt(String(value), 10) });
        } else if (q.field_type === "DOUBLE") {
          await supabase.from("practical_answer_double").insert({ practical_answer_id: ansId, value: parseFloat(String(value)) });
        } else if (q.field_type === "STRING") {
          await supabase.from("practical_answer_string").insert({ practical_answer_id: ansId, value: String(value) });
        } else if (q.field_type === "DATE") {
          await supabase.from("practical_answer_date").insert({ practical_answer_id: ansId, value });
        } else if (q.field_type === "BOOLEAN") {
          await supabase.from("practical_answer_boolean").insert({ practical_answer_id: ansId, value: !!value });
        }
      }
    }
  }
}

// Hydrate a profile row with related data in legacy-frontend shape
async function hydrateProfile(p: any, opts: { withPracticals?: boolean } = {}) {
  const { specializations, serviceCategories, serviceAreas } = await getCatalogs();

  // office address
  let office: any = null;
  if (p.office_address_id) {
    const { data: addr } = await supabase.from("address").select("*").eq("id", p.office_address_id).single();
    if (addr) {
      office = {
        id: addr.id,
        street: addr.street,
        number: addr.number,
        town: addr.municipality,
        postcode: addr.postcode,
        province: addr.province,
        region: addr.region,
        country: addr.country,
        latitude: addr.latitude,
        longitude: addr.longitude,
        showAddress: addr.show_address,
      };
    }
  }

  // junctions
  const [{ data: pSpecs }, { data: pCats }, { data: pAreas }] = await Promise.all([
    supabase.from("profile_specialization").select("specialization_id, is_main").eq("profile_id", p.id),
    supabase.from("profile_service_category").select("service_category_id, is_main").eq("profile_id", p.id),
    supabase.from("profile_service_area").select("service_area_id").eq("profile_id", p.id),
  ]);

  const specSlugs = (pSpecs || []).map((j: any) => specializations.find((s) => s.id === j.specialization_id)?.slug).filter(Boolean);
  const firstSpec = (pSpecs || [])[0]
    ? specializations.find((s) => s.id === (pSpecs as any[])[0].specialization_id)
    : null;
  const category = firstSpec ? legacyCategoryFromSpec(firstSpec, serviceCategories) : null;
  const firstArea = (pAreas || [])[0] ? serviceAreas.find((a) => a.id === (pAreas as any[])[0].service_area_id) : null;
  const location = firstArea ? legacyLocationFromArea(firstArea) : null;

  // mainCategories (uppercase keys derived from service_category slugs)
  const mainCats = (pCats || []).map((j: any) => {
    const sc = serviceCategories.find((c) => c.id === j.service_category_id);
    return mainCategoryKey(sc?.slug);
  }).filter(Boolean);

  // practicals
  let practical: any = null;
  if (opts.withPracticals) {
    const { data: questions } = await supabase.from("practical_question").select("*");
    const { data: answers } = await supabase.from("practical_answer").select("id, practical_question_id").eq("profile_id", p.id);
    if (answers && answers.length && questions) {
      practical = {};
      for (const a of answers as any[]) {
        const q = questions.find((q: any) => q.id === a.practical_question_id);
        if (!q) continue;
        const key = q.key.charAt(0).toLowerCase() + q.key.slice(1); // languages, priceHour, yearsExperience
        if (q.field_type === "OPTION") {
          const { data: opts } = await supabase
            .from("practical_answer_option")
            .select("practical_option_id")
            .eq("practical_answer_id", a.id);
          if (opts && opts.length) {
            const { data: optDetails } = await supabase
              .from("practical_option")
              .select("name")
              .in("id", (opts as any[]).map((o) => o.practical_option_id));
            practical[key] = (optDetails || []).map((o: any) => o.name);
          }
        } else if (q.field_type === "INT") {
          const { data: v } = await supabase.from("practical_answer_int").select("value").eq("practical_answer_id", a.id).single();
          if (v) practical[key] = v.value;
        } else if (q.field_type === "DOUBLE") {
          const { data: v } = await supabase.from("practical_answer_double").select("value").eq("practical_answer_id", a.id).single();
          if (v) practical[key] = v.value;
        } else if (q.field_type === "STRING") {
          const { data: v } = await supabase.from("practical_answer_string").select("value").eq("practical_answer_id", a.id).single();
          if (v) practical[key] = v.value;
        } else if (q.field_type === "DATE") {
          const { data: v } = await supabase.from("practical_answer_date").select("value").eq("practical_answer_id", a.id).single();
          if (v) practical[key] = v.value;
        } else if (q.field_type === "BOOLEAN") {
          const { data: v } = await supabase.from("practical_answer_boolean").select("value").eq("practical_answer_id", a.id).single();
          if (v) practical[key] = v.value;
        }
      }
    }
  }

  return toCamelCase({
    id: p.id,
    slug: p.slug,
    name: p.company_name,
    company_name: p.company_name,
    email: p.contact_email,
    contact_email: p.contact_email,
    telnr: p.telnr,
    title: p.title,
    introduction: p.introduction,
    description: p.introduction,
    website: p.websiteurl,
    websiteurl: p.websiteurl,
    has_website: p.has_website,
    logo_url: p.logourl,
    image_urls: p.imageurls || [],
    is_active: p.is_active,
    is_public: p.is_public,
    is_verified: p.is_verified,
    verification_status: p.verification_status,
    view_count: p.view_count,
    website_clicks: p.website_clicks,
    practitioner_id: p.practitioner_id,
    account_id: p.practitioner_id, // legacy alias
    office_address_id: p.office_address_id,
    created_at: p.created_at,
    updated_at: p.updated_at,
    category,
    category_id: firstSpec?.id || null,
    location,
    location_id: firstArea?.id || null,
    office,
    practical,
    specializations: specSlugs,
    main_categories: mainCats,
  });
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { method } = req;
  const url = new URL(req.url!, `https://${req.headers.host}`);
  const path = url.pathname;
  res.setHeader("Content-Type", "application/json");

  try {
    // -----------------------------------------------------------------------
    // CONFIG
    // -----------------------------------------------------------------------
    if (method === "GET" && path === "/api/config/recaptcha") {
      const siteKey = process.env.RECAPTCHA_SITE_KEY;
      if (!siteKey) return res.status(503).json({ error: "reCAPTCHA not configured" });
      return res.status(200).json({ siteKey });
    }

    if (method === "GET" && path === "/api/site-config") {
      const { data } = await supabase.from("site_config").select("*").limit(1).single();
      if (!data) return res.status(404).json({ error: "Site config not initialized" });
      // Strip sensitive fields for public consumption
      const { company_vat_number, ...publicCfg } = data as any;
      return res.status(200).json(toCamelCase(publicCfg));
    }

    // -----------------------------------------------------------------------
    // CATEGORIES (mapped from specialization)
    // -----------------------------------------------------------------------
    if (method === "GET" && path === "/api/categories") {
      const { specializations, serviceCategories } = await getCatalogs();
      return res.status(200).json(specializations.map((s) => legacyCategoryFromSpec(s, serviceCategories)));
    }

    if (method === "GET" && path === "/api/categories/grouped") {
      const { specializations, serviceCategories } = await getCatalogs();
      const mainCategories = serviceCategories.map((c) => ({
        key: mainCategoryKey(c.slug),
        name: c.name,
        description: c.description,
        slug: c.slug,
      }));
      const grouped: Record<string, any[]> = {};
      for (const c of serviceCategories) grouped[mainCategoryKey(c.slug)] = [];
      for (const s of specializations) {
        const parent = serviceCategories.find((c) => c.id === s.service_category_id);
        const key = mainCategoryKey(parent?.slug);
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push({
          key: mainCategoryKey(s.slug),
          name: s.name,
          slug: s.slug,
          description: s.description,
        });
      }
      return res.status(200).json({ mainCategories, specializations: grouped });
    }

    if (method === "GET" && path.match(/^\/api\/categories\/[^/]+$/)) {
      const slug = path.split("/").pop();
      const { specializations, serviceCategories } = await getCatalogs();
      const spec = specializations.find((s) => s.slug === slug);
      if (!spec) return res.status(404).json({ error: "Category not found" });
      return res.status(200).json(legacyCategoryFromSpec(spec, serviceCategories));
    }

    // -----------------------------------------------------------------------
    // LOCATIONS (mapped from service_area)
    // -----------------------------------------------------------------------
    if (method === "GET" && path === "/api/locations") {
      const { serviceAreas } = await getCatalogs();
      const sorted = [...serviceAreas].sort((a, b) => (a.municipality || "").localeCompare(b.municipality || ""));
      return res.status(200).json(sorted.map(legacyLocationFromArea));
    }

    if (method === "GET" && path.match(/^\/api\/locations\/[^/]+$/)) {
      const slug = path.split("/").pop();
      const { serviceAreas } = await getCatalogs();
      const area = serviceAreas.find((a) => a.slug === slug);
      if (!area) return res.status(404).json({ error: "Location not found" });
      return res.status(200).json(legacyLocationFromArea(area));
    }

    // -----------------------------------------------------------------------
    // PROFILES
    // -----------------------------------------------------------------------
    if (method === "GET" && path === "/api/profiles/featured") {
      const { data } = await supabase
        .from("profile")
        .select("*")
        .eq("is_active", true)
        .eq("is_public", true)
        .eq("is_verified", true)
        .order("view_count", { ascending: false })
        .limit(6);
      const hydrated = await Promise.all((data || []).map((p) => hydrateProfile(p, { withPracticals: true })));
      return res.status(200).json(hydrated);
    }

    if (method === "GET" && (path === "/api/profiles/count" || path === "/api/profiles/search")) {
      const isCount = path === "/api/profiles/count";
      const category = url.searchParams.get("category");
      const location = url.searchParams.get("location");
      const query = url.searchParams.get("query") || url.searchParams.get("q");
      const mainCategory = url.searchParams.get("mainCategory");
      const spec = url.searchParams.get("spec");
      const page = parseInt(url.searchParams.get("page") || "1");
      const limit = parseInt(url.searchParams.get("limit") || "12");
      const offset = (page - 1) * limit;

      const { specializations, serviceCategories, serviceAreas } = await getCatalogs();

      // Resolve filter ids — accept slug ("gras-maaien") of legacy upper key ("SNOEIEN_BOMEN")
      // Legacy frontend keys ↔ DB slugs (woordvolgorde verschilt soms)
      const legacyKeyToSlug: Record<string, string> = {
        SNOEIEN_BOMEN: "bomen-snoeien",
        SNOEIEN_STRUIKEN: "struiken-snoeien",
        HAAG_KNIPPEN: "hagen-knippen",
      };
      let specId: string | null = null;
      const specRaw = category || spec;
      if (specRaw) {
        const upper = specRaw.toUpperCase();
        const candidates = [
          specRaw,
          legacyKeyToSlug[upper],
          specRaw.toLowerCase().replace(/_/g, "-"),
        ].filter(Boolean) as string[];
        for (const c of candidates) {
          const hit = specializations.find((s) => s.slug === c);
          if (hit) { specId = hit.id; break; }
        }
      }

      let categoryIdsForMain: string[] | null = null;
      if (mainCategory) {
        const targetSlug = mainCategory.toLowerCase().replace(/_/g, "-");
        const sc = serviceCategories.find((c) => c.slug === targetSlug || mainCategoryKey(c.slug) === mainCategory.toUpperCase());
        if (sc) categoryIdsForMain = [sc.id];
      }

      // Find candidate profile IDs via junctions
      let candidateIds: string[] | null = null;
      if (specId) {
        const { data } = await supabase.from("profile_specialization").select("profile_id").eq("specialization_id", specId);
        candidateIds = (data || []).map((r: any) => r.profile_id);
        if (!candidateIds.length) {
          if (isCount) return res.status(200).json({ total: 0, count: 0 });
          return res.status(200).json({ profiles: [], total: 0, page, totalPages: 0 });
        }
      }
      if (categoryIdsForMain) {
        const { data } = await supabase
          .from("profile_service_category")
          .select("profile_id")
          .in("service_category_id", categoryIdsForMain);
        const ids = (data || []).map((r: any) => r.profile_id);
        candidateIds = candidateIds ? candidateIds.filter((id) => ids.includes(id)) : ids;
        if (!candidateIds.length) {
          if (isCount) return res.status(200).json({ total: 0, count: 0 });
          return res.status(200).json({ profiles: [], total: 0, page, totalPages: 0 });
        }
      }

      // Location: profile_service_area is autoritatief voor coverage.
      // Office-address afstand wordt enkel gebruikt voor sortering en als
      // optionele back-fill wanneer er géén expliciete service_area-match is.
      let searchLocationData: { lat: number; lng: number; name: string; id: string } | null = null;
      let coverageMatched = false;
      const SEARCH_RADIUS_KM = 20;
      if (location) {
        const loc = serviceAreas.find((a) => a.slug === location);
        if (loc && loc.latitude && loc.longitude) {
          searchLocationData = { lat: loc.latitude, lng: loc.longitude, name: loc.municipality, id: loc.id };
          const { data: areaProfiles } = await supabase
            .from("profile_service_area")
            .select("profile_id")
            .eq("service_area_id", loc.id);
          const areaIds = (areaProfiles || []).map((r) => (r as { profile_id: string }).profile_id);
          if (areaIds.length) {
            coverageMatched = true;
            candidateIds = candidateIds ? candidateIds.filter((id) => areaIds.includes(id)) : areaIds;
            if (!candidateIds.length) {
              if (isCount) return res.status(200).json({ total: 0, count: 0 });
              return res.status(200).json({ profiles: [], total: 0, page, totalPages: 0, searchLocation: searchLocationData });
            }
          }
        }
      }

      // Build profile query
      let q = supabase.from("profile").select("*", { count: "exact" }).eq("is_active", true).eq("is_public", true);
      if (candidateIds) q = q.in("id", candidateIds);
      if (query) q = q.or(`company_name.ilike.%${query}%,introduction.ilike.%${query}%,title.ilike.%${query}%`);

      // Always fetch all matching first if we need distance filter/sort
      const { data: rawProfiles, count, error } = await q;
      if (error) throw error;
      let profiles = rawProfiles || [];

      // Afstandsberekening:
      //  - Coverage-match (service_area): bereken afstand voor sortering, geen filter.
      //  - Geen coverage-match: fallback 20km-radius rond office_address.
      if (searchLocationData) {
        const ids = profiles.map((p) => p.office_address_id).filter(Boolean);
        const { data: addrs } = await supabase.from("address").select("id, latitude, longitude").in("id", ids);
        const addrMap: Record<string, { id: string; latitude: number | null; longitude: number | null }> = {};
        for (const a of addrs || []) {
          const row = a as { id: string; latitude: number | null; longitude: number | null };
          addrMap[row.id] = row;
        }
        const annotated: any[] = [];
        for (const p of profiles) {
          const a = p.office_address_id ? addrMap[p.office_address_id] : null;
          let d: number | null = null;
          if (a && a.latitude && a.longitude) {
            d = calcDistance(searchLocationData.lat, searchLocationData.lng, a.latitude, a.longitude);
          }
          if (coverageMatched) {
            annotated.push({ ...p, _distanceKm: d == null ? null : Math.round(d * 10) / 10 });
          } else if (d != null && d <= SEARCH_RADIUS_KM) {
            annotated.push({ ...p, _distanceKm: Math.round(d * 10) / 10 });
          }
        }
        annotated.sort((a, b) => {
          const da = a._distanceKm == null ? Number.POSITIVE_INFINITY : a._distanceKm;
          const db = b._distanceKm == null ? Number.POSITIVE_INFINITY : b._distanceKm;
          return da - db || (a.company_name || "").localeCompare(b.company_name || "");
        });
        profiles = annotated;
      }

      const total = searchLocationData ? profiles.length : count || profiles.length;
      if (isCount) return res.status(200).json({ total, count: total });

      const paginated = profiles.slice(offset, offset + limit);
      const hydrated = await Promise.all(paginated.map((p) => hydrateProfile(p, { withPracticals: true })));
      // Reattach distance
      if (searchLocationData) {
        for (let i = 0; i < hydrated.length; i++) {
          (hydrated[i] as any).distanceKm = (paginated[i] as any)._distanceKm;
        }
      }
      return res.status(200).json({
        profiles: hydrated,
        total,
        page,
        totalPages: Math.ceil(total / limit),
        ...(searchLocationData ? { searchLocation: searchLocationData } : {}),
      });
    }

    if (method === "GET" && path.match(/^\/api\/profiles\/by-id\/[^/]+$/)) {
      const id = path.split("/").pop();
      const { data } = await supabase.from("profile").select("*").eq("id", id).single();
      if (!data) return res.status(404).json({ error: "Profile not found" });
      const row = data as { is_active?: boolean; practitioner_id: string };
      // Publieke toegang enkel voor actieve profielen; eigenaar mag altijd zijn eigen profiel zien
      if (!row.is_active) {
        const auth = await getAuthContext(req);
        if (!auth || auth.practitionerId !== row.practitioner_id) {
          return res.status(403).json({ error: "Forbidden" });
        }
      }
      res.setHeader("Cache-Control", "no-store");
      return res.status(200).json(await hydrateProfile(data, { withPracticals: true }));
    }

    if (method === "GET" && path.match(/^\/api\/profiles\/[^/]+$/) && !path.includes("/by-id/")) {
      const slug = path.split("/").pop();
      if (slug === "featured" || slug === "count" || slug === "search") return res.status(404).json({ error: "Not found" });
      const { data } = await supabase.from("profile").select("*").eq("slug", slug).eq("is_active", true).single();
      if (!data) return res.status(404).json({ error: "Profile not found" });
      // fire & forget view increment
      supabase.from("profile").update({ view_count: ((data as any).view_count || 0) + 1 }).eq("id", (data as any).id).then(() => {});
      return res.status(200).json(await hydrateProfile(data, { withPracticals: true }));
    }

    // -----------------------------------------------------------------------
    // ACCOUNTS / PRACTITIONERS (legacy alias: account = practitioner)
    // -----------------------------------------------------------------------
    if (method === "GET" && path.match(/^\/api\/my-profiles\/[^/]+$/)) {
      const reqPractitionerId = path.split("/").pop();
      const auth0 = await getAuthContext(req);
      if (!auth0 || auth0.practitionerId !== reqPractitionerId) return res.status(403).json({ error: "Forbidden" });
      const practitionerId = path.split("/").pop();
      const { data } = await supabase.from("profile").select("*").eq("practitioner_id", practitionerId);
      const hydrated = await Promise.all((data || []).map((p) => hydrateProfile(p)));
      return res.status(200).json(hydrated);
    }

    if (method === "POST" && path === "/api/accounts") {
      const auth = await getAuthContext(req);
      if (!auth) return res.status(401).json({ error: "Unauthorized" });
      const { authUserId, email } = req.body;
      if (!authUserId) return res.status(400).json({ error: "authUserId required" });
      if (authUserId !== auth.authUserId) return res.status(403).json({ error: "Forbidden" });
      const { data: existing } = await supabase.from("practitioner").select("*").eq("auth_user_id", authUserId).maybeSingle();
      if (existing) return res.status(200).json(toCamelCase({ ...existing, account_id: (existing as any).id, role: "GARDENER", email_verified: true }));
      // get default practitioner type from site_config
      const { data: cfg } = await supabase.from("site_config").select("default_practitioner_type_id").limit(1).single();
      const { data, error } = await supabase
        .from("practitioner")
        .insert({ auth_user_id: authUserId, email, practitioner_type_id: (cfg as any)?.default_practitioner_type_id })
        .select()
        .single();
      if (error) throw error;
      return res.status(200).json(toCamelCase({ ...data, account_id: (data as any).id, role: "GARDENER", email_verified: true }));
    }

    if (method === "GET" && path.match(/^\/api\/accounts\/by-auth\/[^/]+$/)) {
      const authUserId = path.split("/").pop();
      const auth = await getAuthContext(req);
      if (!auth || auth.authUserId !== authUserId) return res.status(403).json({ error: "Forbidden" });
      const { data } = await supabase.from("practitioner").select("*").eq("auth_user_id", authUserId).maybeSingle();
      if (!data) return res.status(404).json({ error: "Account not found" });
      return res.status(200).json(toCamelCase({ ...data, account_id: (data as any).id, role: "GARDENER", email_verified: true }));
    }

    if (method === "GET" && path.match(/^\/api\/accounts\/[^/]+$/) && !path.includes("/by-auth/")) {
      const id = path.split("/").pop();
      const auth = await getAuthContext(req);
      if (!auth || auth.practitionerId !== id) return res.status(403).json({ error: "Forbidden" });
      const { data } = await supabase.from("practitioner").select("*").eq("id", id).maybeSingle();
      if (!data) return res.status(404).json({ error: "Account not found" });
      return res.status(200).json(toCamelCase({ ...data, account_id: (data as any).id, role: "GARDENER", email_verified: true }));
    }

    if (method === "PATCH" && path.match(/^\/api\/accounts\/[^/]+$/) && !path.includes("/by-auth/")) {
      const id = path.split("/").pop();
      const auth = await getAuthContext(req);
      if (!auth || auth.practitionerId !== id) return res.status(403).json({ error: "Forbidden" });
      const body = req.body || {};
      // Map legacy fields onto practitioner + billing address
      const practUpdate: Record<string, any> = {};
      if (body.email !== undefined) practUpdate.email = body.email;
      if (body.firstname !== undefined) practUpdate.firstname = body.firstname;
      if (body.lastname !== undefined) practUpdate.lastname = body.lastname;
      if (body.companyName !== undefined) practUpdate.company_name = body.companyName;
      if (body.vatNumber !== undefined) practUpdate.vat = body.vatNumber;
      if (body.subjectToVat !== undefined) practUpdate.subject_to_vat = body.subjectToVat;
      practUpdate.updated_at = new Date().toISOString();

      const billingFields = ["billingStreet", "billingNumber", "billingPostcode", "billingCity"];
      const hasBilling = billingFields.some((f) => body[f] !== undefined);
      let billingAddressId: string | null = null;
      if (hasBilling) {
        const { data: prac } = await supabase.from("practitioner").select("billing_address_id").eq("id", id).single();
        billingAddressId = (prac as any)?.billing_address_id || null;
        const billingPayload: Record<string, any> = {
          street: body.billingStreet,
          number: body.billingNumber,
          postcode: body.billingPostcode,
          municipality: body.billingCity,
        };
        if (billingAddressId) {
          await supabase.from("address").update(billingPayload).eq("id", billingAddressId);
        } else {
          // get default country from site_config
          const { data: cfg } = await supabase.from("site_config").select("default_country_name").limit(1).single();
          billingPayload.country = (cfg as any)?.default_country_name || null;
          const { data: addr } = await supabase.from("address").insert(billingPayload).select().single();
          if (addr) {
            billingAddressId = (addr as any).id;
            practUpdate.billing_address_id = billingAddressId;
          }
        }
      }

      const { data, error } = await supabase.from("practitioner").update(practUpdate).eq("id", id).select().single();
      if (error) throw error;
      return res.status(200).json(toCamelCase({ ...data, account_id: (data as any).id }));
    }

    // -----------------------------------------------------------------------
    // SUBSCRIPTION PLANS (return offers in legacy plan-shape)
    // -----------------------------------------------------------------------
    if (method === "GET" && path === "/api/subscription-plans") {
      const { data: offers } = await supabase
        .from("subscription_plan_offer")
        .select("*, subscription_plan(*)")
        .eq("is_active", true)
        .order("duration_in_years");
      const result = (offers || []).map((o: any) => ({
        id: o.id,
        plan_id: o.subscription_plan_id,
        type: o.subscription_plan?.key || "STANDARD",
        name: `${o.subscription_plan?.name || "Standaard"} (${o.duration_in_years} jaar)`,
        durationInYears: o.duration_in_years,
        years: o.duration_in_years,
        price: o.total_price,
        total_price: o.total_price,
        discount_percentage: o.discount_percentage,
        is_popular: o.is_popular,
        is_active: o.is_active,
        sort_order: o.duration_in_years,
      }));
      return res.status(200).json(toCamelCase(result));
    }

    // -----------------------------------------------------------------------
    // CONTACT REQUESTS
    // -----------------------------------------------------------------------
    if (method === "GET" && path.match(/^\/api\/contact-requests\/[^/]+$/)) {
      const practitionerId = path.split("/").pop();
      const auth = await getAuthContext(req);
      if (!auth || auth.practitionerId !== practitionerId) return res.status(403).json({ error: "Forbidden" });
      const { data: profiles } = await supabase.from("profile").select("id, slug, company_name").eq("practitioner_id", practitionerId);
      if (!profiles || !profiles.length) return res.status(200).json([]);
      const profileIds = profiles.map((p) => (p as any).id);
      const { data } = await supabase
        .from("contact_request")
        .select("*")
        .in("profile_id", profileIds)
        .order("created_at", { ascending: false });
      const enriched = (data || []).map((cr: any) => {
        const prof = profiles.find((p) => (p as any).id === cr.profile_id);
        return { ...cr, profile: { name: (prof as any)?.company_name, slug: (prof as any)?.slug } };
      });
      return res.status(200).json(toCamelCase(enriched));
    }

    if (method === "POST" && path.match(/^\/api\/contact\/[^/]+$/)) {
      const profileId = path.split("/").pop();
      const { data: profile } = await supabase.from("profile").select("id, company_name, contact_email").eq("id", profileId).single();
      if (!profile) return res.status(404).json({ error: "Profile not found" });

      const recaptchaSecretKey = process.env.RECAPTCHA_SECRET_KEY;
      const { recaptchaToken, visitorName, visitorEmail, telnr, subject, message } = req.body;
      if (recaptchaSecretKey) {
        if (!recaptchaToken) {
          return res.status(400).json({ error: "reCAPTCHA token ontbreekt" });
        }
        const r = await fetch("https://www.google.com/recaptcha/api/siteverify", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: `secret=${recaptchaSecretKey}&response=${recaptchaToken}`,
        });
        const result = (await r.json()) as { success: boolean; score?: number };
        if (!result.success || (result.score !== undefined && result.score < 0.5)) {
          return res.status(400).json({ error: "reCAPTCHA verificatie mislukt" });
        }
      }

      const { data, error } = await supabase
        .from("contact_request")
        .insert({
          profile_id: (profile as any).id,
          visitor_name: visitorName,
          visitor_email: visitorEmail,
          telnr: telnr || null,
          subject,
          message,
        })
        .select()
        .single();
      if (error) throw error;

      // Email notification
      const resendApiKey = process.env.RESEND_API_KEY;
      const targetEmail = (profile as any).contact_email;
      if (resendApiKey && targetEmail) {
        try {
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { Authorization: `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              from: "Zoek-een-tuinman.be <noreply@zoek-een-tuinman.be>",
              to: [targetEmail],
              reply_to: visitorEmail,
              subject: `Nieuw contactverzoek: ${subject}`,
              html: `<p>Je hebt een nieuw contactverzoek ontvangen van <b>${visitorName}</b> (${visitorEmail}).</p>
                <p>${telnr ? `Telefoon: ${telnr}<br>` : ""}Onderwerp: ${subject}</p>
                <pre>${message}</pre>`,
            }),
          });
        } catch (e) {
          console.error("contact email failed:", e);
        }
      }
      return res.status(201).json({ success: true, id: (data as any).id });
    }

    if (method === "POST" && path === "/api/contact-owner") {
      const { name, email, subject, message } = req.body;
      if (!name || !email || !subject || !message) return res.status(400).json({ error: "All fields are required" });
      console.log("Platform contact:", { name, email, subject });
      return res.status(200).json({ success: true });
    }

    if (method === "DELETE" && path === "/api/account/delete") {
      const auth = await getAuthContext(req);
      if (!auth || !auth.practitionerId) return res.status(401).json({ error: "Unauthorized" });
      // Verwijder profielen + alle gerelateerde data via FK CASCADE op practitioner
      await supabase.from("practitioner").delete().eq("id", auth.practitionerId);
      // Auth user verwijdering vereist admin client
      try { await supabase.auth.admin.deleteUser(auth.authUserId); } catch {}
      return res.status(200).json({ success: true });
    }

    // -----------------------------------------------------------------------
    // PROFILE CRUD
    // -----------------------------------------------------------------------
    if (method === "POST" && path === "/api/profiles") {
      const auth = await getAuthContext(req);
      if (!auth || !auth.practitionerId) return res.status(401).json({ error: "Unauthorized" });
      const body = req.body || {};
      const requested = body.accountId || body.practitionerId;
      if (requested && requested !== auth.practitionerId) return res.status(403).json({ error: "Forbidden" });
      const practitionerId = auth.practitionerId;

      let baseSlug = generateSlug(body.name || body.companyName || "profiel");
      let slug = baseSlug;
      let n = 1;
      while ((await supabase.from("profile").select("id").eq("slug", slug).maybeSingle()).data) {
        slug = `${baseSlug}-${n++}`;
      }

      const { data, error } = await supabase
        .from("profile")
        .insert({
          practitioner_id: practitionerId,
          slug,
          company_name: body.name || body.companyName,
          contact_email: body.email || body.contactEmail,
          telnr: body.telnr || "",
          websiteurl: body.website || "",
          has_website: body.hasWebsite || false,
          title: body.title || "",
          introduction: body.introduction || body.description || "",
          is_active: true,
          is_public: false,
          is_verified: false,
          verification_status: "PENDING",
        })
        .select()
        .single();
      if (error) throw error;
      await applyProfileJunctions((data as { id: string }).id, body);
      const fresh = await supabase.from("profile").select("*").eq("id", (data as { id: string }).id).single();
      return res.status(201).json(await hydrateProfile(fresh.data));
    }

    if (method === "POST" && path.match(/^\/api\/profiles\/[^/]+\/upload$/)) {
      const auth = await getAuthContext(req);
      if (!auth || !auth.practitionerId) return res.status(401).json({ error: "Unauthorized" });
      const profileId = path.split("/")[3];
      const { data: prof } = await supabase.from("profile").select("practitioner_id, logourl, imageurls").eq("id", profileId).maybeSingle();
      if (!prof) return res.status(404).json({ error: "Profile not found" });
      const profRow = prof as { practitioner_id: string; logourl: string | null; imageurls: string[] | null };
      if (profRow.practitioner_id !== auth.practitionerId) return res.status(403).json({ error: "Forbidden" });

      const file = await parseMultipartFile(req);
      if (!file) return res.status(400).json({ error: "No file uploaded" });

      const ext = (file.filename.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
      const key = `profiles/${profileId}/${file.type}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("uploads").upload(key, file.buffer, { contentType: file.mime, upsert: false });
      if (upErr) return res.status(500).json({ error: upErr.message });
      const { data: pub } = supabase.storage.from("uploads").getPublicUrl(key);
      const url = pub.publicUrl;

      if (file.type === "profile" || file.type === "logo") {
        await supabase.from("profile").update({ logourl: url }).eq("id", profileId);
      } else {
        const imgs = Array.isArray(profRow.imageurls) ? profRow.imageurls : [];
        await supabase.from("profile").update({ imageurls: [...imgs, url] }).eq("id", profileId);
      }
      return res.status(200).json({ url, type: file.type });
    }

    if ((method === "PUT" || method === "PATCH") && path.match(/^\/api\/profiles\/[^/]+$/) && !path.includes("/by-id/") && !path.endsWith("/track-click")) {
      const id = path.split("/").pop()!;
      if (id === "featured" || id === "count" || id === "search") return res.status(404).json({ error: "Not found" });
      const auth = await getAuthContext(req);
      if (!auth || !auth.practitionerId) return res.status(401).json({ error: "Unauthorized" });
      const { data: existing } = await supabase.from("profile").select("practitioner_id").eq("id", id).maybeSingle();
      if (!existing) return res.status(404).json({ error: "Profile not found" });
      if ((existing as { practitioner_id: string }).practitioner_id !== auth.practitionerId) return res.status(403).json({ error: "Forbidden" });

      const body = req.body || {};
      const update: Record<string, any> = {};
      if (body.name !== undefined) update.company_name = body.name;
      if (body.companyName !== undefined) update.company_name = body.companyName;
      if (body.email !== undefined) update.contact_email = body.email;
      if (body.contactEmail !== undefined) update.contact_email = body.contactEmail;
      if (body.telnr !== undefined) update.telnr = body.telnr;
      if (body.website !== undefined) update.websiteurl = body.website;
      if (body.hasWebsite !== undefined) update.has_website = body.hasWebsite;
      if (body.introduction !== undefined) update.introduction = body.introduction;
      if (body.description !== undefined) update.introduction = body.description;
      if (body.title !== undefined) update.title = body.title;
      if (body.logoUrl !== undefined) update.logourl = body.logoUrl;
      if (body.imageUrls !== undefined) update.imageurls = body.imageUrls;
      if (body.isActive !== undefined) update.is_active = body.isActive;
      if (body.isPublic !== undefined) update.is_public = body.isPublic;
      update.updated_at = new Date().toISOString();

      const { data, error } = await supabase.from("profile").update(update).eq("id", id).select().single();
      if (error) throw error;
      await applyProfileJunctions(id, body);
      res.setHeader("Cache-Control", "no-store");
      const fresh = await supabase.from("profile").select("*").eq("id", id).single();
      return res.status(200).json(await hydrateProfile(fresh.data, { withPracticals: true }));
    }

    if (method === "DELETE" && path.match(/^\/api\/profiles\/[^/]+$/) && !path.includes("/by-id/")) {
      const id = path.split("/").pop()!;
      if (id === "featured" || id === "count" || id === "search") return res.status(404).json({ error: "Not found" });
      const auth = await getAuthContext(req);
      if (!auth || !auth.practitionerId) return res.status(401).json({ error: "Unauthorized" });
      const { data: existing } = await supabase.from("profile").select("practitioner_id").eq("id", id).maybeSingle();
      if (!existing) return res.status(404).json({ error: "Profile not found" });
      if ((existing as { practitioner_id: string }).practitioner_id !== auth.practitionerId) return res.status(403).json({ error: "Forbidden" });
      const { error } = await supabase.from("profile").delete().eq("id", id);
      if (error) throw error;
      return res.status(200).json({ success: true });
    }

    if (method === "POST" && path.match(/^\/api\/profiles\/[^/]+\/track-click$/)) {
      const parts = path.split("/");
      const id = parts[parts.length - 2];
      const { type } = req.body || {};
      if (type === "website") {
        const { data } = await supabase.from("profile").select("website_clicks").eq("id", id).single();
        if (data) await supabase.from("profile").update({ website_clicks: ((data as any).website_clicks || 0) + 1 }).eq("id", id);
      }
      return res.status(200).json({ success: true });
    }

    // -----------------------------------------------------------------------
    // SITEMAPS (dynamic from DB)
    // -----------------------------------------------------------------------
    if (method === "GET" && path === "/robots.txt") {
      res.setHeader("Content-Type", "text/plain");
      return res.send(`User-agent: *\nAllow: /\n\nSitemap: ${SITEMAP_BASE_URL}/sitemap.xml\n`);
    }

    if (method === "GET" && path === "/sitemap.xml") {
      const today = new Date().toISOString().split("T")[0];
      const { specializations, serviceAreas } = await getCatalogs();
      const totalLocSpecs = serviceAreas.length * specializations.length;
      const locSpecPages = Math.ceil(totalLocSpecs / 5000);
      let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
      for (const seg of ["site", "info", "profiles", "locations", "specializations"]) {
        xml += `  <sitemap><loc>${SITEMAP_BASE_URL}/sitemaps/${seg}/sitemap.xml</loc><lastmod>${today}</lastmod></sitemap>\n`;
      }
      for (let i = 1; i <= locSpecPages; i++) {
        xml += `  <sitemap><loc>${SITEMAP_BASE_URL}/sitemaps/location-specs/sitemap-${i}.xml</loc><lastmod>${today}</lastmod></sitemap>\n`;
      }
      xml += `</sitemapindex>`;
      res.setHeader("Content-Type", "application/xml");
      return res.send(xml);
    }

    if (method === "GET" && path === "/sitemaps/site/sitemap.xml") {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${SITEMAP_BASE_URL}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>
  <url><loc>${SITEMAP_BASE_URL}/login</loc><changefreq>monthly</changefreq><priority>0.3</priority></url>
  <url><loc>${SITEMAP_BASE_URL}/registreren</loc><changefreq>monthly</changefreq><priority>0.4</priority></url>
</urlset>`;
      res.setHeader("Content-Type", "application/xml");
      return res.send(xml);
    }

    if (method === "GET" && path === "/sitemaps/info/sitemap.xml") {
      const pages = ["over-ons", "contact", "faq", "prijzen", "hoe-werkt-het", "voor-tuinmannen"];
      let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
      for (const p of pages) {
        xml += `  <url><loc>${SITEMAP_BASE_URL}/${p}</loc><changefreq>monthly</changefreq><priority>0.5</priority></url>\n`;
      }
      xml += `</urlset>`;
      res.setHeader("Content-Type", "application/xml");
      return res.send(xml);
    }

    if (method === "GET" && path === "/sitemaps/profiles/sitemap.xml") {
      const today = new Date().toISOString().split("T")[0];
      const { data: profiles } = await supabase.from("profile").select("slug").eq("is_public", true);
      let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
      for (const p of profiles || []) {
        xml += `  <url><loc>${SITEMAP_BASE_URL}/bedrijf/${(p as any).slug}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.3</priority></url>\n`;
      }
      xml += `</urlset>`;
      res.setHeader("Content-Type", "application/xml");
      return res.send(xml);
    }

    if (method === "GET" && path === "/sitemaps/locations/sitemap.xml") {
      const today = new Date().toISOString().split("T")[0];
      const { serviceAreas } = await getCatalogs();
      let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
      for (const a of serviceAreas) {
        xml += `  <url><loc>${SITEMAP_BASE_URL}/zoek/${a.postcode}-${a.slug}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.9</priority></url>\n`;
      }
      xml += `</urlset>`;
      res.setHeader("Content-Type", "application/xml");
      return res.send(xml);
    }

    if (method === "GET" && path === "/sitemaps/specializations/sitemap.xml") {
      const today = new Date().toISOString().split("T")[0];
      const { specializations } = await getCatalogs();
      let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
      for (const s of specializations) {
        xml += `  <url><loc>${SITEMAP_BASE_URL}/zoek/${s.slug}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>\n`;
      }
      xml += `</urlset>`;
      res.setHeader("Content-Type", "application/xml");
      return res.send(xml);
    }

    const locSpecMatch = path.match(/^\/sitemaps\/location-specs\/sitemap-(\d+)\.xml$/);
    if (method === "GET" && locSpecMatch) {
      const page = parseInt(locSpecMatch[1]) || 1;
      const perPage = 5000;
      const today = new Date().toISOString().split("T")[0];
      const { specializations, serviceAreas } = await getCatalogs();
      const combos: { loc: string; spec: string }[] = [];
      for (const a of serviceAreas) {
        for (const s of specializations) {
          combos.push({ loc: `${a.postcode}-${a.slug}`, spec: s.slug });
        }
      }
      const slice = combos.slice((page - 1) * perPage, page * perPage);
      if (!slice.length) return res.status(404).send("Sitemap page not found");
      let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
      for (const c of slice) {
        xml += `  <url><loc>${SITEMAP_BASE_URL}/zoek/${c.loc}/${c.spec}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>\n`;
      }
      xml += `</urlset>`;
      res.setHeader("Content-Type", "application/xml");
      return res.send(xml);
    }

    if (method === "GET" && path === "/googlec82c9dc9a541d03e.html") {
      res.setHeader("Content-Type", "text/html");
      return res.send("google-site-verification: googlec82c9dc9a541d03e.html");
    }

    // -----------------------------------------------------------------------
    // SUBSCRIPTIONS / MOLLIE
    // -----------------------------------------------------------------------
    if (method === "GET" && path.match(/^\/api\/subscriptions\/profile\/[^/]+$/)) {
      const profileId = path.split("/").pop()!;
      const auth = await getAuthContext(req);
      if (!auth || !auth.practitionerId) return res.status(401).json({ error: "Unauthorized" });
      const { data: prof } = await supabase.from("profile").select("practitioner_id").eq("id", profileId).maybeSingle();
      if (!prof) return res.status(404).json({ error: "Profile not found" });
      if ((prof as { practitioner_id: string }).practitioner_id !== auth.practitionerId) return res.status(403).json({ error: "Forbidden" });
      const { data } = await supabase
        .from("profile_subscription")
        .select("*, subscription_plan_offer(*, subscription_plan(*))")
        .eq("profile_id", profileId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!data) return res.status(404).json({ error: "No subscription found" });
      const offer = (data as any).subscription_plan_offer;
      return res.status(200).json(toCamelCase({
        ...data,
        years: offer?.duration_in_years,
        total_amount: offer?.total_price,
      }));
    }

    if (method === "POST" && path === "/api/mollie/create-payment") {
      const auth = await getAuthContext(req);
      if (!auth || !auth.practitionerId) return res.status(401).json({ error: "Unauthorized" });
      const { profileId, accountId, planId } = req.body || {};
      if (!profileId || !planId) return res.status(400).json({ error: "Missing fields" });
      const { data: ownerCheck } = await supabase.from("profile").select("practitioner_id").eq("id", profileId).maybeSingle();
      if (!ownerCheck) return res.status(404).json({ error: "Profile not found" });
      if ((ownerCheck as { practitioner_id: string }).practitioner_id !== auth.practitionerId) return res.status(403).json({ error: "Forbidden" });

      const mollieApiKey = process.env.MOLLIE_API_KEY;
      if (!mollieApiKey) return res.status(503).json({ error: "Payment service not configured" });

      // map legacy planId "1-year"/"2-year"/"3-year" → duration_in_years
      const years = parseInt(String(planId).split("-")[0]);
      if (!years) return res.status(400).json({ error: "Invalid planId" });

      const { data: offer } = await supabase
        .from("subscription_plan_offer")
        .select("*, subscription_plan(*)")
        .eq("duration_in_years", years)
        .eq("is_active", true)
        .limit(1)
        .single();
      if (!offer) return res.status(400).json({ error: "Plan not found" });

      const { data: profile } = await supabase.from("profile").select("id, company_name").eq("id", profileId).single();
      if (!profile) return res.status(404).json({ error: "Profile not found" });

      const { data: yearlyCycle } = await supabase.from("billing_cycle").select("id").eq("key", "Yearly").single();
      const { data: mollieProvider } = await supabase.from("payment_provider").select("id").eq("key", "Mollie").single();

      // Find or create profile_subscription in PENDING
      const { data: existing } = await supabase
        .from("profile_subscription")
        .select("*")
        .eq("profile_id", profileId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      let subscription;
      if (existing) {
        const { data } = await supabase
          .from("profile_subscription")
          .update({
            subscription_plan_offer_id: (offer as any).id,
            billing_cycle_id: (yearlyCycle as any).id,
            status: "PENDING",
            updated_at: new Date().toISOString(),
          })
          .eq("id", (existing as any).id)
          .select()
          .single();
        subscription = data;
      } else {
        const { data } = await supabase
          .from("profile_subscription")
          .insert({
            profile_id: profileId,
            subscription_plan_offer_id: (offer as any).id,
            billing_cycle_id: (yearlyCycle as any).id,
            status: "PENDING",
            auto_renew: false,
          })
          .select()
          .single();
        subscription = data;
      }

      const baseUrl = "https://www.zoek-een-tuinman.be";
      const total = (offer as any).total_price;
      const { data: cfgRow } = await supabase.from("site_config").select("default_currency_code").limit(1).single();
      const currency = (cfgRow as any)?.default_currency_code || "EUR";
      const mollieResp = await fetch("https://api.mollie.com/v2/payments", {
        method: "POST",
        headers: { Authorization: `Bearer ${mollieApiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: { currency, value: total.toFixed(2) },
          description: `${(offer as any).subscription_plan?.name || "Abonnement"} - ${years} jaar voor ${(profile as any).company_name}`,
          redirectUrl: `${baseUrl}/dashboard/profielen/${profileId}/betaling-status?payment_id=${(subscription as any).id}`,
          webhookUrl: `${baseUrl}/api/mollie/webhook`,
          metadata: { profileId, accountId, planId, years, subscriptionId: (subscription as any).id },
        }),
      });
      if (!mollieResp.ok) {
        const err = await mollieResp.json();
        console.error("Mollie error:", err);
        return res.status(500).json({ error: "Failed to create payment" });
      }
      const molliePayment = await mollieResp.json();

      // create payment row
      await supabase.from("payment").insert({
        profile_subscription_id: (subscription as any).id,
        payment_provider_id: (mollieProvider as any).id,
        amount: total,
        currency,
        status: "PENDING",
        external_payment_id: molliePayment.id,
      });

      return res.status(200).json({
        paymentUrl: molliePayment._links.checkout.href,
        paymentId: molliePayment.id,
        subscriptionId: (subscription as any).id,
      });
    }

    if (method === "GET" && path.match(/^\/api\/mollie\/payment-status\/[^/]+$/)) {
      const subscriptionId = path.split("/").pop();
      const auth = await getAuthContext(req);
      if (!auth || !auth.practitionerId) return res.status(401).json({ error: "Unauthorized" });
      const { data: sub } = await supabase.from("profile_subscription").select("*").eq("id", subscriptionId).single();
      if (!sub) return res.status(404).json({ error: "Subscription not found" });
      const subRow = sub as { profile_id: string };
      const { data: ownerProfile } = await supabase.from("profile").select("practitioner_id").eq("id", subRow.profile_id).maybeSingle();
      if (!ownerProfile || (ownerProfile as { practitioner_id: string }).practitioner_id !== auth.practitionerId) {
        return res.status(403).json({ error: "Forbidden" });
      }
      const { data: pay } = await supabase
        .from("payment")
        .select("*")
        .eq("profile_subscription_id", subscriptionId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      const mollieApiKey = process.env.MOLLIE_API_KEY;
      if (pay && (pay as any).external_payment_id && mollieApiKey) {
        const mr = await fetch(`https://api.mollie.com/v2/payments/${(pay as any).external_payment_id}`, {
          headers: { Authorization: `Bearer ${mollieApiKey}` },
        });
        if (mr.ok) {
          const mp = await mr.json();
          if (mp.status === "paid" && (sub as any).status !== "ACTIVE") {
            const meta = mp.metadata as { years: number };
            const startDate = new Date();
            const endDate = new Date();
            endDate.setFullYear(endDate.getFullYear() + (meta?.years || 1));
            await supabase
              .from("profile_subscription")
              .update({
                status: "ACTIVE",
                start_date: startDate.toISOString().split("T")[0],
                end_date: endDate.toISOString().split("T")[0],
                updated_at: new Date().toISOString(),
              })
              .eq("id", (sub as any).id);
            await supabase.from("payment").update({ status: "PAID", paid_at: new Date().toISOString() }).eq("id", (pay as any).id);
            return res.status(200).json({ status: "ACTIVE", mollieStatus: mp.status });
          }
          return res.status(200).json({ status: (sub as any).status, mollieStatus: mp.status });
        }
      }
      return res.status(200).json({ status: (sub as any).status, mollieStatus: null });
    }

    if (method === "POST" && path === "/api/mollie/webhook") {
      const { id: paymentId } = req.body || {};
      if (!paymentId) return res.status(200).send("OK");
      const mollieApiKey = process.env.MOLLIE_API_KEY;
      if (!mollieApiKey) return res.status(200).send("OK");

      const mr = await fetch(`https://api.mollie.com/v2/payments/${paymentId}`, {
        headers: { Authorization: `Bearer ${mollieApiKey}` },
      });
      if (!mr.ok) return res.status(200).send("OK");
      const payment = await mr.json();
      const meta = payment.metadata as { profileId: string; subscriptionId: string; years: number };
      if (!meta?.subscriptionId) return res.status(200).send("OK");

      const { data: pay } = await supabase.from("payment").select("*").eq("external_payment_id", paymentId).maybeSingle();
      if (!pay) return res.status(200).send("OK");

      if (payment.status === "paid") {
        const startDate = new Date();
        const endDate = new Date();
        endDate.setFullYear(endDate.getFullYear() + (meta.years || 1));
        await supabase
          .from("profile_subscription")
          .update({
            status: "ACTIVE",
            start_date: startDate.toISOString().split("T")[0],
            end_date: endDate.toISOString().split("T")[0],
            updated_at: new Date().toISOString(),
          })
          .eq("id", meta.subscriptionId);
        await supabase.from("payment").update({ status: "PAID", paid_at: new Date().toISOString() }).eq("id", (pay as any).id);
        // (Email/Discord/Billit hooks weggehaald in deze refactor — kunnen terugkomen via aparte taak)
      } else if (["failed", "canceled", "expired"].includes(payment.status)) {
        await supabase.from("profile_subscription").update({ status: "CANCELLED" }).eq("id", meta.subscriptionId);
        await supabase.from("payment").update({ status: "FAILED" }).eq("id", (pay as any).id);
      }
      return res.status(200).send("OK");
    }

    return res.status(404).json({ error: "Not found" });
  } catch (error: any) {
    console.error("API Error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}
