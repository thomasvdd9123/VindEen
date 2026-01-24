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
  offeredServices: "offered_services",
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

function toSnakeCase(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const key in obj) {
    // Use mapping if exists, otherwise keep original key
    const snakeKey = fieldMap[key] || key;
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
      
      const updates = toSnakeCase(req.body);
      updates.updated_at = new Date().toISOString();
      
      console.log("PATCH /api/profiles/:id - Updating profile:", id, "with:", updates);
      
      const { data, error } = await supabase
        .from("profiles")
        .update(updates)
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

    // GET /sitemap.xml
    if (method === "GET" && path === "/sitemap.xml") {
      const baseUrl = "https://www.zoek-een-tuinman.be";
      const today = new Date().toISOString().split("T")[0];

      const [categoriesRes, locationsRes, profilesRes] = await Promise.all([
        supabase.from("categories").select("*"),
        supabase.from("locations").select("*"),
        supabase.from("profiles").select("*").eq("is_public", true),
      ]);

      const categories = categoriesRes.data || [];
      const locations = locationsRes.data || [];
      const profiles = profilesRes.data || [];

      let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/faq</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${baseUrl}/prijzen</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>${baseUrl}/over-ons</loc>
    <changefreq>monthly</changefreq>
    <priority>0.4</priority>
  </url>
  <url>
    <loc>${baseUrl}/contact</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
`;

      for (const category of categories) {
        xml += `  <url>
    <loc>${baseUrl}/zoek/${category.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
        for (const location of locations) {
          xml += `  <url>
    <loc>${baseUrl}/zoek/${category.slug}/${location.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
`;
        }
      }

      for (const profile of profiles) {
        xml += `  <url>
    <loc>${baseUrl}/bedrijf/${profile.slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
`;
      }

      xml += `</urlset>`;

      res.setHeader("Content-Type", "application/xml");
      return res.send(xml);
    }

    // GET /robots.txt
    if (method === "GET" && path === "/robots.txt") {
      const baseUrl = "https://www.zoek-een-tuinman.be";
      const robots = `User-agent: *
Allow: /

Sitemap: ${baseUrl}/sitemap.xml
`;
      res.setHeader("Content-Type", "text/plain");
      return res.send(robots);
    }

    // GET /googlec82c9dc9a541d03e.html (Google Search Console verification)
    if (method === "GET" && path === "/googlec82c9dc9a541d03e.html") {
      res.setHeader("Content-Type", "text/html");
      return res.send("google-site-verification: googlec82c9dc9a541d03e.html");
    }

    return res.status(404).json({ error: "Not found" });
  } catch (error: any) {
    console.error("API Error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}
