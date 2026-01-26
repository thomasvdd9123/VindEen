import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Map camelCase keys to snake_case for database - only known fields
const fieldMap: Record<string, string> = {
  accountId: "account_id",
  categoryId: "category_id",
  locationId: "location_id",
  logoUrl: "logo_url",
  imageUrls: "image_urls",
  hasWebsite: "has_website",
  isActive: "is_active",
  isPublic: "is_public",
  isVerified: "is_verified",
  hideAddress: "hide_address",
  viewCount: "view_count",
  verificationStatus: "verification_status",
  verifiedAt: "verified_at",
  verifiedBy: "verified_by",
  rejectionReason: "rejection_reason",
  seoTitle: "seo_title",
  seoDescription: "seo_description",
  // offeredServices: "offered_services", // Column doesn't exist in database
  createdAt: "created_at",
  updatedAt: "updated_at",
  sortOrder: "sort_order",
  authUserId: "auth_user_id",
  emailVerified: "email_verified",
  emailVerifiedAt: "email_verified_at",
  profileId: "profile_id",
  visitorName: "visitor_name",
  visitorEmail: "visitor_email",
  mainCategory: "main_category",
  experienceYears: "experience_years",
  vatNumber: "vat_number",
  companyName: "company_name",
  billingStreet: "billing_street",
  billingNumber: "billing_number",
  billingPostcode: "billing_postcode",
  billingCity: "billing_city",
};

// Fields that should be ignored (don't exist in profiles table - separate tables or UI-only)
const ignoreFields = new Set([
  "offeredServices",
  "offered_services",
  "mainCategories",
  "main_categories",
  "office",
  "practicals",
  "officeStreet",
  "officeNumber",
  "officeTown",
  "officePostcode",
  "office_street",
  "office_number",
  "office_town",
  "office_postcode",
]);

function toSnakeCase(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const key in obj) {
    // Skip fields that don't exist in the database
    if (ignoreFields.has(key)) continue;
    // Use mapping if exists, otherwise keep original key
    const snakeKey = fieldMap[key] || key;
    // Also skip if the mapped key is in ignore list
    if (ignoreFields.has(snakeKey)) continue;
    result[snakeKey] = obj[key];
  }
  return result;
}

// Reverse mapping: snake_case to camelCase
const reverseFieldMap: Record<string, string> = Object.fromEntries(
  Object.entries(fieldMap).map(([camel, snake]) => [snake, camel])
);

function toCamelCase(obj: Record<string, any>): Record<string, any> {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(item => toCamelCase(item));
  
  const result: Record<string, any> = {};
  for (const key in obj) {
    const camelKey = reverseFieldMap[key] || key;
    const value = obj[key];
    // Recursively convert nested objects (but not arrays of primitives)
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[camelKey] = toCamelCase(value);
    } else if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
      result[camelKey] = value.map(item => toCamelCase(item));
    } else {
      result[camelKey] = value;
    }
  }
  return result;
}

