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
