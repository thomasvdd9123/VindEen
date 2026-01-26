import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { contactFormSchema, searchParamsSchema, insertSubscriptionItemSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import { supabaseAdmin } from "./lib/supabase";
import { createMolliePayment, getMolliePayment, isPaymentPaid, isPaymentFailed, PRICING_PLANS, PlanId } from "./lib/mollie";
import { sendPaymentConfirmationEmail } from "./lib/resend";
import { sendPeppolInvoice } from "./lib/billit";

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

  // Categories grouped by main category (for filtering/forms)
  app.get("/api/categories/grouped", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      
      // Group categories by mainCategory
      const grouped: Record<string, { key: string; name: string; slug: string; description: string | null }[]> = {
        TUINONDERHOUD: [],
        TUINAANLEG: [],
      };
      
      for (const cat of categories) {
        if (cat.mainCategory && grouped[cat.mainCategory]) {
          grouped[cat.mainCategory].push({
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
      
      res.json({ mainCategories, specializations: grouped });
    } catch (error) {
      console.error("Error fetching grouped categories:", error);
      res.status(500).json({ error: "Failed to fetch grouped categories" });
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
        mainCategory: req.query.mainCategory as string | undefined,
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
        mainCategory: req.query.mainCategory as string | undefined,
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

  // Create or get account (upsert based on authUserId) - used by dashboard
  app.post("/api/accounts", async (req, res) => {
    try {
      const { authUserId, email } = req.body;
      
      if (!authUserId || !email) {
        return res.status(400).json({ error: "authUserId and email are required" });
      }
      
      // Check if account already exists
      const { data: existing } = await supabaseAdmin
        .from("accounts")
        .select("*")
        .eq("auth_user_id", authUserId)
        .single();
      
      if (existing) {
        return res.status(200).json(existing);
      }
      
      // Create new account
      const { data, error } = await supabaseAdmin
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
      return res.status(200).json(data);
    } catch (error) {
      console.error("Error creating/getting account:", error);
      res.status(500).json({ error: "Failed to create/get account" });
    }
  });

  // Legacy endpoint - redirect to /api/accounts
  app.post("/api/businesses", async (req, res) => {
    try {
      const { accountId, email } = req.body;
      // Forward to accounts endpoint with authUserId
      const response = await fetch(`${req.protocol}://${req.get('host')}/api/accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authUserId: accountId, email })
      });
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error) {
      console.error("Error in legacy businesses endpoint:", error);
      res.status(500).json({ error: "Failed to create/get account" });
    }
  });

  // Get account by ID
  app.get("/api/accounts/:id", async (req, res) => {
    try {
      const account = await storage.getAccount(req.params.id);
      if (!account) {
        return res.status(404).json({ error: "Account not found" });
      }
      res.json(account);
    } catch (error) {
      console.error("Error fetching account:", error);
      res.status(500).json({ error: "Failed to fetch account" });
    }
  });

  // Get account by auth user ID (Supabase user UUID)
  app.get("/api/accounts/by-auth/:authUserId", async (req, res) => {
    try {
      const account = await storage.getAccountByAuthUserId(req.params.authUserId);
      if (!account) {
        return res.status(404).json({ error: "Account not found" });
      }
      res.json(account);
    } catch (error) {
      console.error("Error fetching account by auth user:", error);
      res.status(500).json({ error: "Failed to fetch account" });
    }
  });

  // Update account (PATCH)
  app.patch("/api/accounts/:id", async (req, res) => {
    try {
      const updates = req.body;
      const account = await storage.updateAccount(req.params.id, updates);
      if (!account) {
        return res.status(404).json({ error: "Account not found" });
      }
      res.json(account);
    } catch (error) {
      console.error("Error updating account:", error);
      res.status(500).json({ error: "Failed to update account" });
    }
  });

  // Get profiles by account (user's own profiles)
  app.get("/api/my-profiles/:accountId", async (req, res) => {
    try {
      const profiles = await storage.getProfilesByAccountId(req.params.accountId);
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
      
      if (!profileData.accountId) {
        return res.status(400).json({ error: "accountId is required" });
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
        accountId: profileData.accountId,
        slug,
        name: profileData.name,
        email: profileData.email,
        telnr: profileData.telnr || "",
        website: profileData.website || "",
        hasWebsite: profileData.hasWebsite || false,
        title: profileData.title || "",
        introduction: profileData.introduction || "",
        description: profileData.description || "",
        specializations: profileData.specializations || [],
        categoryId: profileData.categoryId,
        locationId: profileData.locationId,
        isActive: profileData.isActive ?? true,
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

  // Legacy endpoint for gardeners - redirects to accounts
  app.post("/api/gardeners", async (req, res) => {
    try {
      const { accountId, email } = req.body;
      
      // Try to find existing account
      let account = await storage.getAccountByAuthUserId(accountId);
      
      if (!account) {
        // Create new account
        account = await storage.createAccount({
          authUserId: accountId,
          email,
          role: "GARDENER",
          emailVerified: true,
        });
      }
      
      res.json(account);
    } catch (error) {
      console.error("Error getting/creating account:", error);
      res.status(500).json({ error: "Failed to get or create account" });
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

  // Create subscription (mock - will be updated for Stripe/Mollie)
  // Extended schema for API request (includes years for date calculation)
  const createSubscriptionApiSchema = insertSubscriptionItemSchema.pick({
    accountId: true,
    profileId: true,
    subscriptionPlanId: true,
    autoRenew: true,
    paymentFrequency: true,
  }).extend({
    years: z.number().min(1).max(3).default(1),
    totalAmount: z.number().positive().optional(), // For logging/future payment integration
  });

  app.post("/api/subscriptions", async (req, res) => {
    try {
      const validationResult = createSubscriptionApiSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: validationResult.error.flatten().fieldErrors 
        });
      }

      const { accountId, profileId, subscriptionPlanId, years, totalAmount, autoRenew, paymentFrequency } = validationResult.data;

      // Calculate dates based on validated years
      const startDate = new Date();
      const endDate = new Date();
      endDate.setFullYear(endDate.getFullYear() + years);

      // Create subscription item (mock - in production, status would be PENDING until payment confirmed)
      const subscriptionItem = await storage.createSubscriptionItem({
        accountId,
        profileId: profileId || null,
        subscriptionPlanId: subscriptionPlanId || null,
        startDate,
        endDate,
        status: "ACTIVE", // For mock flow, set as active immediately
        paymentFrequency: paymentFrequency || "YEARLY",
        autoRenew: autoRenew ?? true,
      });

      console.log(`Created subscription for account ${accountId}:`, {
        id: subscriptionItem.id,
        years,
        totalAmount,
        status: subscriptionItem.status,
      });

      res.json({
        success: true,
        subscriptionId: subscriptionItem.id,
        message: "Subscription created - awaiting payment",
      });
    } catch (error) {
      console.error("Error creating subscription:", error);
      res.status(500).json({ error: "Failed to create subscription" });
    }
  });

  // Get subscriptions for account
  app.get("/api/subscriptions/:accountId", async (req, res) => {
    try {
      const { accountId } = req.params;
      const subscriptions = await storage.getSubscriptionItemsByAccountId(accountId);
      res.json(subscriptions);
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
      res.status(500).json({ error: "Failed to fetch subscriptions" });
    }
  });

  // Get subscription for a specific profile
  app.get("/api/subscriptions/profile/:profileId", async (req, res) => {
    try {
      const { profileId } = req.params;
      const subscription = await storage.getSubscriptionItemByProfileId(profileId);
      res.json(subscription);
    } catch (error) {
      console.error("Error fetching profile subscription:", error);
      res.status(500).json({ error: "Failed to fetch subscription" });
    }
  });

  // ============================================
  // MOLLIE PAYMENT ROUTES
  // ============================================

  // Create Mollie payment for profile subscription
  app.post("/api/mollie/create-payment", async (req, res) => {
    try {
      const { profileId, accountId, planId } = req.body;
      
      if (!profileId || !accountId || !planId) {
        return res.status(400).json({ error: "Missing required fields: profileId, accountId, planId" });
      }

      if (!PRICING_PLANS[planId as PlanId]) {
        return res.status(400).json({ error: "Invalid plan selected" });
      }

      const profile = await storage.getProfileById(profileId);
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }

      const plan = PRICING_PLANS[planId as PlanId];

      // Create subscription with PENDING status first
      const existingSubscription = await storage.getSubscriptionItemByProfileId(profileId);
      let subscriptionItem;
      
      if (existingSubscription) {
        // Update existing subscription to PENDING
        subscriptionItem = await storage.updateSubscriptionItem(existingSubscription.id, {
          status: "PENDING",
          years: plan.years,
          totalAmount: plan.price.toString(),
        });
      } else {
        // Create new subscription in PENDING status
        const startDate = new Date();
        const endDate = new Date();
        endDate.setFullYear(endDate.getFullYear() + plan.years);

        subscriptionItem = await storage.createSubscriptionItem({
          accountId,
          profileId,
          subscriptionPlanId: null,
          startDate,
          endDate,
          years: plan.years,
          totalAmount: plan.price.toString(),
          autoRenew: false,
          paymentFrequency: "YEARLY",
          status: "PENDING",
        });
      }

      // Determine the redirect URL based on environment
      const baseUrl = process.env.REPLIT_DEV_DOMAIN 
        ? `https://${process.env.REPLIT_DEV_DOMAIN}`
        : "https://zoek-een-tuinman.be";

      // Create Mollie payment
      const payment = await createMolliePayment({
        profileId,
        accountId,
        planId: planId as PlanId,
        profileName: profile.name,
        redirectUrl: `${baseUrl}/dashboard/profielen/${profileId}/betaling-status?payment_id=${subscriptionItem.id}`,
      });

      // Store Mollie payment ID in subscription for reference
      await storage.updateSubscriptionItem(subscriptionItem.id, {
        molliePaymentId: payment.id,
      });

      console.log(`Created Mollie payment ${payment.id} for profile ${profileId}`);

      res.json({
        paymentUrl: payment.getCheckoutUrl(),
        paymentId: payment.id,
        subscriptionId: subscriptionItem.id,
      });
    } catch (error: any) {
      console.error("Error creating Mollie payment:", error);
      res.status(500).json({ error: error.message || "Failed to create payment" });
    }
  });

  // Mollie webhook - called by Mollie when payment status changes
  app.post("/api/mollie/webhook", async (req, res) => {
    try {
      const { id: paymentId } = req.body;
      
      if (!paymentId) {
        console.log("Mollie webhook: No payment ID received");
        return res.status(200).send("OK");
      }

      console.log(`Mollie webhook received for payment: ${paymentId}`);

      const payment = await getMolliePayment(paymentId);
      const metadata = payment.metadata as { profileId: string; accountId: string; planId: string; years: number };

      if (!metadata?.profileId) {
        console.error("Mollie webhook: No profileId in payment metadata");
        return res.status(200).send("OK");
      }

      // Find subscription by Mollie payment ID
      const subscription = await storage.getSubscriptionItemByMolliePaymentId(paymentId);
      
      if (!subscription) {
        console.error(`Mollie webhook: No subscription found for payment ${paymentId}`);
        return res.status(200).send("OK");
      }

      if (isPaymentPaid(payment.status)) {
        // Payment successful - activate subscription
        const startDate = new Date();
        const endDate = new Date();
        endDate.setFullYear(endDate.getFullYear() + metadata.years);

        await storage.updateSubscriptionItem(subscription.id, {
          status: "ACTIVE",
          startDate,
          endDate,
          paidAt: new Date(),
        });

        console.log(`Activated subscription ${subscription.id} for profile ${metadata.profileId}`);

        // Fetch profile and account once for emails and invoices
        const profile = await storage.getProfileById(metadata.profileId);
        const account = await storage.getAccountByProfileId(metadata.profileId);
        const plan = PRICING_PLANS[metadata.planId as PlanId];

        // Send payment confirmation email
        try {
          if (account?.email && profile) {
            await sendPaymentConfirmationEmail({
              to: account.email,
              profileName: profile.name,
              amount: plan?.price.toString() || payment.amount?.value || "0",
              years: metadata.years,
              endDate,
            });
          }
        } catch (emailError) {
          console.error("Failed to send confirmation email:", emailError);
        }

        // Send Peppol invoice if account has VAT number and billing info
        try {
          if (account?.vatNumber && account?.billingStreet && account?.billingCity && profile) {
            const priceExclVat = (plan?.price || 0) / 1.21; // Belgian VAT is 21%
            const invoiceNumber = `INV-${new Date().getFullYear()}-${subscription.id.slice(0, 8).toUpperCase()}`;
            
            await sendPeppolInvoice({
              customerName: account.companyName || profile.name || "Unknown",
              customerStreet: account.billingStreet,
              customerStreetNumber: account.billingNumber || "",
              customerZipcode: account.billingPostcode || "",
              customerCity: account.billingCity,
              customerVatNumber: account.vatNumber,
              customerEmail: account.email,
              invoiceNumber,
              invoiceDate: new Date(),
              dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
              description: `Profielvermelding ${profile.name} - ${metadata.years} jaar`,
              amountExclVat: priceExclVat,
              vatPercentage: 21,
              isPaid: true,
              paidDate: new Date(),
            });
            
            console.log(`Sent Peppol invoice ${invoiceNumber} for profile ${metadata.profileId}`);
          }
        } catch (peppolError) {
          console.error("Failed to send Peppol invoice:", peppolError);
        }

        // Send Discord notification
        const discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL;
        if (discordWebhookUrl && profile) {
          try {
            const profileUrl = `https://www.zoek-een-tuinman.be/bedrijf/${profile.slug || ""}`;
            const amount = plan?.price?.toString() || payment.amount?.value || "0";

            await fetch(discordWebhookUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                embeds: [{
                  title: "🌱 Nieuw Betaald Profiel!",
                  color: 0x1B7340,
                  fields: [
                    { name: "Bedrijf", value: account?.companyName || profile.name || "Onbekend", inline: true },
                    { name: "Profiel", value: profile.name || "Onbekend", inline: true },
                    { name: "Bedrag", value: `€${amount}`, inline: true },
                    { name: "Periode", value: `${metadata.years} jaar`, inline: true },
                    { name: "Email", value: account?.email || "Niet beschikbaar", inline: true },
                    { name: "Link", value: `[Bekijk profiel](${profileUrl})`, inline: true },
                  ],
                  timestamp: new Date().toISOString(),
                  footer: { text: "Zoek-een-tuinman.be" },
                }],
              }),
            });
            console.log(`Sent Discord notification for profile ${metadata.profileId}`);
          } catch (discordError) {
            console.error("Failed to send Discord notification:", discordError);
          }
        }
      } else if (isPaymentFailed(payment.status)) {
        // Payment failed
        await storage.updateSubscriptionItem(subscription.id, {
          status: "CANCELLED",
        });

        console.log(`Cancelled subscription ${subscription.id} due to failed payment`);
      }

      res.status(200).send("OK");
    } catch (error) {
      console.error("Error processing Mollie webhook:", error);
      res.status(200).send("OK"); // Always return 200 to Mollie
    }
  });

  // Check payment status (for frontend polling)
  app.get("/api/mollie/payment-status/:subscriptionId", async (req, res) => {
    try {
      const { subscriptionId } = req.params;
      
      const subscription = await storage.getSubscriptionItemById(subscriptionId);
      if (!subscription) {
        return res.status(404).json({ error: "Subscription not found" });
      }

      // If we have a Mollie payment ID, check its current status
      if (subscription.molliePaymentId) {
        try {
          const payment = await getMolliePayment(subscription.molliePaymentId);
          
          // Update local status based on Mollie status
          if (isPaymentPaid(payment.status) && subscription.status !== "ACTIVE") {
            const metadata = payment.metadata as { years: number };
            const startDate = new Date();
            const endDate = new Date();
            endDate.setFullYear(endDate.getFullYear() + (metadata?.years || 1));

            await storage.updateSubscriptionItem(subscription.id, {
              status: "ACTIVE",
              startDate,
              endDate,
              paidAt: new Date(),
            });

            return res.json({
              status: "ACTIVE",
              paymentStatus: payment.status,
              message: "Betaling geslaagd! Je profiel is nu actief.",
            });
          } else if (isPaymentFailed(payment.status)) {
            await storage.updateSubscriptionItem(subscription.id, {
              status: "CANCELLED",
            });

            return res.json({
              status: "CANCELLED",
              paymentStatus: payment.status,
              message: "Betaling mislukt of geannuleerd.",
            });
          }

          return res.json({
            status: subscription.status,
            paymentStatus: payment.status,
            message: subscription.status === "PENDING" ? "Wachten op betaling..." : undefined,
          });
        } catch (mollieError) {
          console.error("Error fetching Mollie payment:", mollieError);
        }
      }

      res.json({
        status: subscription.status,
        message: subscription.status === "ACTIVE" ? "Je profiel is actief." : undefined,
      });
    } catch (error) {
      console.error("Error checking payment status:", error);
      res.status(500).json({ error: "Failed to check payment status" });
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

      // Save contact request to database
      const contactRequest = await storage.createContactRequest({
        profileId: profile.id,
        visitorName: validatedData.visitorName,
        visitorEmail: validatedData.visitorEmail,
        telnr: validatedData.telnr || null,
        subject: validatedData.subject,
        message: validatedData.message,
      });

      // Send email notification to the profile's contact email via Resend
      const resendApiKey = process.env.RESEND_API_KEY;
      if (resendApiKey && profile.email) {
        try {
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${resendApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "Zoek-een-tuinman.be <noreply@zoek-een-tuinman.be>",
              to: [profile.email],
              reply_to: validatedData.visitorEmail,
              subject: `Nieuw contactverzoek: ${validatedData.subject}`,
              html: `
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="utf-8">
                  <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #1B7340; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
                    .header h1 { margin: 0; font-size: 24px; }
                    .content { background: white; padding: 30px; border-radius: 0 0 8px 8px; }
                    .details { background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; }
                    .detail-row { padding: 10px 0; border-bottom: 1px solid #eee; }
                    .detail-row:last-child { border-bottom: none; }
                    .label { color: #666; font-weight: bold; }
                    .message-box { background: #fff; border: 1px solid #e0e0e0; padding: 20px; border-radius: 8px; margin-top: 20px; white-space: pre-wrap; }
                    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
                    .button { display: inline-block; background: #1B7340; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <div class="header">
                      <h1>Nieuw Contactverzoek</h1>
                    </div>
                    <div class="content">
                      <p>Beste ${profile.name},</p>
                      <p>Je hebt een nieuw contactverzoek ontvangen via Zoek-een-tuinman.be!</p>
                      
                      <div class="details">
                        <div class="detail-row">
                          <span class="label">Van:</span> ${validatedData.visitorName}
                        </div>
                        <div class="detail-row">
                          <span class="label">Email:</span> <a href="mailto:${validatedData.visitorEmail}">${validatedData.visitorEmail}</a>
                        </div>
                        ${validatedData.telnr ? `<div class="detail-row"><span class="label">Telefoon:</span> <a href="tel:${validatedData.telnr}">${validatedData.telnr}</a></div>` : ''}
                        <div class="detail-row">
                          <span class="label">Onderwerp:</span> ${validatedData.subject}
                        </div>
                      </div>

                      <p><strong>Bericht:</strong></p>
                      <div class="message-box">${validatedData.message}</div>

                      <p style="margin-top: 30px; text-align: center;">
                        <a href="mailto:${validatedData.visitorEmail}?subject=Re: ${encodeURIComponent(validatedData.subject)}" class="button">Beantwoord dit bericht</a>
                      </p>

                      <p style="margin-top: 30px; color: #666; font-size: 14px;">
                        Je kunt ook alle contactverzoeken bekijken in je <a href="https://www.zoek-een-tuinman.be/dashboard/contacten">dashboard</a>.
                      </p>
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
          console.log(`Sent contact notification email to ${profile.email} for profile ${profile.id}`);
        } catch (emailError) {
          console.error("Failed to send contact notification email:", emailError);
          // Don't fail the request if email fails - contact is still saved
        }
      }

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

    const account = await storage.getAccountByAuthUserId(user.id);
    if (!account || account.id !== profile.accountId) {
      return { authorized: false, error: "Geen toegang tot dit profiel" };
    }

    return { authorized: true };
  }

  // File Upload - Profile Logo
  app.post("/api/profiles/:id/logo", upload.single("file"), async (req, res) => {
    try {
      const profileId = req.params.id as string;
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
      const profileId = req.params.id as string;
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
      const profileId = req.params.id as string;
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

  // ============================================================================
  // SITEMAPS - Multi-sitemap structure like competitor
  // ============================================================================

  const SITEMAP_BASE_URL = "https://www.zoek-een-tuinman.be";
  
  // Specialization slugs for URLs (SPEC_KEY -> url-slug)
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

  // robots.txt - SEO optimized with blocked paths
  app.get("/robots.txt", (req, res) => {
    const robotsTxt = `User-agent: *
Allow: /

# Block non-indexable paths
Disallow: /login
Disallow: /registreren
Disallow: /wachtwoord-vergeten
Disallow: /wachtwoord-reset
Disallow: /onboarding
Disallow: /dashboard
Disallow: /dashboard/*
Disallow: /api/

# Sitemap location
Sitemap: ${SITEMAP_BASE_URL}/sitemap.xml
`;
    res.set("Content-Type", "text/plain");
    res.send(robotsTxt);
  });

  // Main sitemap index - lists all individual sitemaps
  app.get("/sitemap.xml", async (req, res) => {
    try {
      const today = new Date().toISOString().split("T")[0];
      
      // Calculate number of location-spec sitemaps needed (572 locations × 16 specs = 9152, split at 5000)
      const locations = await storage.getLocations();
      const totalLocationSpecs = locations.length * allSpecializations.length;
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

      // Add location-specialization sitemaps (split into multiple files)
      for (let i = 1; i <= locationSpecSitemapCount; i++) {
        xml += `  <sitemap>
    <loc>${SITEMAP_BASE_URL}/sitemaps/location-specs/sitemap-${i}.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
`;
      }

      xml += `</sitemapindex>`;

      res.set("Content-Type", "application/xml");
      res.send(xml);
    } catch (error) {
      console.error("Error generating sitemap index:", error);
      res.status(500).send("Error generating sitemap index");
    }
  });

  // Site sitemap - homepage and main pages
  app.get("/sitemaps/site/sitemap.xml", (req, res) => {
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
    res.set("Content-Type", "application/xml");
    res.send(xml);
  });

  // Info sitemap - static informational pages
  app.get("/sitemaps/info/sitemap.xml", (req, res) => {
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
    res.set("Content-Type", "application/xml");
    res.send(xml);
  });

  // Profiles sitemap - all business profile pages
  app.get("/sitemaps/profiles/sitemap.xml", async (req, res) => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const { profiles } = await storage.searchProfiles({ page: 1, limit: 10000 });

      let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

      for (const profile of profiles) {
        xml += `  <url>
    <loc>${SITEMAP_BASE_URL}/bedrijf/${profile.slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.3</priority>
  </url>
`;
      }

      xml += `</urlset>`;
      res.set("Content-Type", "application/xml");
      res.send(xml);
    } catch (error) {
      console.error("Error generating profiles sitemap:", error);
      res.status(500).send("Error generating profiles sitemap");
    }
  });

  // Locations sitemap - all postal code pages (e.g., /zoek/9000-gent)
  app.get("/sitemaps/locations/sitemap.xml", async (req, res) => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const locations = await storage.getLocations();

      let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

      for (const loc of locations) {
        // URL format: /zoek/{postcode}-{city-slug}
        const locationSlug = `${loc.postcode}-${loc.slug}`;
        xml += `  <url>
    <loc>${SITEMAP_BASE_URL}/zoek/${locationSlug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
`;
      }

      xml += `</urlset>`;
      res.set("Content-Type", "application/xml");
      res.send(xml);
    } catch (error) {
      console.error("Error generating locations sitemap:", error);
      res.status(500).send("Error generating locations sitemap");
    }
  });

  // Specializations sitemap - all specialization-only pages (e.g., /zoek/gras-maaien)
  app.get("/sitemaps/specializations/sitemap.xml", (req, res) => {
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
    res.set("Content-Type", "application/xml");
    res.send(xml);
  });

  // Location + Specialization sitemaps (paginated, 5000 per file)
  // URL format: /zoek/{postcode}-{city}/{specialization}
  app.get("/sitemaps/location-specs/sitemap-:page.xml", async (req, res) => {
    try {
      const page = parseInt(req.params.page) || 1;
      const perPage = 5000;
      const today = new Date().toISOString().split("T")[0];

      const locations = await storage.getLocations();
      
      // Generate all combinations
      const allCombos: { locationSlug: string; specSlug: string }[] = [];
      for (const loc of locations) {
        const locationSlug = `${loc.postcode}-${loc.slug}`;
        for (const [, specSlug] of allSpecializations) {
          allCombos.push({ locationSlug, specSlug });
        }
      }

      // Paginate
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
      res.set("Content-Type", "application/xml");
      res.send(xml);
    } catch (error) {
      console.error("Error generating location-specs sitemap:", error);
      res.status(500).send("Error generating location-specs sitemap");
    }
  });

  // ============================================================================
  // Admin: Fix profiles missing category_id and location_id
  // ============================================================================
  app.post("/api/admin/fix-profile-references", async (req, res) => {
    try {
      // Get all categories and locations
      const { data: categories } = await supabaseAdmin.from("categories").select("*");
      const { data: locations } = await supabaseAdmin.from("locations").select("*");
      const { data: profiles } = await supabaseAdmin.from("profiles").select("*");

      if (!categories || !locations || !profiles) {
        return res.status(500).json({ error: "Failed to fetch data" });
      }

      // Map specialization enum to category slug
      const specToCategorySlug: Record<string, string> = {
        "GRAS_MAAIEN": "gras-maaien",
        "BOMEN_SNOEIEN": "bomen-snoeien",
        "STRUIKEN_SNOEIEN": "struiken-snoeien",
        "HAGEN_KNIPPEN": "hagen-knippen",
        "ONKRUID_VERWIJDEREN": "onkruid-verwijderen",
        "BLADEREN_RUIMEN": "bladeren-ruimen",
        "BEMESTING": "bemesting",
        "GAZONONDERHOUD": "gazononderhoud",
        "GRASAANLEG": "grasaanleg",
        "PADEN_TERRASSEN": "paden-terrassen",
        "HOUTEN_CONSTRUCTIES": "houten-constructies",
        "AFSLUITINGEN": "afsluitingen",
        "VIJVERS": "vijvers",
        "BESTRATING": "bestrating",
        "BEPLANTING": "beplanting",
        "IRRIGATIE": "irrigatie",
      };

      // Map profile name patterns to location slugs
      const profileToLocation: Record<string, string> = {
        "Groene Vingers Tuinen": "gent",
        "De Tuinarchitect Antwerpen": "antwerpen",
        "Bestrating & Terrassen Limburg": "hasselt",
        "Vijver & Waterpartijen Mechelen": "mechelen",
        "Houten Constructies Brugge": "brugge",
        "Houten Tuinconstructies Brugge": "brugge",
        "Irrigatie Specialist Aalst": "aalst",
        "Irrigatie Systemen Aalst": "aalst",
        "Boomzorg West-Vlaanderen": "kortrijk",
        "Tuinonderhoud Leuven": "leuven",
        "Gazon Expert Oostende": "oostende",
        "Gazonspecialist Oostende": "oostende",
        "Gazonspecialist Kortrijk": "kortrijk",
        "Hagenknippers Roeselare": "roeselare",
        "Eco-Onkruidbestrijding Genk": "genk",
        "Onkruidvrij Genk": "genk",
        "Bladgoud Brussel": "brussel",
        "Seizoensonderhoud Brussel": "brussel",
      };

      let updated = 0;
      for (const profile of profiles) {
        let needsUpdate = false;
        const updateData: { category_id?: string; location_id?: string } = {};

        // Fix category_id if missing and profile has specializations
        if (!profile.category_id && profile.specializations?.length > 0) {
          const firstSpec = profile.specializations[0] as string;
          const categorySlug = specToCategorySlug[firstSpec];
          if (categorySlug) {
            const category = categories.find(c => c.slug === categorySlug);
            if (category) {
              updateData.category_id = category.id;
              needsUpdate = true;
            }
          }
        }

        // Fix location_id if missing
        if (!profile.location_id) {
          const locationSlug = profileToLocation[profile.name];
          if (locationSlug) {
            const location = locations.find(l => l.slug === locationSlug);
            if (location) {
              updateData.location_id = location.id;
              needsUpdate = true;
            }
          }
        }

        if (needsUpdate) {
          const { error } = await supabaseAdmin
            .from("profiles")
            .update(updateData)
            .eq("id", profile.id);
          
          if (!error) {
            updated++;
            console.log(`✅ Updated profile: ${profile.name}`, updateData);
          } else {
            console.error(`❌ Failed to update profile: ${profile.name}`, error);
          }
        }
      }

      res.json({ 
        success: true, 
        message: `Updated ${updated} profiles with missing category_id/location_id`,
        updated 
      });
    } catch (error) {
      console.error("Error fixing profile references:", error);
      res.status(500).json({ error: "Failed to fix profile references" });
    }
  });

  return httpServer;
}