// Generate slug from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { method } = req;
  const url = new URL(req.url!, `https://${req.headers.host}`);
  const path = url.pathname;

  res.setHeader("Content-Type", "application/json");

  try {
    // GET /api/categories
    if (method === "GET" && path === "/api/categories") {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      
      if (error) throw error;
      return res.status(200).json(data || []);
    }

    // GET /api/categories/grouped - MUST be before :slug route
    if (method === "GET" && path === "/api/categories/grouped") {
      const { data: categories, error } = await supabase
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      
      if (error) throw error;

      // Group categories by mainCategory
      const grouped: Record<string, { key: string; name: string; slug: string; description: string | null }[]> = {
        TUINONDERHOUD: [],
        TUINAANLEG: [],
      };
      
      for (const cat of categories || []) {
        if (cat.main_category && grouped[cat.main_category]) {
          grouped[cat.main_category].push({
            key: cat.slug.toUpperCase().replace(/-/g, "_"),
            name: cat.name,
            slug: cat.slug,
            description: cat.description,
          });
        }
      }
      
      // Also return main category labels
      const mainCategories = [
        { key: "TUINONDERHOUD", name: "Tuinonderhoud", description: "Onderhoud van bestaande tuinen" },
        { key: "TUINAANLEG", name: "Tuinaanleg", description: "Aanleg van nieuwe tuinen" },
      ];
      
      return res.status(200).json({ mainCategories, specializations: grouped });
    }

    // GET /api/categories/:slug
    if (method === "GET" && path.match(/^\/api\/categories\/[^/]+$/)) {
      const slug = path.split("/").pop();
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("slug", slug)
        .single();
      
      if (error && error.code !== "PGRST116") throw error;
      if (!data) return res.status(404).json({ error: "Category not found" });
      return res.status(200).json(data);
    }

    // GET /api/locations
    if (method === "GET" && path === "/api/locations") {
      const { data, error } = await supabase
        .from("locations")
        .select("*")
        .eq("is_active", true)
        .order("name", { ascending: true });
      
      if (error) throw error;
      return res.status(200).json(data || []);
    }

    // GET /api/locations/:slug
    if (method === "GET" && path.match(/^\/api\/locations\/[^/]+$/)) {
      const slug = path.split("/").pop();
      const { data, error } = await supabase
        .from("locations")
        .select("*")
        .eq("slug", slug)
        .single();
      
      if (error && error.code !== "PGRST116") throw error;
      if (!data) return res.status(404).json({ error: "Location not found" });
      return res.status(200).json(data);
    }

    // GET /api/profiles/featured - now returns verified profiles with high view counts
    if (method === "GET" && path === "/api/profiles/featured") {
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          *,
          category:categories(*),
          location:locations(*),
          office:offices(*),
          practical:practicals(*)
        `)
        .eq("is_active", true)
        .eq("is_public", true)
        .eq("is_verified", true)
        .order("view_count", { ascending: false })
        .limit(6);
      
      if (error) throw error;
      return res.status(200).json(toCamelCase(data || []));
    }

    // GET /api/profiles/count
    if (method === "GET" && path === "/api/profiles/count") {
      const category = url.searchParams.get("category");
      const location = url.searchParams.get("location");
      const query = url.searchParams.get("q");
      const mainCategory = url.searchParams.get("mainCategory");
      const spec = url.searchParams.get("spec");

      let queryBuilder = supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true)
        .eq("is_public", true);

      // Filter by category slug
      if (category) {
        const { data: cat } = await supabase
          .from("categories")
          .select("id")
          .eq("slug", category)
          .single();
        if (cat) {
          queryBuilder = queryBuilder.eq("category_id", cat.id);
        }
      }

      // Filter by location slug
      if (location) {
        const { data: loc } = await supabase
          .from("locations")
          .select("id")
          .eq("slug", location)
          .single();
        if (loc) {
          queryBuilder = queryBuilder.eq("location_id", loc.id);
        }
      }

      // Filter by main category (TUINONDERHOUD or TUINAANLEG)
      if (mainCategory) {
        const { data: cats } = await supabase
          .from("categories")
          .select("id")
          .eq("main_category", mainCategory);
        if (cats && cats.length > 0) {
          const categoryIds = cats.map(c => c.id);
          queryBuilder = queryBuilder.in("category_id", categoryIds);
        }
      }

      // Filter by specialization
      if (spec) {
        queryBuilder = queryBuilder.contains("specializations", [spec]);
      }

      // Filter by search query
      if (query) {
        queryBuilder = queryBuilder.or(`name.ilike.%${query}%,introduction.ilike.%${query}%,title.ilike.%${query}%`);
      }

      const { count, error } = await queryBuilder;
      
      if (error) throw error;
      return res.status(200).json({ total: count || 0 });
    }

    // GET /api/profiles/search
    if (method === "GET" && path === "/api/profiles/search") {
      const category = url.searchParams.get("category");
      const location = url.searchParams.get("location");
      const query = url.searchParams.get("query") || url.searchParams.get("q");
      const mainCategory = url.searchParams.get("mainCategory");
      const spec = url.searchParams.get("spec");
      const page = parseInt(url.searchParams.get("page") || "1");
      const limit = parseInt(url.searchParams.get("limit") || "12");
      const offset = (page - 1) * limit;

      let queryBuilder = supabase
        .from("profiles")
        .select(`
          *,
          category:categories(*),
          location:locations(*),
          office:offices(*),
          practical:practicals(*)
        `, { count: "exact" })
        .eq("is_active", true)
        .eq("is_public", true);

      if (category) {
        const { data: cat } = await supabase
          .from("categories")
          .select("id")
          .eq("slug", category)
          .single();
        if (cat) {
          queryBuilder = queryBuilder.eq("category_id", cat.id);
        }
      }

      if (location) {
        const { data: loc } = await supabase
          .from("locations")
          .select("id")
          .eq("slug", location)
          .single();
        if (loc) {
          queryBuilder = queryBuilder.eq("location_id", loc.id);
        }
      }

      if (mainCategory) {
        // Filter by main category through category relation
        const { data: cats } = await supabase
          .from("categories")
          .select("id")
          .eq("main_category", mainCategory);
        if (cats && cats.length > 0) {
          const categoryIds = cats.map(c => c.id);
          queryBuilder = queryBuilder.in("category_id", categoryIds);
        }
      }

      // Filter by specialization
      if (spec) {
        queryBuilder = queryBuilder.contains("specializations", [spec]);
      }

      if (query) {
        queryBuilder = queryBuilder.or(`name.ilike.%${query}%,introduction.ilike.%${query}%,title.ilike.%${query}%`);
      }

      const { data, count, error } = await queryBuilder
        .range(offset, offset + limit - 1);

      if (error) throw error;

      const total = count || 0;
      const totalPages = Math.ceil(total / limit);

      return res.status(200).json({
        profiles: toCamelCase(data || []),
        total,
        page,
        totalPages,
      });
    }

    // GET /api/profiles/by-id/:id
    if (method === "GET" && path.match(/^\/api\/profiles\/by-id\/[^/]+$/)) {
      const id = path.split("/").pop();
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          *,
          category:categories(*),
          location:locations(*),
          office:offices(*),
          practical:practicals(*)
        `)
        .eq("id", id)
        .single();
      
      if (error && error.code !== "PGRST116") throw error;
      if (!data) return res.status(404).json({ error: "Profile not found" });
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
      return res.status(200).json(toCamelCase(data));
    }

    // GET /api/profiles/:slug (must be after other /api/profiles/ routes)
    if (method === "GET" && path.match(/^\/api\/profiles\/[^/]+$/) && !path.includes("/by-id/")) {
      const slug = path.split("/").pop();
      if (slug === "featured" || slug === "count" || slug === "search") {
        return res.status(404).json({ error: "Not found" });
      }
      
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          *,
          category:categories(*),
          location:locations(*),
          office:offices(*),
          practical:practicals(*)
        `)
        .eq("slug", slug)
        .eq("is_active", true)
        .single();
      
      if (error && error.code !== "PGRST116") throw error;
      if (!data) return res.status(404).json({ error: "Profile not found" });
      
      // Increment view count (fire and forget)
      (async () => {
        try {
          await supabase
            .from("profiles")
            .update({ view_count: (data.view_count || 0) + 1 })
            .eq("id", data.id);
        } catch (err) {
          console.error("Error incrementing view count:", err);
        }
      })();
      
      return res.status(200).json(toCamelCase(data));
    }

    // GET /api/my-profiles/:accountId
    if (method === "GET" && path.match(/^\/api\/my-profiles\/[^/]+$/)) {
      const accountId = path.split("/").pop();
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("account_id", accountId);
      
      if (error) throw error;
      return res.status(200).json(toCamelCase(data || []));
    }

    // POST /api/accounts - get or create account
    if (method === "POST" && path === "/api/accounts") {
      const { authUserId, email } = req.body;
      
      const { data: existing } = await supabase
        .from("accounts")
        .select("*")
        .eq("auth_user_id", authUserId)
        .single();
      
      if (existing) {
        return res.status(200).json(toCamelCase(existing));
      }
      
      const { data, error } = await supabase
        .from("accounts")
        .insert({
          auth_user_id: authUserId,
          email,
          role: "GARDENER",
          email_verified: true,
        })
        .select()
        .single();
      
      if (error) throw error;
      return res.status(200).json(toCamelCase(data));
    }

    // GET /api/accounts/by-auth/:authUserId
    if (method === "GET" && path.match(/^\/api\/accounts\/by-auth\/[^/]+$/)) {
      const authUserId = path.split("/").pop();
      const { data, error } = await supabase
        .from("accounts")
        .select("*")
        .eq("auth_user_id", authUserId)
        .single();
      
      if (error && error.code !== "PGRST116") throw error;
      if (!data) return res.status(404).json({ error: "Account not found" });
      return res.status(200).json(toCamelCase(data));
    }

    // GET /api/accounts/:id
    if (method === "GET" && path.match(/^\/api\/accounts\/[^/]+$/) && !path.includes("/by-auth/")) {
      const id = path.split("/").pop();
      const { data, error } = await supabase
        .from("accounts")
        .select("*")
        .eq("id", id)
        .single();
      
      if (error && error.code !== "PGRST116") throw error;
      if (!data) return res.status(404).json({ error: "Account not found" });
      return res.status(200).json(toCamelCase(data));
    }

    // PATCH /api/accounts/:id
    if (method === "PATCH" && path.match(/^\/api\/accounts\/[^/]+$/) && !path.includes("/by-auth/")) {
      const id = path.split("/").pop();
      const updates = toSnakeCase(req.body);
      updates.updated_at = new Date().toISOString();
      
      const { data, error } = await supabase
        .from("accounts")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return res.status(200).json(toCamelCase(data));
    }

    // GET /api/subscription-plans
    if (method === "GET" && path === "/api/subscription-plans") {
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      
      if (error) throw error;
      return res.status(200).json(data || []);
    }

    // GET /api/contact-requests/:accountId
    if (method === "GET" && path.match(/^\/api\/contact-requests\/[^/]+$/)) {
      const accountId = path.split("/").pop();
      // Contact requests are linked to profiles owned by this account
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id")
        .eq("account_id", accountId);
      
      if (!profiles || profiles.length === 0) {
        return res.status(200).json([]);
      }

      const profileIds = profiles.map(p => p.id);
      const { data, error } = await supabase
        .from("contact_requests")
        .select(`*, profile:profiles(name, slug)`)
        .in("profile_id", profileIds)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return res.status(200).json(data || []);
    }

    // POST /api/contact/:profileId (simplified - no status tracking)
    if (method === "POST" && path.match(/^\/api\/contact\/[^/]+$/)) {
      const profileId = path.split("/").pop();
      
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", profileId)
        .single();
      
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }
      
      const { visitorName, visitorEmail, telnr, subject, message } = req.body;
      
      const { data, error } = await supabase
        .from("contact_requests")
        .insert({
          profile_id: profileId,
          visitor_name: visitorName,
          visitor_email: visitorEmail,
          telnr: telnr || null,
          subject,
          message,
        })
        .select()
        .single();
      
      if (error) throw error;
      return res.status(201).json({ success: true, id: data.id });
    }

    // POST /api/contact-owner (platform contact form)
    if (method === "POST" && path === "/api/contact-owner") {
      const { name, email, subject, message } = req.body;
      
      if (!name || !email || !subject || !message) {
        return res.status(400).json({ error: "All fields are required" });
      }
      
      console.log("Platform contact request:", { name, email, subject, message });
      return res.status(200).json({ success: true });
    }

    // DELETE /api/account/delete
    if (method === "DELETE" && path === "/api/account/delete") {
      return res.status(200).json({ success: true });
    }

    // POST /api/profiles
    if (method === "POST" && path === "/api/profiles") {
      const profileData = req.body;
      
      if (!profileData.accountId) {
        return res.status(400).json({ error: "accountId is required" });
      }
      
      // Generate slug from name
      let baseSlug = generateSlug(profileData.name);
      let slug = baseSlug;
      let counter = 1;
      
      // Check for existing slugs
      let { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .eq("slug", slug)
        .single();
      
      while (existing) {
        slug = `${baseSlug}-${counter}`;
        counter++;
        const result = await supabase
          .from("profiles")
          .select("id")
          .eq("slug", slug)
          .single();
        existing = result.data;
      }
      
      const { data, error } = await supabase
        .from("profiles")
        .insert({
          account_id: profileData.accountId,
          slug,
          name: profileData.name,
          email: profileData.email,
          telnr: profileData.telnr || "",
          website: profileData.website || "",
          has_website: profileData.hasWebsite || false,
          title: profileData.title || "",
          introduction: profileData.introduction || "",
          description: profileData.description || "",
          category_id: profileData.categoryId,
          location_id: profileData.locationId,
          is_active: true,
          is_public: false,
          is_verified: false,
          verification_status: "PENDING",
        })
        .select()
        .single();
      
      if (error) throw error;
      return res.status(201).json(toCamelCase(data));
    }

    // PUT /api/profiles/:id (alias for PATCH)
    if (method === "PUT" && path.match(/^\/api\/profiles\/[^/]+$/) && !path.includes("/by-id/")) {
      const id = path.split("/").pop();
      const slug = path.split("/").pop();
      if (slug === "featured" || slug === "count" || slug === "search") {
        return res.status(404).json({ error: "Not found" });
      }
      
      const updates = toSnakeCase(req.body);
      const { data, error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return res.status(200).json(toCamelCase(data));
    }

    // PATCH /api/profiles/:id
    if (method === "PATCH" && path.match(/^\/api\/profiles\/[^/]+$/) && !path.includes("/by-id/")) {
      const id = path.split("/").pop();
      if (id === "featured" || id === "count" || id === "search") {
        return res.status(404).json({ error: "Not found" });
      }
      
      // Ensure we have a body
      if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({ error: "No update data provided" });
      }
      
      // Use whitelist approach like dev server - only pick known profile fields
      const body = req.body;
      const updateData: Record<string, unknown> = {};
      if (body.name !== undefined) updateData.name = body.name;
      if (body.email !== undefined) updateData.email = body.email;
      if (body.telnr !== undefined) updateData.telnr = body.telnr;
      if (body.website !== undefined) updateData.website = body.website;
      if (body.hasWebsite !== undefined) updateData.has_website = body.hasWebsite;
      if (body.description !== undefined) updateData.description = body.description;
      if (body.introduction !== undefined) updateData.introduction = body.introduction;
      if (body.title !== undefined) updateData.title = body.title;
      if (body.education !== undefined) updateData.education = body.education;
      if (body.specializations !== undefined) updateData.specializations = body.specializations;
      if (body.logoUrl !== undefined) updateData.logo_url = body.logoUrl;
      if (body.imageUrls !== undefined) updateData.image_urls = body.imageUrls;
      if (body.isActive !== undefined) updateData.is_active = body.isActive;
      if (body.isPublic !== undefined) updateData.is_public = body.isPublic;
      if (body.hideAddress !== undefined) updateData.hide_address = body.hideAddress;
      if (body.categoryId !== undefined) updateData.category_id = body.categoryId;
      if (body.locationId !== undefined) updateData.location_id = body.locationId;
      if (body.seoTitle !== undefined) updateData.seo_title = body.seoTitle;
      if (body.seoDescription !== undefined) updateData.seo_description = body.seoDescription;
      updateData.updated_at = new Date().toISOString();
      
      console.log("PATCH /api/profiles/:id - Updating profile:", id, "with:", updateData);
      
      const { data, error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();
      
      if (error) {
        console.error("PATCH /api/profiles/:id - Error:", error);
        throw error;
      }
      
      console.log("PATCH /api/profiles/:id - Success:", data?.id);
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
      return res.status(200).json(toCamelCase(data));
    }

    // DELETE /api/profiles/:id
    if (method === "DELETE" && path.match(/^\/api\/profiles\/[^/]+$/) && !path.includes("/by-id/")) {
      const id = path.split("/").pop();
      const slug = path.split("/").pop();
      if (slug === "featured" || slug === "count" || slug === "search") {
        return res.status(404).json({ error: "Not found" });
      }
      
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
      return res.status(200).json({ success: true });
    }

    // ========================================================================
    // SITEMAPS - Multi-sitemap structure for SEO
    // ========================================================================
    const SITEMAP_BASE_URL = "https://www.zoek-een-tuinman.be";
    
    const specializationSlugs: Record<string, string> = {
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
    const allSpecializations = Object.entries(specializationSlugs);

    // GET /robots.txt
    if (method === "GET" && path === "/robots.txt") {
      const robots = `User-agent: *
Allow: /

Sitemap: ${SITEMAP_BASE_URL}/sitemap.xml
`;
      res.setHeader("Content-Type", "text/plain");
      return res.send(robots);
    }

    // GET /sitemap.xml - Main sitemap index
    if (method === "GET" && path === "/sitemap.xml") {
      const today = new Date().toISOString().split("T")[0];
      const { data: locations } = await supabase.from("locations").select("id");
      const locationCount = locations?.length || 572;
      const totalLocationSpecs = locationCount * allSpecializations.length;
      const locationSpecSitemapCount = Math.ceil(totalLocationSpecs / 5000);

      let xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${SITEMAP_BASE_URL}/sitemaps/site/sitemap.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${SITEMAP_BASE_URL}/sitemaps/info/sitemap.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${SITEMAP_BASE_URL}/sitemaps/profiles/sitemap.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${SITEMAP_BASE_URL}/sitemaps/locations/sitemap.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${SITEMAP_BASE_URL}/sitemaps/specializations/sitemap.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
`;
      for (let i = 1; i <= locationSpecSitemapCount; i++) {
        xml += `  <sitemap>
    <loc>${SITEMAP_BASE_URL}/sitemaps/location-specs/sitemap-${i}.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
`;
      }
      xml += `</sitemapindex>`;
      res.setHeader("Content-Type", "application/xml");
      return res.send(xml);
    }

    // GET /sitemaps/site/sitemap.xml
    if (method === "GET" && path === "/sitemaps/site/sitemap.xml") {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITEMAP_BASE_URL}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${SITEMAP_BASE_URL}/login</loc>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>${SITEMAP_BASE_URL}/registreren</loc>
    <changefreq>monthly</changefreq>
    <priority>0.4</priority>
  </url>
