import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import Busboy from "busboy";
import { z } from "zod";

const ALLOWED_IMAGE_MIMES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const ALLOWED_IMAGE_EXTS = new Set(["jpg", "jpeg", "png", "webp", "gif"]);

async function parseMultipartFile(req: VercelRequest): Promise<{ filename: string; mime: string; buffer: Buffer; type: string } | null> {
  return new Promise((resolve, reject) => {
    try {
      const bb = Busboy({ headers: req.headers as Record<string, string>, limits: { fileSize: 8 * 1024 * 1024, files: 1 } });
      let result: { filename: string; mime: string; buffer: Buffer; type: string } | null = null;
      let typeField = "extra";
      bb.on("field", (name, val) => { if (name === "type") typeField = val; });
      bb.on("file", (_name, file, info) => {
        const chunks: Buffer[] = [];
        file.on("data", (c: Buffer) => chunks.push(c));
        file.on("end", () => {
          result = { filename: info.filename, mime: info.mimeType, buffer: Buffer.concat(chunks), type: typeField };
        });
      });
      bb.on("finish", () => resolve(result));
      bb.on("error", reject);
      req.pipe(bb);
    } catch (e) { reject(e); }
  });
}

function escapeHtml(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;

// Per-vertical branding (override via env so a rebrand only requires env change).
const SITE_BASE_URL = process.env.SITE_BASE_URL || "https://www.zoek-een-tuinman.be";
const SITE_EMAIL_FROM = process.env.SITE_EMAIL_FROM || "Zoek-een-tuinman.be <noreply@zoek-een-tuinman.be>";
const SITEMAP_BASE_URL = SITE_BASE_URL;

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

async function requireAdmin(req: VercelRequest): Promise<{ authUserId: string; adminId: string } | null> {
  const auth = await getAuthContext(req);
  if (!auth) return null;
  const { data } = await supabase.from("admin").select("id").eq("auth_user_id", auth.authUserId).maybeSingle();
  if (!data) return null;
  return { authUserId: auth.authUserId, adminId: (data as { id: string }).id };
}

function bustCatalogCache() { _catalogCache = null; }

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

  // Service-area mapping: nieuwe `serviceAreas` array OF legacy `locationId` (1 area)
  const serviceAreaInputs: string[] = Array.isArray(body.serviceAreas)
    ? body.serviceAreas
    : (body.locationId ? [String(body.locationId)] : []);
  if (serviceAreaInputs.length || Array.isArray(body.serviceAreas) || body.locationId !== undefined) {
    await supabase.from("profile_service_area").delete().eq("profile_id", profileId);
    const rows = serviceAreaInputs
      .map((slugOrId: string) => serviceAreas.find((a) => a.id === slugOrId || a.slug === slugOrId))
      .filter(Boolean)
      .map((a: any) => ({ profile_id: profileId, service_area_id: a.id }));
    if (rows.length) await supabase.from("profile_service_area").insert(rows);
  }

  if (body.office || body.officeStreet !== undefined || body.officePostcode !== undefined || body.locationId || body.hideAddress !== undefined) {
    const o = body.office || {
      street: body.officeStreet,
      number: body.officeNumber,
      municipality: body.officeTown,
      postcode: body.officePostcode,
    };
    // top-level hideAddress (from edit form) overrides nested office.showAddress
    if (body.hideAddress !== undefined && o.showAddress === undefined && o.show_address === undefined) {
      o.showAddress = !body.hideAddress;
    }
    const { data: prof } = await supabase.from("profile").select("office_address_id").eq("id", profileId).single();
    const existingAddrId = (prof as { office_address_id: string | null } | null)?.office_address_id || null;
    const { data: cfg } = await supabase.from("site_config").select("default_country_name").limit(1).single();
    // Lat/lng back-fill via service_area wanneer client geen coords stuurt
    let lat = o.latitude ?? null;
    let lng = o.longitude ?? null;
    let municipality = o.municipality ?? o.town ?? null;
    let postcode = o.postcode ?? null;
    if ((!lat || !lng) && body.locationId) {
      const area = serviceAreas.find((a) => a.id === body.locationId || a.slug === body.locationId);
      if (area) {
        if (!lat) lat = area.latitude ?? null;
        if (!lng) lng = area.longitude ?? null;
        if (!municipality) municipality = area.municipality;
        if (!postcode) postcode = area.postcode;
      }
    }
    const payload: Record<string, any> = {
      street: o.street ?? null,
      number: o.number ?? null,
      municipality,
      postcode,
      country: o.country ?? (cfg as { default_country_name: string } | null)?.default_country_name ?? null,
      latitude: lat,
      longitude: lng,
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
    hide_address: office ? office.showAddress === false : false,
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
      // Strip sensitive fields for public consumption (BTW intern, NIET publiek).
      const { company_vat_number, ...publicCfg } = data as any;
      // theme_copy + cache_version blijven publiek — frontend gebruikt cache_version
      // om verlopen caches te invalideren wanneer een admin de site herbrandt.
      return res.status(200).json(toCamelCase(publicCfg));
    }

    // Lichtgewicht endpoint dat alleen de cache-version teruggeeft. De frontend
    // pollt dit (goedkoop) en triggert een refetch van /api/site-config wanneer
    // het versienummer wijzigt — zo zien publieke clients admin-aanpassingen
    // snel zonder dat de site_config-query elke 60s onnodig data ophaalt.
    if (method === "GET" && path === "/api/site-config/version") {
      const { data } = await supabase.from("site_config").select("cache_version").limit(1).single();
      return res.status(200).json({ cacheVersion: (data as any)?.cache_version ?? 0 });
    }

    // -----------------------------------------------------------------------
    // CATEGORIES (mapped from specialization)
    // -----------------------------------------------------------------------
    if (method === "GET" && path === "/api/categories") {
      const { specializations, serviceCategories } = await getCatalogs();
      return res.status(200).json(specializations.map((s) => legacyCategoryFromSpec(s, serviceCategories)));
    }

    // Normalized catalog endpoints (vertical-agnostic naming).
    if (method === "GET" && path === "/api/service-categories") {
      const { serviceCategories } = await getCatalogs();
      return res.status(200).json(serviceCategories.map((c) => ({
        id: c.id, name: c.name, slug: c.slug, description: c.description, sortOrder: c.sort_order,
      })));
    }
    if (method === "GET" && path === "/api/specializations") {
      const { specializations, serviceCategories } = await getCatalogs();
      return res.status(200).json(specializations.map((s) => ({
        id: s.id, name: s.name, slug: s.slug, description: s.description,
        serviceCategorySlug: serviceCategories.find((c) => c.id === s.service_category_id)?.slug ?? null,
        sortOrder: s.sort_order,
      })));
    }
    // Catalog of services offered (vertical-agnostic). UI uses this to let
    // practitioners tag their profile with concrete deliverables.
    if (method === "GET" && path === "/api/offered-services") {
      // offered_service is een vlakke catalogus — er bestaat geen
      // service_category_id of key kolom in het schema (zie shared/schema.ts).
      const { data, error } = await supabase
        .from("offered_service")
        .select("id,name,slug,description,sort_order")
        .order("sort_order");
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json((data || []).map((o: any) => ({
        id: o.id, name: o.name, slug: o.slug,
        description: o.description, sortOrder: o.sort_order,
      })));
    }
    if (method === "GET" && path === "/api/practical-questions") {
      const { data: questions } = await supabase
        .from("practical_question").select("*").order("sort_order");
      const { data: options } = await supabase
        .from("practical_option").select("*").order("sort_order");
      const out = (questions || []).map((q: any) => ({
        id: q.id,
        key: q.key,
        camelKey: q.key.charAt(0).toLowerCase() + q.key.slice(1),
        name: q.name,
        fieldType: q.field_type,
        isMulti: q.is_multi,
        isRequired: q.is_required,
        sortOrder: q.sort_order,
        options: (options || []).filter((o: any) => o.practical_question_id === q.id)
          .map((o: any) => ({ id: o.id, key: o.key, name: o.name })),
      }));
      return res.status(200).json(out);
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
      const hydrated = await Promise.all(paginated.map((p) => hydrateProfile(p)));
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
      const row = data as { is_active?: boolean; is_public?: boolean; practitioner_id: string };
      // Publieke toegang enkel voor actieve én publieke profielen; eigenaar mag altijd zijn eigen profiel zien
      if (!row.is_active || !row.is_public) {
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
      const { data } = await supabase.from("profile").select("*").eq("slug", slug).eq("is_active", true).eq("is_public", true).single();
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

    if (method === "DELETE" && path.match(/^\/api\/contact-requests\/[^/]+$/)) {
      const reqId = path.split("/").pop()!;
      const auth = await getAuthContext(req);
      if (!auth || !auth.practitionerId) return res.status(401).json({ error: "Unauthorized" });
      const { data: cr } = await supabase.from("contact_request").select("profile_id").eq("id", reqId).maybeSingle();
      if (!cr) return res.status(404).json({ error: "Not found" });
      const { data: prof } = await supabase.from("profile").select("practitioner_id").eq("id", (cr as { profile_id: string }).profile_id).maybeSingle();
      if (!prof || (prof as { practitioner_id: string }).practitioner_id !== auth.practitionerId) {
        return res.status(403).json({ error: "Forbidden" });
      }
      const { error } = await supabase.from("contact_request").delete().eq("id", reqId);
      if (error) throw error;
      return res.status(200).json({ success: true });
    }

    if (method === "POST" && path.match(/^\/api\/contact\/[^/]+$/)) {
      const profileId = path.split("/").pop();
      const { data: profile } = await supabase.from("profile").select("id, company_name, contact_email, is_active, is_public").eq("id", profileId).single();
      if (!profile || !(profile as { is_active: boolean }).is_active || !(profile as { is_public: boolean }).is_public) {
        return res.status(404).json({ error: "Profile not found" });
      }

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
              from: SITE_EMAIL_FROM,
              to: [targetEmail],
              reply_to: visitorEmail,
              subject: `Nieuw contactverzoek: ${subject}`,
              html: `<p>Je hebt een nieuw contactverzoek ontvangen van <b>${escapeHtml(visitorName)}</b> (${escapeHtml(visitorEmail)}).</p>
                <p>${telnr ? `Telefoon: ${escapeHtml(telnr)}<br>` : ""}Onderwerp: ${escapeHtml(subject)}</p>
                <pre>${escapeHtml(message)}</pre>`,
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
      if (!ALLOWED_IMAGE_MIMES.has(file.mime.toLowerCase()) || !ALLOWED_IMAGE_EXTS.has(ext)) {
        return res.status(400).json({ error: "Only JPEG, PNG, WebP or GIF images are allowed" });
      }
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
      // introduction & description collapse into the single `introduction` column.
      // Prefer non-empty introduction; only fall back to description when introduction
      // is missing/empty so the longer description never silently wipes the intro.
      if (body.introduction !== undefined && String(body.introduction).trim() !== "") {
        update.introduction = body.introduction;
      } else if (body.description !== undefined && String(body.description).trim() !== "") {
        update.introduction = body.description;
      } else if (body.introduction === "" || body.description === "") {
        update.introduction = body.introduction ?? body.description ?? "";
      }
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
      const pages = [
        "over-ons",
        "contact",
        "faq",
        "prijzen",
        "artikelen",
        "ervaringen",
        "info/de-tuinman",
        "info/goede-tuinman-vinden",
        "info/hoe-werkt-tuinaanleg",
        "info/tuinman-vs-hovenier",
        "info/kosten-prijzen",
        "info/voor-tuinmannen",
        "privacy",
        "algemene-voorwaarden",
        "cookies",
      ];
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
      const { profileId, accountId, planId, offerId } = req.body || {};
      if (!profileId || (!planId && !offerId)) return res.status(400).json({ error: "Missing fields" });
      const { data: ownerCheck } = await supabase.from("profile").select("practitioner_id").eq("id", profileId).maybeSingle();
      if (!ownerCheck) return res.status(404).json({ error: "Profile not found" });
      if ((ownerCheck as { practitioner_id: string }).practitioner_id !== auth.practitionerId) return res.status(403).json({ error: "Forbidden" });

      const mollieApiKey = process.env.MOLLIE_API_KEY;
      if (!mollieApiKey) return res.status(503).json({ error: "Payment service not configured" });

      // Prefer offerId (DB uuid). Fallback: legacy planId "{N}-year" → duration_in_years for back-compat.
      let offer: any = null;
      if (offerId) {
        const { data } = await supabase
          .from("subscription_plan_offer")
          .select("*, subscription_plan(*)")
          .eq("id", offerId)
          .eq("is_active", true)
          .maybeSingle();
        offer = data;
      } else {
        const years = parseInt(String(planId).split("-")[0]);
        if (!years) return res.status(400).json({ error: "Invalid planId" });
        const { data } = await supabase
          .from("subscription_plan_offer")
          .select("*, subscription_plan(*)")
          .eq("duration_in_years", years)
          .eq("is_active", true)
          .limit(1)
          .maybeSingle();
        offer = data;
      }
      if (!offer) return res.status(400).json({ error: "Plan not found" });
      const years = (offer as any).duration_in_years;

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

      const baseUrl = SITE_BASE_URL;
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

    // -----------------------------------------------------------------------
    // ADMIN
    // -----------------------------------------------------------------------
    if (method === "GET" && path === "/api/admin/me") {
      const adm = await requireAdmin(req);
      if (!adm) return res.status(403).json({ isAdmin: false });
      return res.status(200).json({ isAdmin: true, adminId: adm.adminId });
    }

    // Admin: profielen lijst (met optionele status-filter)
    if (method === "GET" && path === "/api/admin/profiles") {
      const adm = await requireAdmin(req);
      if (!adm) return res.status(403).json({ error: "Forbidden" });
      const status = url.searchParams.get("status");
      let q = supabase.from("profile").select("*").order("created_at", { ascending: false });
      if (status) q = q.eq("verification_status", status);
      const { data, error } = await q;
      if (error) throw error;
      return res.status(200).json(toCamelCase(data || []));
    }

    if (method === "GET" && path.match(/^\/api\/admin\/profiles\/[^/]+$/)) {
      const adm = await requireAdmin(req);
      if (!adm) return res.status(403).json({ error: "Forbidden" });
      const id = path.split("/").pop()!;
      const { data: prof } = await supabase.from("profile").select("*").eq("id", id).maybeSingle();
      if (!prof) return res.status(404).json({ error: "Profile not found" });
      const hydrated = await hydrateProfile(prof, { withPracticals: true });
      const { data: events } = await supabase
        .from("practitioner_verification_event")
        .select("*")
        .eq("profile_id", id)
        .order("created_at", { ascending: false });
      const { data: practitioner } = await supabase
        .from("practitioner")
        .select("id,email,firstname,lastname,company_name")
        .eq("id", (prof as any).practitioner_id)
        .maybeSingle();
      return res.status(200).json({
        profile: hydrated,
        events: toCamelCase(events || []),
        practitioner: toCamelCase(practitioner || null),
      });
    }

    if (method === "POST" && path.match(/^\/api\/admin\/profiles\/[^/]+\/verify$/)) {
      const adm = await requireAdmin(req);
      if (!adm) return res.status(403).json({ error: "Forbidden" });
      const id = path.split("/")[4];
      const { action, reason } = req.body || {};
      if (!["APPROVE", "REJECT", "RESET"].includes(action)) return res.status(400).json({ error: "Invalid action" });
      if ((action === "APPROVE" || action === "REJECT") && !reason) return res.status(400).json({ error: "Reden is verplicht" });
      const toStatus = action === "APPROVE" ? "APPROVED" : action === "REJECT" ? "REJECTED" : "PENDING";
      // Atomisch: status-update + audit-event in één Postgres-transactie via
      // RPC, zodat de audit nooit kan ontbreken bij een statuswijziging.
      const { data: rpcData, error: rpcErr } = await supabase.rpc("verify_profile_atomic", {
        p_profile_id: id,
        p_to_status: toStatus,
        p_reason: reason || null,
        p_actor_admin_id: adm.adminId,
      });
      if (rpcErr) {
        if (rpcErr.code === "P0002") return res.status(404).json({ error: "Profile not found" });
        return res.status(500).json({ error: `Verification failed: ${rpcErr.message}` });
      }
      return res.status(200).json({ success: true, status: toStatus, ...(rpcData as any) });
    }

    // Admin: gebruikers (practitioners)
    if (method === "GET" && path === "/api/admin/users") {
      const adm = await requireAdmin(req);
      if (!adm) return res.status(403).json({ error: "Forbidden" });
      const { data: pracs } = await supabase
        .from("practitioner")
        .select("*, practitioner_type(name,key)")
        .order("created_at", { ascending: false });
      const ids = (pracs || []).map((p: any) => p.id);
      const { data: profiles } = ids.length
        ? await supabase.from("profile").select("id,practitioner_id,company_name,slug,is_active,is_public,verification_status").in("practitioner_id", ids)
        : { data: [] as any[] };
      const profileIds = (profiles || []).map((p: any) => p.id);
      const { data: subs } = profileIds.length
        ? await supabase.from("profile_subscription").select("profile_id,status,end_date").in("profile_id", profileIds)
        : { data: [] as any[] };
      const out = (pracs || []).map((p: any) => {
        const myProfiles = (profiles || []).filter((pr: any) => pr.practitioner_id === p.id);
        const mySubs = (subs || []).filter((s: any) => myProfiles.some((pr: any) => pr.id === s.profile_id));
        const activeSub = mySubs.find((s: any) => s.status === "ACTIVE");
        return {
          ...p,
          profileCount: myProfiles.length,
          activeSubscription: activeSub ? { status: activeSub.status, endDate: activeSub.end_date } : null,
        };
      });
      return res.status(200).json(toCamelCase(out));
    }

    if (method === "GET" && path.match(/^\/api\/admin\/users\/[^/]+$/)) {
      const adm = await requireAdmin(req);
      if (!adm) return res.status(403).json({ error: "Forbidden" });
      const id = path.split("/").pop()!;
      const { data: prac } = await supabase.from("practitioner").select("*, practitioner_type(name,key)").eq("id", id).maybeSingle();
      if (!prac) return res.status(404).json({ error: "User not found" });
      const { data: profiles } = await supabase.from("profile").select("*").eq("practitioner_id", id);
      const profileIds = (profiles || []).map((p: any) => p.id);
      const { data: subs } = profileIds.length
        ? await supabase.from("profile_subscription").select("*, subscription_plan_offer(*, subscription_plan(name,key))").in("profile_id", profileIds).order("created_at", { ascending: false })
        : { data: [] as any[] };
      const subIds = (subs || []).map((s: any) => s.id);
      const { data: payments } = subIds.length
        ? await supabase.from("payment").select("*").in("profile_subscription_id", subIds).order("created_at", { ascending: false })
        : { data: [] as any[] };
      return res.status(200).json(toCamelCase({
        practitioner: prac,
        profiles: profiles || [],
        subscriptions: subs || [],
        payments: payments || [],
      }));
    }

    // Admin: site-config (full, incl. company_vat_number)
    if (method === "GET" && path === "/api/admin/site-config") {
      const adm = await requireAdmin(req);
      if (!adm) return res.status(403).json({ error: "Forbidden" });
      const { data } = await supabase.from("site_config").select("*").limit(1).single();
      if (!data) return res.status(404).json({ error: "Site config not initialized" });
      return res.status(200).json(toCamelCase(data));
    }

    if ((method === "PUT" || method === "PATCH") && path === "/api/admin/site-config") {
      const adm = await requireAdmin(req);
      if (!adm) return res.status(403).json({ error: "Forbidden" });
      // Zod-validatie zodat admin-edits niet stilletjes corrupte typen
      // (bv. string in plaats van number voor BTW) of onverwachte velden
      // wegschrijven naar site_config.
      const SiteConfigUpdate = z.object({
        siteName: z.string().min(1).max(120).optional(),
        siteTagline: z.string().max(240).nullable().optional(),
        supportEmail: z.string().email().or(z.literal("")).optional(),
        defaultCountryCode: z.string().min(2).max(3).optional(),
        defaultCountryName: z.string().min(1).optional(),
        defaultCountryId: z.string().uuid().nullable().or(z.literal("")).optional(),
        defaultRegion: z.string().nullable().or(z.literal("")).optional(),
        defaultLanguage: z.string().min(2).max(10).optional(),
        defaultCurrencyCode: z.string().min(3).max(3).optional(),
        defaultVatPercentage: z.coerce.number().min(0).max(100).optional(),
        companyVatNumber: z.string().nullable().or(z.literal("")).optional(),
        companyLegalName: z.string().nullable().or(z.literal("")).optional(),
        defaultPractitionerTypeId: z.string().uuid().nullable().or(z.literal("")).optional(),
        defaultSubscriptionPlanId: z.string().uuid().nullable().or(z.literal("")).optional(),
        postcodePattern: z.string().nullable().or(z.literal("")).optional(),
        phonePattern: z.string().nullable().or(z.literal("")).optional(),
        phoneCountryCode: z.string().nullable().or(z.literal("")).optional(),
        // themeCopy is een vrije jsonb-blob die over theme.config.ts merget;
        // we accepteren elk record maar weren scalairen/arrays.
        themeCopy: z.record(z.string(), z.any()).nullable().optional(),
      }).strict();
      const parsed = SiteConfigUpdate.safeParse(req.body || {});
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid site_config payload", details: parsed.error.flatten() });
      }
      const body = parsed.data;
      const update: Record<string, any> = {};
      for (const k of Object.keys(body) as Array<keyof typeof body>) {
        const v = (body as any)[k];
        if (v === undefined) continue;
        if (k === "themeCopy") update.theme_copy = v;
        else update[camelToSnake(k as string)] = v === "" ? null : v;
      }
      update.updated_at = new Date().toISOString();
      const { data: existing } = await supabase.from("site_config").select("id").limit(1).single();
      if (!existing) return res.status(404).json({ error: "Site config not initialized" });
      const { data, error } = await supabase.from("site_config").update(update).eq("id", (existing as any).id).select().single();
      if (error) throw error;
      bustCatalogCache();
      return res.status(200).json(toCamelCase(data));
    }

    // Admin: catalog CRUD (generic)
    // Tables supported: service_category, specialization, offered_service, practical_question, practical_option
    const ADMIN_CATALOG_TABLES: Record<string, { table: string; fields: string[] }> = {
      "service-categories": { table: "service_category", fields: ["name", "slug", "description", "sort_order", "is_system_defined"] },
      "specializations": { table: "specialization", fields: ["name", "slug", "description", "service_category_id", "sort_order", "is_system_defined"] },
      "offered-services": { table: "offered_service", fields: ["name", "slug", "description", "sort_order", "is_system_defined"] },
      "practical-questions": { table: "practical_question", fields: ["key", "name", "field_type", "is_multi", "is_required", "sort_order"] },
      "practical-options": { table: "practical_option", fields: ["practical_question_id", "key", "name", "sort_order"] },
      "subscription-plans": { table: "subscription_plan", fields: ["key", "name", "price", "description", "is_active", "sort_order", "valid_from", "valid_until"] },
      "subscription-plan-offers": { table: "subscription_plan_offer", fields: ["subscription_plan_id", "duration_in_years", "discount_percentage", "total_price", "is_popular", "is_active", "valid_from", "valid_until"] },
      // Read-only lookup-tabellen voor FK-dropdowns in /admin/instellingen.
      // Writes zijn expliciet geblokkeerd via READONLY_CATALOGS hieronder —
      // wijzigingen aan deze referentielijsten verlopen via migraties.
      "countries": { table: "country", fields: ["code", "name", "currency_code", "currency_symbol", "default_vat_percentage", "phone_country_code", "postcode_pattern", "is_active"] },
      "practitioner-types": { table: "practitioner_type", fields: ["key", "name", "description"] },
    };
    const READONLY_CATALOGS = new Set(["countries", "practitioner-types"]);

    const adminCatalogListMatch = path.match(/^\/api\/admin\/catalog\/([^/]+)$/);
    if (method === "GET" && adminCatalogListMatch) {
      const adm = await requireAdmin(req);
      if (!adm) return res.status(403).json({ error: "Forbidden" });
      const cfg = ADMIN_CATALOG_TABLES[adminCatalogListMatch[1]];
      if (!cfg) return res.status(404).json({ error: "Unknown catalog" });
      const { data, error } = await supabase.from(cfg.table).select("*");
      if (error) throw error;
      return res.status(200).json(toCamelCase(data || []));
    }

    if (method === "POST" && adminCatalogListMatch) {
      const adm = await requireAdmin(req);
      if (!adm) return res.status(403).json({ error: "Forbidden" });
      const cfg = ADMIN_CATALOG_TABLES[adminCatalogListMatch[1]];
      if (!cfg) return res.status(404).json({ error: "Unknown catalog" });
      if (READONLY_CATALOGS.has(adminCatalogListMatch[1])) {
        return res.status(405).json({ error: "Read-only catalog — wijzigingen lopen via migraties" });
      }
      const body = req.body || {};
      const row: Record<string, any> = {};
      for (const f of cfg.fields) {
        const camel = snakeToCamel(f);
        if (body[camel] !== undefined) row[f] = body[camel] === "" ? null : body[camel];
        else if (body[f] !== undefined) row[f] = body[f] === "" ? null : body[f];
      }
      // Auto-slug uit name
      if (cfg.fields.includes("slug") && !row.slug && row.name) row.slug = generateSlug(row.name);
      const { data, error } = await supabase.from(cfg.table).insert(row).select().single();
      if (error) return res.status(400).json({ error: error.message });
      bustCatalogCache();
      return res.status(201).json(toCamelCase(data));
    }

    const adminCatalogItemMatch = path.match(/^\/api\/admin\/catalog\/([^/]+)\/([^/]+)$/);
    if ((method === "PUT" || method === "PATCH") && adminCatalogItemMatch) {
      const adm = await requireAdmin(req);
      if (!adm) return res.status(403).json({ error: "Forbidden" });
      const cfg = ADMIN_CATALOG_TABLES[adminCatalogItemMatch[1]];
      if (!cfg) return res.status(404).json({ error: "Unknown catalog" });
      if (READONLY_CATALOGS.has(adminCatalogItemMatch[1])) {
        return res.status(405).json({ error: "Read-only catalog — wijzigingen lopen via migraties" });
      }
      const id = adminCatalogItemMatch[2];
      const body = req.body || {};
      const row: Record<string, any> = {};
      for (const f of cfg.fields) {
        const camel = snakeToCamel(f);
        if (body[camel] !== undefined) row[f] = body[camel] === "" ? null : body[camel];
        else if (body[f] !== undefined) row[f] = body[f] === "" ? null : body[f];
      }
      const { data, error } = await supabase.from(cfg.table).update(row).eq("id", id).select().single();
      if (error) return res.status(400).json({ error: error.message });
      bustCatalogCache();
      return res.status(200).json(toCamelCase(data));
    }

    if (method === "DELETE" && adminCatalogItemMatch) {
      const adm = await requireAdmin(req);
      if (!adm) return res.status(403).json({ error: "Forbidden" });
      const cfg = ADMIN_CATALOG_TABLES[adminCatalogItemMatch[1]];
      if (!cfg) return res.status(404).json({ error: "Unknown catalog" });
      if (READONLY_CATALOGS.has(adminCatalogItemMatch[1])) {
        return res.status(405).json({ error: "Read-only catalog — wijzigingen lopen via migraties" });
      }
      const id = adminCatalogItemMatch[2];
      // Bescherm system-defined items tegen delete
      if (cfg.fields.includes("is_system_defined")) {
        const { data: row } = await supabase.from(cfg.table).select("is_system_defined").eq("id", id).maybeSingle();
        if (row && (row as any).is_system_defined) return res.status(400).json({ error: "Systeem-items kunnen niet verwijderd worden. Schakel eerst is_system_defined uit." });
      }
      const { error } = await supabase.from(cfg.table).delete().eq("id", id);
      if (error) return res.status(400).json({ error: error.message });
      bustCatalogCache();
      return res.status(200).json({ success: true });
    }

    // Admin: vertical presets — DB-backed (vertical_preset table). Apply is
    // transactioneel via de Postgres-functie apply_vertical_preset().
    if (method === "GET" && path === "/api/admin/vertical-presets") {
      const adm = await requireAdmin(req);
      if (!adm) return res.status(403).json({ error: "Forbidden" });
      const { data, error } = await supabase
        .from("vertical_preset")
        .select("slug,label,description,is_system_defined,sort_order,config")
        .order("sort_order");
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json((data || []).map((p: any) => {
        const cfg = p.config || {};
        return {
          slug: p.slug,
          label: p.label,
          description: p.description,
          isSystemDefined: p.is_system_defined,
          sortOrder: p.sort_order,
          counts: {
            categories: Array.isArray(cfg.categories) ? cfg.categories.length : 0,
            specializations: Array.isArray(cfg.specializations) ? cfg.specializations.length : 0,
            offeredServices: Array.isArray(cfg.offered_services) ? cfg.offered_services.length : 0,
            practicalQuestions: Array.isArray(cfg.practical_questions) ? cfg.practical_questions.length : 0,
          },
        };
      }));
    }

    // Generieke CRUD voor vertical_preset zelf — admins kunnen een nieuwe
    // verticaal toevoegen/aanpassen zonder code-deploy.
    if (method === "POST" && path === "/api/admin/vertical-presets") {
      const adm = await requireAdmin(req);
      if (!adm) return res.status(403).json({ error: "Forbidden" });
      const body = req.body || {};
      if (!body.slug || !body.label || !body.config) return res.status(400).json({ error: "slug, label, config vereist" });
      const { error } = await supabase.from("vertical_preset").insert({
        slug: body.slug, label: body.label, description: body.description || null,
        config: body.config, is_system_defined: false, sort_order: body.sortOrder ?? 99,
      });
      if (error) return res.status(500).json({ error: error.message });
      return res.status(201).json({ success: true });
    }
    if (method === "PUT" && path.match(/^\/api\/admin\/vertical-presets\/[^/]+$/)) {
      const adm = await requireAdmin(req);
      if (!adm) return res.status(403).json({ error: "Forbidden" });
      const slug = path.split("/")[4];
      const body = req.body || {};
      const upd: any = { updated_at: new Date().toISOString() };
      if (body.label !== undefined) upd.label = body.label;
      if (body.description !== undefined) upd.description = body.description;
      if (body.config !== undefined) upd.config = body.config;
      if (body.sortOrder !== undefined) upd.sort_order = body.sortOrder;
      const { error } = await supabase.from("vertical_preset").update(upd).eq("slug", slug);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ success: true });
    }
    if (method === "DELETE" && path.match(/^\/api\/admin\/vertical-presets\/[^/]+$/)) {
      const adm = await requireAdmin(req);
      if (!adm) return res.status(403).json({ error: "Forbidden" });
      const slug = path.split("/")[4];
      const { data: existing } = await supabase
        .from("vertical_preset").select("is_system_defined").eq("slug", slug).maybeSingle();
      if (!existing) return res.status(404).json({ error: "Preset niet gevonden" });
      if ((existing as any).is_system_defined) {
        return res.status(409).json({ error: "Systeem-presets kunnen niet worden verwijderd" });
      }
      const { error } = await supabase.from("vertical_preset").delete().eq("slug", slug);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ success: true });
    }

    if (method === "POST" && path.match(/^\/api\/admin\/vertical-presets\/[^/]+\/apply$/)) {
      const adm = await requireAdmin(req);
      if (!adm) return res.status(403).json({ error: "Forbidden" });
      const slug = path.split("/")[4];
      // Volledig transactioneel via Postgres-functie. Als ook maar één INSERT/
      // DELETE faalt, rollt PG de hele apply terug — geen partial state mogelijk.
      const { data, error } = await supabase.rpc("apply_vertical_preset", { p_slug: slug });
      if (error) {
        bustCatalogCache();
        return res.status(500).json({ error: `Preset apply mislukt (transactie teruggerold): ${error.message}` });
      }
      bustCatalogCache();
      return res.status(200).json(data);
    }

    // Admin: payments lijst + Peppol resend
    if (method === "GET" && path === "/api/admin/payments") {
      const adm = await requireAdmin(req);
      if (!adm) return res.status(403).json({ error: "Forbidden" });
      const { data } = await supabase
        .from("payment")
        .select("*, profile_subscription(profile_id, profile(company_name, slug, practitioner_id))")
        .order("created_at", { ascending: false })
        .limit(200);
      return res.status(200).json(toCamelCase(data || []));
    }

    if (method === "POST" && path.match(/^\/api\/admin\/peppol\/resend\/[^/]+$/)) {
      const adm = await requireAdmin(req);
      if (!adm) return res.status(403).json({ error: "Forbidden" });
      const paymentId = path.split("/").pop()!;
      const { data: pay } = await supabase.from("payment").select("*").eq("id", paymentId).maybeSingle();
      if (!pay) return res.status(404).json({ error: "Payment not found" });
      const billitApiKey = process.env.BILLIT_API_KEY;
      const billitPartyId = process.env.BILLIT_PARTY_ID;
      const billitSandbox = process.env.BILLIT_SANDBOX === "true";
      if (!billitApiKey) return res.status(503).json({ error: "Billit niet geconfigureerd (BILLIT_API_KEY ontbreekt)" });

      // Schema-pad: payment.profile_subscription_id -> profile_subscription.profile_id
      //             -> profile.practitioner_id -> practitioner (vat, company_name, email, billing_address_id -> address)
      const subscriptionId = (pay as any).profile_subscription_id;
      if (!subscriptionId) return res.status(400).json({ error: "Payment heeft geen profile_subscription_id" });

      const { data: sub } = await supabase
        .from("profile_subscription")
        .select("profile_id")
        .eq("id", subscriptionId)
        .maybeSingle();
      if (!sub || !(sub as any).profile_id) return res.status(400).json({ error: "Profile-subscription niet gevonden" });

      const { data: prof } = await supabase
        .from("profile")
        .select("company_name, practitioner_id")
        .eq("id", (sub as any).profile_id)
        .maybeSingle();
      if (!prof || !(prof as any).practitioner_id) return res.status(400).json({ error: "Profile of practitioner ontbreekt" });

      const { data: prac } = await supabase
        .from("practitioner")
        .select("email, vat, company_name, billing_address_id, subject_to_vat")
        .eq("id", (prof as any).practitioner_id)
        .maybeSingle();
      if (!prac) return res.status(400).json({ error: "Practitioner niet gevonden" });
      const p = prac as any;
      if (!p.vat || !p.billing_address_id) {
        return res.status(400).json({ error: "Practitioner mist BTW-nummer of facturatie-adres — Peppol-resend onmogelijk" });
      }

      const { data: addr } = await supabase
        .from("address")
        .select("street, number, postcode, municipality, country")
        .eq("id", p.billing_address_id)
        .maybeSingle();
      if (!addr) return res.status(400).json({ error: "Facturatie-adres niet gevonden" });
      const ad = addr as any;
      if (!ad.street || !ad.municipality) {
        return res.status(400).json({ error: "Facturatie-adres incompleet (straat/gemeente vereist)" });
      }

      // Amount in payment.amount is double precision (totaal incl. BTW indien practitioner BTW-plichtig is).
      // Voor de Peppol-factuurregel rekenen we excl. BTW terug op basis van site_config-defaults.
      const { data: cfg } = await supabase.from("site_config").select("default_vat_percentage,default_currency_code").limit(1).single();
      const vatPct = (p.subject_to_vat ? Number((cfg as any)?.default_vat_percentage ?? 21) : 0);
      const amount = Number((pay as any).amount || 0);
      const priceExclVat = vatPct > 0 ? amount / (1 + vatPct / 100) : amount;
      const invoiceNumber = `INV-RESEND-${new Date().getFullYear()}-${String(subscriptionId).slice(0, 8).toUpperCase()}`;
      const today = new Date().toISOString().split("T")[0];
      const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

      const customerName = p.company_name || (prof as any).company_name || "Unknown";
      const order = {
        OrderType: "Invoice",
        OrderDirection: "Income",
        OrderDate: today,
        ExpiryDate: dueDate,
        OrderNumber: invoiceNumber,
        OrderLines: [{
          Quantity: 1,
          UnitPriceExcl: priceExclVat,
          Description: `Profielvermelding ${(prof as any).company_name || customerName} (admin-resend)`,
          VATPercentage: vatPct,
        }],
        Customer: {
          Name: customerName,
          VATNumber: p.vat,
          PartyType: "Customer",
          Email: p.email,
          Street: ad.street,
          StreetNumber: ad.number || "",
          Zipcode: ad.postcode || "",
          City: ad.municipality,
          CountryCode: ad.country || "BE",
        },
        Paid: true,
        PaidDate: today,
      };

      const baseUrl = billitSandbox ? "https://api.sandbox.billit.be" : "https://api.billit.be";
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "ApiKey": billitApiKey,
      };
      let endpoint: string;
      let body: any;
      if (billitSandbox) {
        endpoint = `${baseUrl}/v1/einvoices/registrations/${billitPartyId}/commands/send`;
        body = { TransportType: "Peppol", Order: order };
      } else {
        endpoint = `${baseUrl}/v1/peppol/sendOrder`;
        body = order;
      }
      if (billitPartyId) headers["PartyID"] = billitPartyId;

      try {
        const billitRes = await fetch(endpoint, {
          method: "POST",
          headers,
          body: JSON.stringify(body),
        });
        const text = await billitRes.text();
        let result: any;
        try { result = JSON.parse(text); } catch { result = { raw: text }; }

        if (!billitRes.ok) {
          const errCode = result?.errors?.[0]?.Code;
          await supabase.from("payment").update({
            refund_reason: `[peppol-resend FAILED ${new Date().toISOString()}] admin=${adm.adminId} status=${billitRes.status} ${errCode || ""}`.slice(0, 500),
          }).eq("id", paymentId);
          if (errCode === "TheCustomerIsNotActiveOnPeppol") {
            return res.status(409).json({ error: "Klant is niet geregistreerd op het Peppol-netwerk", billitResponse: result });
          }
          return res.status(502).json({ error: `Billit fout (${billitRes.status})`, billitResponse: result });
        }

        const orderId = result?.OrderID || result?.raw || "(unknown)";
        const { error: logErr } = await supabase.from("payment").update({
          refund_reason: `[peppol-resend OK ${new Date().toISOString()}] admin=${adm.adminId} BillitOrderID=${orderId}`.slice(0, 500),
        }).eq("id", paymentId);
        if (logErr) return res.status(500).json({ error: `Resend gelukt maar logging faalde: ${logErr.message}`, billitOrderId: orderId });

        return res.status(200).json({ success: true, message: `Peppol-factuur verstuurd (Billit OrderID ${orderId})`, billitOrderId: orderId });
      } catch (e: any) {
        return res.status(502).json({ error: `Billit-call faalde: ${e.message}` });
      }
    }

    return res.status(404).json({ error: "Not found" });
  } catch (error: any) {
    console.error("API Error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}
