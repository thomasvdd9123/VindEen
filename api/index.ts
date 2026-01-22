import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Map camelCase keys to snake_case for database - only known fields
const fieldMap: Record<string, string> = {
  gardenerId: "gardener_id",
  categoryId: "category_id",
  locationId: "location_id",
  logoUrl: "logo_url",
  imageUrls: "image_urls",
  hasWebsite: "has_website",
  isActive: "is_active",
  isPublic: "is_public",
  isVerified: "is_verified",
  isFeatured: "is_featured",
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
  accountId: "account_id",
  emailVerified: "email_verified",
  emailVerifiedAt: "email_verified_at",
  profileId: "profile_id",
  visitorName: "visitor_name",
  visitorEmail: "visitor_email",
  gardenerReadAt: "gardener_read_at",
  adminNotified: "admin_notified",
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

    // GET /api/profiles/featured
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
        .eq("is_featured", true)
        .limit(6);
      
      if (error) throw error;
      return res.status(200).json(data || []);
    }

    // GET /api/profiles/count
    if (method === "GET" && path === "/api/profiles/count") {
      const { count, error } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true)
        .eq("is_public", true);
      
      if (error) throw error;
      return res.status(200).json({ total: count || 0 });
    }

    // GET /api/profiles/search
    if (method === "GET" && path === "/api/profiles/search") {
      const category = url.searchParams.get("category");
      const location = url.searchParams.get("location");
      const query = url.searchParams.get("query") || url.searchParams.get("q");
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

      if (query) {
        queryBuilder = queryBuilder.or(`name.ilike.%${query}%,introduction.ilike.%${query}%,title.ilike.%${query}%`);
      }

      const { data, count, error } = await queryBuilder
        .range(offset, offset + limit - 1);

      if (error) throw error;

      const total = count || 0;
      const totalPages = Math.ceil(total / limit);

      return res.status(200).json({
        profiles: data || [],
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
      return res.status(200).json(data);
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
      return res.status(200).json(data);
    }

    // GET /api/my-profiles/:gardenerId
    if (method === "GET" && path.match(/^\/api\/my-profiles\/[^/]+$/)) {
      const gardenerId = path.split("/").pop();
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("gardener_id", gardenerId);
      
      if (error) throw error;
      return res.status(200).json(data || []);
    }

    // POST /api/gardeners
    if (method === "POST" && path === "/api/gardeners") {
      const { accountId, email } = req.body;
      
      const { data: existing } = await supabase
        .from("gardeners")
        .select("*")
        .eq("account_id", accountId)
        .single();
      
      if (existing) {
        return res.status(200).json(existing);
      }
      
      const { data, error } = await supabase
        .from("gardeners")
        .insert({
          account_id: accountId,
          email,
          role: "GARDENER",
          email_verified: true,
        })
        .select()
        .single();
      
      if (error) throw error;
      return res.status(200).json(data);
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

    // GET /api/contact-requests/:gardenerId
    if (method === "GET" && path.match(/^\/api\/contact-requests\/[^/]+$/)) {
      const gardenerId = path.split("/").pop();
      const { data, error } = await supabase
        .from("contact_requests")
        .select(`*, profile:profiles(name, slug)`)
        .eq("gardener_id", gardenerId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return res.status(200).json(data || []);
    }

    // POST /api/contact/:profileId
    if (method === "POST" && path.match(/^\/api\/contact\/[^/]+$/)) {
      const profileId = path.split("/").pop();
      
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, gardener_id")
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
          gardener_id: profile.gardener_id,
          visitor_name: visitorName,
          visitor_email: visitorEmail,
          telnr: telnr || null,
          subject,
          message,
          status: "NEW",
          date: new Date().toISOString(),
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
      
      if (!profileData.gardenerId) {
        return res.status(400).json({ error: "gardenerId is required" });
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
          gardener_id: profileData.gardenerId,
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
          is_featured: false,
        })
        .select()
        .single();
      
      if (error) throw error;
      return res.status(201).json(data);
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
      return res.status(200).json(data);
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
      return res.status(200).json(data);
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