</urlset>`;
      res.setHeader("Content-Type", "application/xml");
      return res.send(xml);
    }

    // GET /sitemaps/info/sitemap.xml
    if (method === "GET" && path === "/sitemaps/info/sitemap.xml") {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITEMAP_BASE_URL}/over-ons</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${SITEMAP_BASE_URL}/contact</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${SITEMAP_BASE_URL}/faq</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${SITEMAP_BASE_URL}/prijzen</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>${SITEMAP_BASE_URL}/hoe-werkt-het</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${SITEMAP_BASE_URL}/voor-tuinmannen</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
</urlset>`;
      res.setHeader("Content-Type", "application/xml");
      return res.send(xml);
    }

    // GET /sitemaps/profiles/sitemap.xml
    if (method === "GET" && path === "/sitemaps/profiles/sitemap.xml") {
      const today = new Date().toISOString().split("T")[0];
      const { data: profiles } = await supabase.from("profiles").select("slug").eq("is_public", true);
      let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;
      for (const profile of profiles || []) {
        xml += `  <url>
    <loc>${SITEMAP_BASE_URL}/bedrijf/${profile.slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.3</priority>
  </url>
`;
      }
      xml += `</urlset>`;
      res.setHeader("Content-Type", "application/xml");
      return res.send(xml);
    }

    // GET /sitemaps/locations/sitemap.xml
    if (method === "GET" && path === "/sitemaps/locations/sitemap.xml") {
      const today = new Date().toISOString().split("T")[0];
      const { data: locations } = await supabase.from("locations").select("slug, postcode");
      let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;
      for (const loc of locations || []) {
        xml += `  <url>
    <loc>${SITEMAP_BASE_URL}/zoek/${loc.postcode}-${loc.slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
`;
      }
      xml += `</urlset>`;
      res.setHeader("Content-Type", "application/xml");
      return res.send(xml);
    }

    // GET /sitemaps/specializations/sitemap.xml
    if (method === "GET" && path === "/sitemaps/specializations/sitemap.xml") {
      const today = new Date().toISOString().split("T")[0];
      let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;
      for (const [, slug] of allSpecializations) {
        xml += `  <url>
    <loc>${SITEMAP_BASE_URL}/zoek/${slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
      }
      xml += `</urlset>`;
      res.setHeader("Content-Type", "application/xml");
      return res.send(xml);
    }

    // GET /sitemaps/location-specs/sitemap-{n}.xml
    const locationSpecMatch = path.match(/^\/sitemaps\/location-specs\/sitemap-(\d+)\.xml$/);
    if (method === "GET" && locationSpecMatch) {
      const page = parseInt(locationSpecMatch[1]) || 1;
      const perPage = 5000;
      const today = new Date().toISOString().split("T")[0];
      const { data: locations } = await supabase.from("locations").select("slug, postcode");

      const allCombos: { locationSlug: string; specSlug: string }[] = [];
      for (const loc of locations || []) {
        const locationSlug = `${loc.postcode}-${loc.slug}`;
        for (const [, specSlug] of allSpecializations) {
          allCombos.push({ locationSlug, specSlug });
        }
      }

      const startIndex = (page - 1) * perPage;
      const endIndex = startIndex + perPage;
      const pageCombos = allCombos.slice(startIndex, endIndex);

      if (pageCombos.length === 0) {
        return res.status(404).send("Sitemap page not found");
      }

      let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;
      for (const combo of pageCombos) {
        xml += `  <url>
    <loc>${SITEMAP_BASE_URL}/zoek/${combo.locationSlug}/${combo.specSlug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
      }
      xml += `</urlset>`;
      res.setHeader("Content-Type", "application/xml");
      return res.send(xml);
    }

    // GET /googlec82c9dc9a541d03e.html (Google Search Console verification)
    if (method === "GET" && path === "/googlec82c9dc9a541d03e.html") {
      res.setHeader("Content-Type", "text/html");
      return res.send("google-site-verification: googlec82c9dc9a541d03e.html");
    }

    // ============================================
    // MOLLIE PAYMENT ROUTES
    // ============================================

    // Pricing plans
    const PRICING_PLANS: Record<string, { years: number; price: number; label: string }> = {
      "1-year": { years: 1, price: 149, label: "1 Jaar" },
      "2-year": { years: 2, price: 249, label: "2 Jaar" },
      "3-year": { years: 3, price: 349, label: "3 Jaar" },
    };

    // GET /api/subscriptions/profile/:profileId
    if (method === "GET" && path.match(/^\/api\/subscriptions\/profile\/[^/]+$/)) {
      const profileId = path.split("/").pop();
      const { data, error } = await supabase
        .from("subscription_items")
        .select("*")
        .eq("profile_id", profileId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      
      if (error && error.code !== "PGRST116") throw error;
      if (!data) return res.status(404).json({ error: "No subscription found" });
      return res.status(200).json(toCamelCase(data));
    }

    // POST /api/mollie/create-payment
    if (method === "POST" && path === "/api/mollie/create-payment") {
      try {
        const { profileId, accountId, planId } = req.body;
        
        console.log("Create payment request:", { profileId, accountId, planId });
        
        if (!profileId || !accountId || !planId) {
          return res.status(400).json({ error: "Missing required fields: profileId, accountId, planId" });
        }

        if (!PRICING_PLANS[planId]) {
          return res.status(400).json({ error: "Invalid plan selected" });
        }

        // Check Mollie API key early
        const mollieApiKey = process.env.MOLLIE_API_KEY;
        if (!mollieApiKey) {
          console.error("MOLLIE_API_KEY not configured");
          return res.status(500).json({ error: "Payment service not configured" });
        }

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("id, name")
          .eq("id", profileId)
          .single();

        if (profileError) {
          console.error("Profile lookup error:", profileError);
          return res.status(500).json({ error: "Database error looking up profile" });
        }

        if (!profile) {
          return res.status(404).json({ error: "Profile not found" });
        }

      const plan = PRICING_PLANS[planId];

      // Check for existing subscription
      const { data: existingSubscription } = await supabase
        .from("subscription_items")
        .select("*")
        .eq("profile_id", profileId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      let subscriptionItem;
      const startDate = new Date();
      const endDate = new Date();
      endDate.setFullYear(endDate.getFullYear() + plan.years);

      if (existingSubscription) {
        // Update existing subscription to PENDING
        const { data, error } = await supabase
          .from("subscription_items")
          .update({
            status: "PENDING",
            years: plan.years,
            total_amount: plan.price.toString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingSubscription.id)
          .select()
          .single();
        
        if (error) throw error;
        subscriptionItem = data;
      } else {
        // Create new subscription in PENDING status
        const { data, error } = await supabase
          .from("subscription_items")
          .insert({
            gardener_id: accountId,
            profile_id: profileId,
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString(),
            years: plan.years,
            total_amount: plan.price.toString(),
            auto_renew: false,
            payment_frequency: "YEARLY",
            status: "PENDING",
          })
          .select()
          .single();
        
        if (error) throw error;
        subscriptionItem = data;
      }

      // Create Mollie payment
      const baseUrl = "https://www.zoek-een-tuinman.be";
      const mollieResponse = await fetch("https://api.mollie.com/v2/payments", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${mollieApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: {
            currency: "EUR",
            value: plan.price.toFixed(2),
          },
          description: `Zoek-een-tuinman.be - ${plan.label} abonnement voor ${profile.name}`,
          redirectUrl: `${baseUrl}/dashboard/profielen/${profileId}/betaling-status?payment_id=${subscriptionItem.id}`,
          webhookUrl: `${baseUrl}/api/mollie/webhook`,
          metadata: {
            profileId,
            accountId,
            planId,
            years: plan.years,
          },
        }),
      });

      if (!mollieResponse.ok) {
        const errorData = await mollieResponse.json();
        console.error("Mollie API error:", errorData);
        return res.status(500).json({ error: "Failed to create payment" });
      }

      const molliePayment = await mollieResponse.json();

      // Store Mollie payment ID
      await supabase
        .from("subscription_items")
        .update({ mollie_payment_id: molliePayment.id })
        .eq("id", subscriptionItem.id);

      console.log(`Created Mollie payment ${molliePayment.id} for profile ${profileId}`);

      return res.status(200).json({
        paymentUrl: molliePayment._links.checkout.href,
        paymentId: molliePayment.id,
        subscriptionId: subscriptionItem.id,
      });
      } catch (paymentError: any) {
        console.error("Payment creation error:", paymentError);
        return res.status(500).json({ error: paymentError.message || "Payment creation failed" });
      }
    }

    // GET /api/mollie/payment-status/:subscriptionId
    if (method === "GET" && path.match(/^\/api\/mollie\/payment-status\/[^/]+$/)) {
      const subscriptionId = path.split("/").pop();
      
      const { data: subscription, error } = await supabase
        .from("subscription_items")
        .select("*")
        .eq("id", subscriptionId)
        .single();
      
      if (error || !subscription) {
        return res.status(404).json({ error: "Subscription not found" });
      }

      // If we have a Mollie payment ID, check its current status
      if (subscription.mollie_payment_id) {
        const mollieApiKey = process.env.MOLLIE_API_KEY;
        if (mollieApiKey) {
          try {
            const mollieResponse = await fetch(`https://api.mollie.com/v2/payments/${subscription.mollie_payment_id}`, {
              headers: { "Authorization": `Bearer ${mollieApiKey}` },
            });
            
            if (mollieResponse.ok) {
              const payment = await mollieResponse.json();
              
              // Update local status based on Mollie status
              if (payment.status === "paid" && subscription.status !== "ACTIVE") {
                const metadata = payment.metadata as { years: number };
                const startDate = new Date();
                const endDate = new Date();
                endDate.setFullYear(endDate.getFullYear() + (metadata?.years || 1));

                await supabase
                  .from("subscription_items")
                  .update({
                    status: "ACTIVE",
                    start_date: startDate.toISOString(),
                    end_date: endDate.toISOString(),
                    paid_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  })
                  .eq("id", subscription.id);

                return res.status(200).json({
                  status: "ACTIVE",
                  mollieStatus: payment.status,
                  message: "Payment successful - subscription activated",
                });
              }

              return res.status(200).json({
                status: subscription.status,
                mollieStatus: payment.status,
              });
            }
          } catch (mollieError) {
            console.error("Error checking Mollie payment:", mollieError);
          }
        }
      }

      return res.status(200).json({
        status: subscription.status,
        mollieStatus: null,
      });
    }

    // POST /api/mollie/webhook
    if (method === "POST" && path === "/api/mollie/webhook") {
      const { id: paymentId } = req.body;
      
      if (!paymentId) {
        console.log("Mollie webhook: No payment ID received");
        return res.status(200).send("OK");
      }

      console.log(`Mollie webhook received for payment: ${paymentId}`);

      // Get payment from Mollie
      const mollieApiKey = process.env.MOLLIE_API_KEY;
      if (!mollieApiKey) {
        console.error("Mollie API key not configured");
        return res.status(200).send("OK");
      }

      const mollieResponse = await fetch(`https://api.mollie.com/v2/payments/${paymentId}`, {
        headers: {
          "Authorization": `Bearer ${mollieApiKey}`,
        },
      });

      if (!mollieResponse.ok) {
        console.error("Failed to fetch payment from Mollie");
        return res.status(200).send("OK");
      }

      const payment = await mollieResponse.json();
      const metadata = payment.metadata as { profileId: string; accountId: string; planId: string; years: number };

      if (!metadata?.profileId) {
        console.error("Mollie webhook: No profileId in payment metadata");
        return res.status(200).send("OK");
      }

      // Find subscription by Mollie payment ID
      const { data: subscription } = await supabase
        .from("subscription_items")
        .select("*")
        .eq("mollie_payment_id", paymentId)
        .single();
      
      if (!subscription) {
        console.error(`Mollie webhook: No subscription found for payment ${paymentId}`);
        return res.status(200).send("OK");
      }

      if (payment.status === "paid") {
        // Payment successful - activate subscription
        const startDate = new Date();
        const endDate = new Date();
        endDate.setFullYear(endDate.getFullYear() + metadata.years);

        await supabase
          .from("subscription_items")
          .update({
            status: "ACTIVE",
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString(),
            paid_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", subscription.id);

        console.log(`Activated subscription ${subscription.id} for profile ${metadata.profileId}`);

        // Send payment confirmation email
        const resendApiKey = process.env.RESEND_API_KEY;
        if (resendApiKey) {
          try {
            // Get profile and account info
            const { data: profile } = await supabase
              .from("profiles")
              .select("name, account_id")
              .eq("id", metadata.profileId)
              .single();
            
            if (profile?.account_id) {
              const { data: account } = await supabase
                .from("accounts")
                .select("email")
                .eq("id", profile.account_id)
                .single();
              
              if (account?.email && profile?.name) {
                const formattedEndDate = endDate.toLocaleDateString("nl-BE", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                });

                await fetch("https://api.resend.com/emails", {
                  method: "POST",
                  headers: {
                    "Authorization": `Bearer ${resendApiKey}`,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    from: "Zoek-een-tuinman.be <noreply@zoek-een-tuinman.be>",
                    to: [account.email],
                    subject: `Betalingsbevestiging - ${profile.name}`,
                    html: `
                      <!DOCTYPE html>
                      <html>
                      <head>
                        <meta charset="utf-8">
                        <style>
                          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
                          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                          .header { background: #1B7340; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
                          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
                          .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
                          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
                          .detail-row:last-child { border-bottom: none; }
                          .label { color: #666; }
                          .value { font-weight: bold; }
                          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
                        </style>
                      </head>
                      <body>
                        <div class="container">
                          <div class="header">
                            <h1 style="margin: 0;">Betaling Geslaagd!</h1>
                          </div>
                          <div class="content">
                            <p>Beste klant,</p>
                            <p>Hartelijk dank voor uw betaling. Uw profiel is nu actief op Zoek-een-tuinman.be!</p>
                            
                            <div class="details">
                              <div class="detail-row">
                                <span class="label">Profiel:</span>
                                <span class="value">${profile.name}</span>
                              </div>
                              <div class="detail-row">
                                <span class="label">Bedrag:</span>
                                <span class="value">€${payment.amount?.value || "0"}</span>
                              </div>
                              <div class="detail-row">
                                <span class="label">Periode:</span>
                                <span class="value">${metadata.years} jaar</span>
                              </div>
                              <div class="detail-row">
                                <span class="label">Geldig tot:</span>
                                <span class="value">${formattedEndDate}</span>
                              </div>
                            </div>

                            <p>Uw profiel is nu zichtbaar voor potentiële klanten. U kunt uw profiel beheren via uw dashboard.</p>
                            
                            <p>Met vriendelijke groeten,<br>Het Zoek-een-tuinman.be Team</p>
                          </div>
                          <div class="footer">
                            <p>© ${new Date().getFullYear()} Zoek-een-tuinman.be - Alle rechten voorbehouden</p>
                          </div>
                        </div>
                      </body>
                      </html>
                    `,
                  }),
                });
                console.log(`Sent payment confirmation email to ${account.email}`);
              }
            }
          } catch (emailError) {
            console.error("Failed to send confirmation email:", emailError);
          }
        }

        // Send Peppol invoice via Billit API if configured
        const billitApiKey = process.env.BILLIT_API_KEY;
        const billitPartyId = process.env.BILLIT_PARTY_ID;
        const billitSandbox = process.env.BILLIT_SANDBOX === "true";
        console.log(`Billit config: key exists=${!!billitApiKey}, partyId=${billitPartyId}, sandbox=${billitSandbox}`);
        
        if (billitApiKey) {
          try {
            const { data: profile } = await supabase
              .from("profiles")
              .select("name, account_id")
              .eq("id", metadata.profileId)
              .single();
            
            if (profile?.account_id) {
              const { data: account } = await supabase
                .from("accounts")
                .select("email, vat_number, company_name, billing_street, billing_number, billing_postcode, billing_city")
                .eq("id", profile.account_id)
                .single();
              
              if (account?.vat_number && account?.billing_street && account?.billing_city) {
                const priceExclVat = parseFloat(payment.amount?.value || "0") / 1.21;
                const invoiceNumber = `INV-${new Date().getFullYear()}-${subscription.id.slice(0, 8).toUpperCase()}`;
                const today = new Date().toISOString().split('T')[0];
                const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

                const billitBaseUrl = billitSandbox 
                  ? "https://api.sandbox.billit.be" 
                  : "https://api.billit.be";
                
                const order = {
                  OrderType: "Invoice",
                  OrderDirection: "Income",
                  OrderDate: today,
                  ExpiryDate: dueDate,
                  OrderNumber: invoiceNumber,
                  OrderLines: [{
                    Quantity: 1,
                    UnitPriceExcl: priceExclVat,
                    Description: `Profielvermelding ${profile.name || "profiel"} - ${metadata.years} jaar`,
                    VATPercentage: 21,
                  }],
                  Customer: {
                    Name: account.company_name || profile.name || "Unknown",
                    VATNumber: account.vat_number,
                    PartyType: "Customer",
                    Email: account.email,
                    Street: account.billing_street,
                    StreetNumber: account.billing_number || "",
                    Zipcode: account.billing_postcode || "",
                    City: account.billing_city,
                    CountryCode: "BE",
                  },
                  Paid: true,
                  PaidDate: today,
                };

                let billitEndpoint: string;
                let requestBody: any;
                const headers: Record<string, string> = {
                  "Content-Type": "application/json",
                  "Accept": "application/json",
                  "ApiKey": billitApiKey,
                };

                if (billitSandbox) {
                  billitEndpoint = `${billitBaseUrl}/v1/einvoices/registrations/${billitPartyId}/commands/send`;
                  requestBody = { TransportType: "Peppol", Order: order };
                  if (billitPartyId) headers["PartyID"] = billitPartyId;
                } else {
                  billitEndpoint = `${billitBaseUrl}/v1/peppol/sendOrder`;
                  requestBody = order;
                  if (billitPartyId) headers["PartyID"] = billitPartyId;
                }

                console.log(`Billit endpoint: ${billitEndpoint}`);

                const peppolResponse = await fetch(billitEndpoint, {
                  method: "POST",
                  headers,
                  body: JSON.stringify(requestBody),
                });
                
                const peppolResponseText = await peppolResponse.text();
                let peppolResult: any;
                try {
                  peppolResult = JSON.parse(peppolResponseText);
                } catch {
                  peppolResult = { OrderID: peppolResponseText };
                }

                if (!peppolResponse.ok) {
                  const errorCode = peppolResult?.errors?.[0]?.Code;
                  if (errorCode === "TheCustomerIsNotActiveOnPeppol") {
                    console.log(`Peppol invoice skipped for ${invoiceNumber}: Customer ${account.vat_number} is not registered on Peppol network`);
                  } else {
                    console.error(`Billit API error (${peppolResponse.status}):`, peppolResult);
                  }
                } else {
                  console.log(`Sent Peppol invoice ${invoiceNumber} for profile ${metadata.profileId}, OrderID: ${peppolResult.OrderID || peppolResult}`);
                }
              }
            }
          } catch (peppolError) {
            console.error("Failed to send Peppol invoice:", peppolError);
          }
        }
      } else if (["failed", "canceled", "expired"].includes(payment.status)) {
        // Payment failed
        await supabase
          .from("subscription_items")
          .update({
            status: "CANCELLED",
            updated_at: new Date().toISOString(),
          })
          .eq("id", subscription.id);

        console.log(`Cancelled subscription ${subscription.id} due to payment status: ${payment.status}`);
      }

      return res.status(200).send("OK");
    }

    return res.status(404).json({ error: "Not found" });
  } catch (error: any) {
    console.error("API Error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}
