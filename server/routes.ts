import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { contactFormSchema, searchParamsSchema } from "@shared/schema";
import { z } from "zod";

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
      
      if (!profileData.gardenerId) {
        return res.status(400).json({ error: "gardenerId is required" });
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
        gardenerId: profileData.gardenerId,
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
        isVerified: false,
        verificationStatus: "PENDING",
        isFeatured: false,
      });
      
      res.status(201).json(profile);
    } catch (error) {
      console.error("Error creating profile:", error);
      res.status(500).json({ error: "Failed to create profile" });
    }
  });

  // Update profile
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
      
      // Try to find existing gardener
      let gardener = await storage.getGardenerByAccountId(accountId);
      
      if (!gardener) {
        // Create new gardener
        gardener = await storage.createGardener({
          accountId,
          email,
          role: "GARDENER",
          emailVerified: true,
        });
      }
      
      res.json(gardener);
    } catch (error) {
      console.error("Error getting/creating gardener:", error);
      res.status(500).json({ error: "Failed to get or create gardener" });
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

  // Get contact requests for gardener
  app.get("/api/contact-requests/:gardenerId", async (req, res) => {
    try {
      const requests = await storage.getContactRequestsByGardenerId(req.params.gardenerId);
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
        gardenerId: profile.gardenerId,
        profileId: profile.id,
        visitorName: validatedData.visitorName,
        visitorEmail: validatedData.visitorEmail,
        telnr: validatedData.telnr || null,
        subject: validatedData.subject,
        message: validatedData.message,
        status: "NEW",
        gardenerReadAt: null,
        adminNotified: false,
        date: new Date(),
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

  return httpServer;
}
