import type { VercelRequest, VercelResponse } from "@vercel/node";
import express from "express";
import { storage } from "../server/storage";
import { contactFormSchema, searchParamsSchema } from "../shared/schema";
import { z } from "zod";
import { supabaseAdmin } from "../server/lib/supabase";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Categories
app.get("/api/categories", async (req, res) => {
  try {
    const categories = await storage.getCategories();
    res.json(categories);
  } catch (error) {
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
    res.status(500).json({ error: "Failed to fetch category" });
  }
});

// Locations
app.get("/api/locations", async (req, res) => {
  try {
    const locations = await storage.getLocations();
    res.json(locations);
  } catch (error) {
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
    res.status(500).json({ error: "Failed to fetch location" });
  }
});

// Profiles
app.get("/api/profiles/featured", async (req, res) => {
  try {
    const profiles = await storage.getFeaturedProfiles();
    res.json(profiles);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch featured profiles" });
  }
});

app.get("/api/profiles/count", async (req, res) => {
  try {
    const result = await storage.searchProfiles({ page: 1, limit: 1 });
    res.json({ total: result.total });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch profile count" });
  }
});

app.get("/api/profiles/search", async (req, res) => {
  try {
    const params = searchParamsSchema.parse({
      category: req.query.category as string | undefined,
      location: req.query.location as string | undefined,
      query: req.query.query as string | undefined,
      specializations: req.query.specializations
        ? (req.query.specializations as string).split(",")
        : undefined,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 12,
    });
    const result = await storage.searchProfiles(params);
    res.json(result);
  } catch (error) {
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
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

app.get("/api/profiles/by-id/:id", async (req, res) => {
  try {
    const profile = await storage.getProfileById(req.params.id);
    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

app.get("/api/my-profiles/:gardenerId", async (req, res) => {
  try {
    const profiles = await storage.getProfilesByGardenerId(req.params.gardenerId);
    res.json(profiles);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch profiles" });
  }
});

// Gardeners
app.post("/api/gardeners", async (req, res) => {
  try {
    const { accountId, email } = req.body;
    let gardener = await storage.getGardenerByAccountId(accountId);
    
    if (!gardener) {
      gardener = await storage.createGardener({
        accountId,
        email,
        role: "GARDENER",
        emailVerified: true,
      });
    }
    
    res.json(gardener);
  } catch (error) {
    res.status(500).json({ error: "Failed to create/get gardener" });
  }
});

// Subscription Plans
app.get("/api/subscription-plans", async (req, res) => {
  try {
    const plans = await storage.getSubscriptionPlans();
    res.json(plans);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch subscription plans" });
  }
});

// Contact Requests
app.get("/api/contact-requests/:gardenerId", async (req, res) => {
  try {
    const requests = await storage.getContactRequestsByGardenerId(req.params.gardenerId);
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch contact requests" });
  }
});

app.post("/api/contact/:profileId", async (req, res) => {
  try {
    const profile = await storage.getProfileById(req.params.profileId);
    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }
    
    const validatedData = contactFormSchema.parse(req.body);
    const contactRequest = await storage.createContactRequest({
      profileId: req.params.profileId,
      ...validatedData,
      status: "NEW",
    });
    
    res.json(contactRequest);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid form data", details: error.errors });
    }
    res.status(500).json({ error: "Failed to submit contact form" });
  }
});

// Profile CRUD
app.post("/api/profiles", async (req, res) => {
  try {
    const profile = await storage.createProfile(req.body);
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: "Failed to create profile" });
  }
});

app.patch("/api/profiles/:id", async (req, res) => {
  try {
    const profile = await storage.updateProfile(req.params.id, req.body);
    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: "Failed to update profile" });
  }
});

app.delete("/api/profiles/:id", async (req, res) => {
  try {
    await storage.deleteProfile(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete profile" });
  }
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return new Promise((resolve) => {
    app(req as any, res as any, () => {
      resolve(undefined);
    });
  });
}
