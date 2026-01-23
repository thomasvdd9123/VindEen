import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { contactFormSchema, searchParamsSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import { supabaseAdmin } from "./lib/supabase";

const BUCKET_NAME = "uploads";

async function ensureStorageBucket() {
  try {
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    const bucketExists = buckets?.some(b => b.name === BUCKET_NAME);
    
    if (!bucketExists) {
      const { error } = await supabaseAdmin.storage.createBucket(BUCKET_NAME, {
        public: true,
        fileSizeLimit: 5 * 1024 * 1024,
      });
      if (error) {
        console.error("Failed to create storage bucket:", error);
      } else {
        console.log(`Created storage bucket: ${BUCKET_NAME}`);
      }
    }
  } catch (error) {
    console.error("Error checking/creating storage bucket:", error);
  }
}

// Initialize bucket on module load
ensureStorageBucket();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Categories
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  app.get("/api/categories/:slug", async (req, res) => {
    try {
      const category = await storage.getCategoryBySlug(req.params.slug);
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      console.error("Error fetching category:", error);
      res.status(500).json({ error: "Failed to fetch category" });
    }
  });

  // Locations
  app.get("/api/locations", async (req, res) => {
    try {
      const locations = await storage.getLocations();
      res.json(locations);
    } catch (error) {
      console.error("Error fetching locations:", error);
      res.status(500).json({ error: "Failed to fetch locations" });
    }
  });

  app.get("/api/locations/:slug", async (req, res) => {
    try {
      const location = await storage.getLocationBySlug(req.params.slug);
      if (!location) {
        return res.status(404).json({ error: "Location not found" });
      }
      res.json(location);
    } catch (error) {
      console.error("Error fetching location:", error);
      res.status(500).json({ error: "Failed to fetch location" });
    }
  });

  // Profiles
  app.get("/api/profiles/featured", async (req, res) => {
    try {
      const profiles = await storage.getFeaturedProfiles();
      res.json(profiles);
    } catch (error) {
      console.error("Error fetching featured profiles:", error);
      res.status(500).json({ error: "Failed to fetch featured profiles" });
    }
  });

  // Get profile count for search filters
  app.get("/api/profiles/count", async (req, res) => {
    try {
      const params = searchParamsSchema.parse({
        query: req.query.q as string | undefined,
        categorySlug: req.query.category as string | undefined,
        locationSlug: req.query.location as string | undefined,
        specializations: req.query.spec ? [req.query.spec as string] : undefined,
        page: 1,
        limit: 1,
      });

      const result = await storage.searchProfiles(params);
      res.json({ total: result.total });
    } catch (error) {
      console.error("Error counting profiles:", error);
      res.status(500).json({ error: "Failed to count profiles" });
    }
  });

  app.get("/api/profiles/search", async (req, res) => {
    try {
      const params = searchParamsSchema.parse({
        query: req.query.q as string | undefined,
        categorySlug: req.query.category as string | undefined,
        locationSlug: req.query.location as string | undefined,
        specializations: req.query.spec ? [req.query.spec as string] : undefined,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 12,
      });

      const result = await storage.searchProfiles(params);
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid search parameters", details: error.errors });
      }
      console.error("Error searching profiles:", error);
      res.status(500).json({ error: "Failed to search profiles" });
    }
  });

  app.get("/api/profiles/:slug", async (req, res) => {
    try {
      const profile = await storage.getProfileBySlug(req.params.slug);
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }
      
      // Increment view count (don't await to not slow down response)
      storage.incrementProfileViewCount(profile.id).catch(err => {
        console.error("Error incrementing view count:", err);
      });
      
      res.json(profile);
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  // Get profile by ID (for editing)
  app.get("/api/profiles/by-id/:id", async (req, res) => {
    try {
      const profile = await storage.getProfileById(req.params.id);
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }
      res.json(profile);
    } catch (error) {
      console.error("Error fetching profile by ID:", error);
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  // Create or get gardener (upsert based on accountId) - used by dashboard
  app.post("/api/businesses", async (req, res) => {
    try {
      const { accountId, email } = req.body;
      
      if (!accountId || !email) {
        return res.status(400).json({ error: "accountId and email are required" });
      }
      
      // Check if gardener already exists (using gardeners table, not businesses)
      const { data: existing } = await supabaseAdmin
        .from("gardeners")
        .select("*")
        .eq("account_id", accountId)
        .single();
      
      if (existing) {
        return res.status(200).json(existing);
      }
      
      // Create new gardener
      const { data, error } = await supabaseAdmin
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
    } catch (error) {
      console.error("Error creating/getting gardener:", error);
      res.status(500).json({ error: "Failed to create/get gardener" });
    }
  });

  // Get profiles by gardener (user's own profiles)
  app.get("/api/my-profiles/:gardenerId", async (req, res) => {
    try {
      const profiles = await storage.getProfilesByGardenerId(req.params.gardenerId);
      res.json(profiles);
    } catch (error) {
      console.error("Error fetching user profiles:", error);
      res.status(500).json({ error: "Failed to fetch profiles" });
    }
  });

  // Create profile
  app.post("/api/profiles", async (req, res) => {
    try {
      const profileData = req.body;
      
      if (!profileData.businessId) {
        return res.status(400).json({ error: "businessId is required" });
      }
      
      // Generate slug from name
      let baseSlug = profileData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      
      // Check for existing slugs and add number if needed
      let slug = baseSlug;
      let counter = 1;
      let existingProfile = await storage.getProfileBySlug(slug);
      while (existingProfile) {
        slug = `${baseSlug}-${counter}`;
        counter++;
        existingProfile = await storage.getProfileBySlug(slug);
      }
      
      const profile = await storage.createProfile({
        businessId: profileData.businessId,
        slug,
        name: profileData.name,
        email: profileData.email,
        telnr: profileData.telnr || "",
        website: profileData.website || "",
        hasWebsite: profileData.hasWebsite || false,
        title: profileData.title || "",
        introduction: profileData.introduction || "",
        description: profileData.description || "",
        categoryId: profileData.categoryId,
        locationId: profileData.locationId,
        isActive: true,
        isPublic: false,
      });
      
      res.status(201).json(profile);
    } catch (error) {
      console.error("Error creating profile:", error);
      res.status(500).json({ error: "Failed to create profile" });
    }
  });

  // Update profile (PUT)
  app.put("/api/profiles/:id", async (req, res) => {
    try {
      const profile = await storage.updateProfile(req.params.id, req.body);
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }
      res.json(profile);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // Update profile (PATCH - same as PUT for partial updates)
  app.patch("/api/profiles/:id", async (req, res) => {
    try {
      const profile = await storage.updateProfile(req.params.id, req.body);
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }
      res.json(profile);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // Delete profile
  app.delete("/api/profiles/:id", async (req, res) => {
    try {
      await storage.deleteProfile(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting profile:", error);
      res.status(500).json({ error: "Failed to delete profile" });
    }
  });

  // Get or create gardener for user
  app.post("/api/gardeners", async (req, res) => {
    try {
      const { accountId, email } = req.body;
      
      // Try to find existing business
      let business = await storage.getBusinessByAccountId(accountId);
      
      if (!business) {
        // Create new business
        business = await storage.createBusiness({
          accountId,
          email,
          role: "BUSINESS",
          emailVerified: true,
        });
      }
      
      res.json(business);
    } catch (error) {
      console.error("Error getting/creating business:", error);
      res.status(500).json({ error: "Failed to get or create business" });
    }
  });

  // Account deletion
  app.delete("/api/account/delete", async (req, res) => {
    try {
      // Note: In production, this would need proper authentication
      // and would delete all user data from the database
      // For now, return success - the frontend handles Supabase signout
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting account:", error);
      res.status(500).json({ error: "Failed to delete account" });
    }
  });

  // Contact owner (platform contact form)
  app.post("/api/contact-owner", async (req, res) => {
    try {
      const { name, email, subject, message } = req.body;
      
      if (!name || !email || !subject || !message) {
        return res.status(400).json({ error: "All fields are required" });
      }
      
      // For now, just log the contact request
      // In production, this would send an email to the platform owner
      console.log("Platform contact request:", { name, email, subject, message });
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error processing contact request:", error);
      res.status(500).json({ error: "Failed to process contact request" });
    }
  });

  // Subscription plans
  app.get("/api/subscription-plans", async (req, res) => {
    try {
      const plans = await storage.getSubscriptionPlans();
      res.json(plans);
    } catch (error) {
      console.error("Error fetching subscription plans:", error);
      res.status(500).json({ error: "Failed to fetch subscription plans" });
    }
  });

  // Get contact requests for profile
  app.get("/api/contact-requests/:profileId", async (req, res) => {
    try {
      const requests = await storage.getContactRequestsByProfileId(req.params.profileId);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching contact requests:", error);
      res.status(500).json({ error: "Failed to fetch contact requests" });
    }
  });

  // Contact Requests
  app.post("/api/contact/:profileId", async (req, res) => {
    try {
      const profile = await storage.getProfileById(req.params.profileId);
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }

      const validatedData = contactFormSchema.parse(req.body);

      const contactRequest = await storage.createContactRequest({
        profileId: profile.id,
        visitorName: validatedData.visitorName,
        visitorEmail: validatedData.visitorEmail,
        telnr: validatedData.telnr || null,
        subject: validatedData.subject,
        message: validatedData.message,
      });

      res.status(201).json({ success: true, id: contactRequest.id });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid form data", details: error.errors });
      }
      console.error("Error creating contact request:", error);
      res.status(500).json({ error: "Failed to send contact request" });
    }
  });

  // Helper to verify profile ownership
  async function verifyProfileOwnership(req: any, profileId: string): Promise<{ authorized: boolean; error?: string }> {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return { authorized: false, error: "Niet geautoriseerd" };
    }

    const token = authHeader.split(" ")[1];
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error || !user) {
      return { authorized: false, error: "Ongeldige sessie" };
    }

    const profile = await storage.getProfileById(profileId);
    if (!profile) {
      return { authorized: false, error: "Profiel niet gevonden" };
    }

    const business = await storage.getBusinessByAccountId(user.id);
    if (!business || business.id !== profile.businessId) {
      return { authorized: false, error: "Geen toegang tot dit profiel" };
    }

    return { authorized: true };
  }

  // File Upload - Profile Logo
  app.post("/api/profiles/:id/logo", upload.single("file"), async (req, res) => {
    try {
      const profileId = req.params.id;
      const file = req.file;

      // Verify ownership
      const authCheck = await verifyProfileOwnership(req, profileId);
      if (!authCheck.authorized) {
        return res.status(403).json({ error: authCheck.error });
      }

      if (!file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const profile = await storage.getProfileById(profileId);
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }

      // Generate unique filename
      const fileExt = file.originalname.split(".").pop();
      const fileName = `profiles/${profileId}/logo-${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { data, error } = await supabaseAdmin.storage
        .from(BUCKET_NAME)
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
          upsert: true,
        });

      if (error) {
        console.error("Supabase storage error:", error);
        return res.status(500).json({ error: "Failed to upload file" });
      }

      // Get public URL
      const { data: urlData } = supabaseAdmin.storage
        .from(BUCKET_NAME)
        .getPublicUrl(fileName);

      const logoUrl = urlData.publicUrl;

      // Update profile with new logo URL
      await storage.updateProfile(profileId, { logoUrl });

      res.json({ url: logoUrl });
    } catch (error) {
      console.error("Error uploading logo:", error);
      res.status(500).json({ error: "Failed to upload logo" });
    }
  });

  // File Upload - Work Photos
  app.post("/api/profiles/:id/photos", upload.array("files", 10), async (req, res) => {
    try {
      const profileId = req.params.id;
      const files = req.files as Express.Multer.File[];

      // Verify ownership
      const authCheck = await verifyProfileOwnership(req, profileId);
      if (!authCheck.authorized) {
        return res.status(403).json({ error: authCheck.error });
      }

      if (!files || files.length === 0) {
        return res.status(400).json({ error: "No files uploaded" });
      }

      const profile = await storage.getProfileById(profileId);
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }

      const uploadedUrls: string[] = [];

      for (const file of files) {
        const fileExt = file.originalname.split(".").pop();
        const fileName = `profiles/${profileId}/work-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { data, error } = await supabaseAdmin.storage
          .from(BUCKET_NAME)
          .upload(fileName, file.buffer, {
            contentType: file.mimetype,
          });

        if (error) {
          console.error("Supabase storage error:", error);
          continue;
        }

        const { data: urlData } = supabaseAdmin.storage
          .from(BUCKET_NAME)
          .getPublicUrl(fileName);

        uploadedUrls.push(urlData.publicUrl);
      }

      // Merge with existing photos
      const existingUrls = profile.imageUrls || [];
      const newImageUrls = [...existingUrls, ...uploadedUrls];

      // Update profile with new photo URLs
      await storage.updateProfile(profileId, { imageUrls: newImageUrls });

      res.json({ urls: uploadedUrls, allUrls: newImageUrls });
    } catch (error) {
      console.error("Error uploading photos:", error);
      res.status(500).json({ error: "Failed to upload photos" });
    }
  });

  // Delete Work Photo
  app.delete("/api/profiles/:id/photos", async (req, res) => {
    try {
      const profileId = req.params.id;
      const { url } = req.body;

      // Verify ownership
      const authCheck = await verifyProfileOwnership(req, profileId);
      if (!authCheck.authorized) {
        return res.status(403).json({ error: authCheck.error });
      }

      if (!url) {
        return res.status(400).json({ error: "No URL provided" });
      }

      const profile = await storage.getProfileById(profileId);
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }

      // Remove URL from profile
      const existingUrls = profile.imageUrls || [];
      const newImageUrls = existingUrls.filter((u) => u !== url);

      // Try to delete from Supabase Storage
      try {
        const urlParts = url.split(`/${BUCKET_NAME}/`);
        if (urlParts.length > 1) {
          const filePath = urlParts[1];
          await supabaseAdmin.storage.from(BUCKET_NAME).remove([filePath]);
        }
      } catch (storageError) {
        console.error("Error deleting from storage:", storageError);
      }

      // Update profile
      await storage.updateProfile(profileId, { imageUrls: newImageUrls });

      res.json({ success: true, remainingUrls: newImageUrls });
    } catch (error) {
      console.error("Error deleting photo:", error);
      res.status(500).json({ error: "Failed to delete photo" });
    }
  });

  // Sitemap XML
  app.get("/sitemap.xml", async (req, res) => {
    try {
      const baseUrl = "https://www.zoek-een-tuinman.be";
      const today = new Date().toISOString().split("T")[0];

      // Get all data for sitemap
      const [categories, locations, profilesResult] = await Promise.all([
        storage.getCategories(),
        storage.getLocations(),
        storage.searchProfiles({ page: 1, limit: 1000 }),
      ]);
      const profiles = profilesResult.profiles;

      let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Static pages -->
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

      // Category pages
      for (const category of categories) {
        xml += `  <url>
    <loc>${baseUrl}/zoek/${category.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
        // Category + Location combinations
        for (const location of locations) {
          xml += `  <url>
    <loc>${baseUrl}/zoek/${category.slug}/${location.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
`;
        }
      }

      // Profile pages
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

      res.set("Content-Type", "application/xml");
      res.send(xml);
    } catch (error) {
      console.error("Error generating sitemap:", error);
      res.status(500).send("Error generating sitemap");
    }
  });

  // Robots.txt
  app.get("/robots.txt", (req, res) => {
    const baseUrl = "https://www.zoek-een-tuinman.be";
    const robots = `User-agent: *
Allow: /

Sitemap: ${baseUrl}/sitemap.xml
`;
    res.set("Content-Type", "text/plain");
    res.send(robots);
  });

  return httpServer;
}
