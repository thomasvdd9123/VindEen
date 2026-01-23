import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, timestamp, integer, doublePrecision, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const accountRoleEnum = pgEnum("account_role", ["ADMIN", "MODERATOR", "BUSINESS"]);
export const verificationStatusEnum = pgEnum("verification_status", ["PENDING", "APPROVED", "REJECTED"]);
export const subscriptionStatusEnum = pgEnum("subscription_status", ["ACTIVE", "EXPIRED", "CANCELLED"]);
export const subscriptionTypeEnum = pgEnum("subscription_type", ["BRONZE", "SILVER", "GOLD", "BASIC", "PREMIUM"]);
export const paymentFrequencyEnum = pgEnum("payment_frequency", ["MONTHLY", "YEARLY"]);
export const paymentStatusEnum = pgEnum("payment_status", ["PENDING", "PAID", "FAILED", "REFUNDED"]);
export const paymentProviderEnum = pgEnum("payment_provider", ["MOLLIE", "STRIPE", "PAYPAL", "BANKACCOUNT"]);

// Belgian Provinces Enum
export const belgianProvinceEnum = pgEnum("belgian_province", [
  "ANTWERPEN",
  "LIMBURG",
  "OOST_VLAANDEREN",
  "VLAAMS_BRABANT",
  "WEST_VLAANDEREN",
  "BRABANT_WALLON",
  "HAINAUT",
  "LIEGE",
  "LUXEMBOURG",
  "NAMUR",
  "BRUSSEL"
]);

// Belgian Regions Enum
export const belgianRegionEnum = pgEnum("belgian_region", [
  "VLAANDEREN",
  "WALLONIE",
  "BRUSSEL"
]);

// Language Enum
export const languageEnum = pgEnum("language", [
  "NL",
  "FR",
  "DE",
  "EN"
]);

// Main Category Enum (Tuinonderhoud vs Tuinaanleg)
export const mainCategoryEnum = pgEnum("main_category", [
  "TUINONDERHOUD",
  "TUINAANLEG"
]);

// Specialization Enum - subcategories under main categories
export const specializationTypeEnum = pgEnum("specialization_type", [
  // Tuinonderhoud subcategories
  "GRAS_MAAIEN",
  "SNOEIEN_BOMEN",
  "SNOEIEN_STRUIKEN",
  "HAAG_KNIPPEN",
  "ONKRUID_VERWIJDEREN",
  "BLADEREN_RUIMEN",
  "BEMESTING",
  "GAZONONDERHOUD",
  // Tuinaanleg subcategories
  "GRASAANLEG",
  "PADEN_TERRASSEN",
  "HOUTEN_CONSTRUCTIES",
  "AFSLUITINGEN",
  "VIJVERS",
  "BESTRATING",
  "BEPLANTING",
  "IRRIGATIE"
]);

// Categories Table (now represents main categories: Tuinonderhoud/Tuinaanleg)
export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  mainCategory: mainCategoryEnum("main_category").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Locations Table (Belgian cities/municipalities)
export const locations = pgTable("locations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  postcode: text("postcode").notNull(),
  municipality: text("municipality").notNull(),
  province: belgianProvinceEnum("province"),
  region: belgianRegionEnum("region"),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Businesses Table (Account holders - renamed from gardeners for rebranding)
export const businesses = pgTable("businesses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  accountId: varchar("account_id").notNull().unique(),
  email: text("email").notNull(),
  role: accountRoleEnum("role").default("BUSINESS").notNull(),
  emailVerified: boolean("email_verified").default(false),
  emailVerifiedAt: timestamp("email_verified_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Profiles Table
export const profiles = pgTable("profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessId: varchar("business_id").notNull().references(() => businesses.id),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  telnr: text("telnr"),
  website: text("website"),
  hasWebsite: boolean("has_website").default(false),
  description: text("description"),
  introduction: text("introduction"),
  title: text("title"),
  education: text("education"),
  specializations: text("specializations").array(),
  offeredServices: text("offered_services").array(),
  logoUrl: text("logo_url"),
  imageUrls: text("image_urls").array(),
  isActive: boolean("is_active").default(true).notNull(),
  isPublic: boolean("is_public").default(false).notNull(),
  hideAddress: boolean("hide_address").default(false),
  viewCount: integer("view_count").default(0),
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  categoryId: varchar("category_id").references(() => categories.id),
  locationId: varchar("location_id").references(() => locations.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Profile Status History Table (tracks verification status changes over time)
export const profileStatusHistory = pgTable("profile_status_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  profileId: varchar("profile_id").notNull().references(() => profiles.id),
  status: verificationStatusEnum("status").notNull(),
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Offices Table (business address)
export const offices = pgTable("offices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  profileId: varchar("profile_id").notNull().references(() => profiles.id).unique(),
  street: text("street").notNull(),
  number: text("number").notNull(),
  town: text("town").notNull(),
  municipality: text("municipality").notNull(),
  postcode: text("postcode").notNull(),
  province: belgianProvinceEnum("province"),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Practicals Table
export const practicals = pgTable("practicals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  profileId: varchar("profile_id").notNull().references(() => profiles.id).unique(),
  experienceYears: integer("experience_years"),
  languages: languageEnum("languages").array(),
  tariff: text("tariff"),
  acceptedPaymentMethods: text("accepted_payment_methods"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Subscription Plans Table
export const subscriptionPlans = pgTable("subscription_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: subscriptionTypeEnum("type").notNull(),
  name: text("name").notNull(),
  price: doublePrecision("price").notNull(),
  molliepriceId: text("mollie_price_id"),
  mollieProductId: text("mollie_product_id"),
  generalInfo: text("general_info"),
  features: text("features"),
  isActive: boolean("is_active").default(true).notNull(),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Subscription Items Table
export const subscriptionItems = pgTable("subscription_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessId: varchar("business_id").notNull().references(() => businesses.id),
  subscriptionPlanId: varchar("subscription_plan_id").references(() => subscriptionPlans.id),
  mollieSubscriptionId: text("mollie_subscription_id"),
  mollieCustomerId: text("mollie_customer_id"),
  molliePaymentId: text("mollie_payment_id"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  autoRenew: boolean("auto_renew").default(true),
  paymentFrequency: paymentFrequencyEnum("payment_frequency").default("YEARLY"),
  status: subscriptionStatusEnum("status").default("ACTIVE").notNull(),
  mailInvoice: boolean("mail_invoice").default(true),
  gracePeriodUntil: timestamp("grace_period_until"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  canceledAt: timestamp("canceled_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Payments Table
export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  subscriptionItemId: varchar("subscription_item_id").references(() => subscriptionItems.id),
  amount: doublePrecision("amount").notNull(),
  currency: text("currency").default("EUR").notNull(),
  status: paymentStatusEnum("status").default("PENDING").notNull(),
  provider: paymentProviderEnum("provider").default("MOLLIE").notNull(),
  paidAt: timestamp("paid_at"),
  molliePaymentIntentId: text("mollie_payment_intent_id"),
  mollieInvoiceId: text("mollie_invoice_id"),
  invoiceUrl: text("invoice_url"),
  invoicePdfUrl: text("invoice_pdf_url"),
  refundReason: text("refund_reason"),
  refundedAt: timestamp("refunded_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Contact Requests Table (simplified - no status tracking, just log of contact attempts)
export const contactRequests = pgTable("contact_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  profileId: varchar("profile_id").notNull().references(() => profiles.id),
  visitorName: text("visitor_name").notNull(),
  visitorEmail: text("visitor_email").notNull(),
  telnr: text("telnr"),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert Schemas
export const insertCategorySchema = createInsertSchema(categories).omit({ id: true, createdAt: true, updatedAt: true });
export const insertLocationSchema = createInsertSchema(locations).omit({ id: true, createdAt: true, updatedAt: true });
export const insertBusinessSchema = createInsertSchema(businesses).omit({ id: true, createdAt: true, updatedAt: true });
export const insertProfileSchema = createInsertSchema(profiles).omit({ id: true, createdAt: true, updatedAt: true });
export const insertProfileStatusHistorySchema = createInsertSchema(profileStatusHistory).omit({ id: true, createdAt: true });
export const insertOfficeSchema = createInsertSchema(offices).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPracticalSchema = createInsertSchema(practicals).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSubscriptionItemSchema = createInsertSchema(subscriptionItems).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPaymentSchema = createInsertSchema(payments).omit({ id: true, createdAt: true });
export const insertContactRequestSchema = createInsertSchema(contactRequests).omit({ id: true, createdAt: true });

// Types
export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type Location = typeof locations.$inferSelect;
export type InsertLocation = z.infer<typeof insertLocationSchema>;

export type Business = typeof businesses.$inferSelect;
export type InsertBusiness = z.infer<typeof insertBusinessSchema>;

// Keep Gardener as alias for backward compatibility
export type Gardener = Business;
export type InsertGardener = InsertBusiness;

export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = z.infer<typeof insertProfileSchema>;

export type ProfileStatusHistory = typeof profileStatusHistory.$inferSelect;
export type InsertProfileStatusHistory = z.infer<typeof insertProfileStatusHistorySchema>;

export type Office = typeof offices.$inferSelect;
export type InsertOffice = z.infer<typeof insertOfficeSchema>;

export type Practical = typeof practicals.$inferSelect;
export type InsertPractical = z.infer<typeof insertPracticalSchema>;

export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlanSchema>;

export type SubscriptionItem = typeof subscriptionItems.$inferSelect;
export type InsertSubscriptionItem = z.infer<typeof insertSubscriptionItemSchema>;

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;

export type ContactRequest = typeof contactRequests.$inferSelect;
export type InsertContactRequest = z.infer<typeof insertContactRequestSchema>;

// Extended types for API responses
export type ProfileWithRelations = Profile & {
  category?: Category;
  location?: Location;
  office?: Office;
  practical?: Practical;
};

// Contact form validation schema
export const contactFormSchema = z.object({
  visitorName: z.string().min(2, "Naam moet minimaal 2 karakters bevatten"),
  visitorEmail: z.string().email("Ongeldig email adres"),
  telnr: z.string().optional(),
  subject: z.string().min(5, "Onderwerp moet minimaal 5 karakters bevatten"),
  message: z.string().min(20, "Bericht moet minimaal 20 karakters bevatten"),
});

export type ContactFormData = z.infer<typeof contactFormSchema>;

// Search params schema
export const searchParamsSchema = z.object({
  query: z.string().optional(),
  categorySlug: z.string().optional(),
  locationSlug: z.string().optional(),
  mainCategory: z.enum(["TUINONDERHOUD", "TUINAANLEG"]).optional(),
  specializations: z.array(z.string()).optional(),
  page: z.number().default(1),
  limit: z.number().default(12),
});

export type SearchParams = z.infer<typeof searchParamsSchema>;

// Main category labels
export const mainCategoryLabels: Record<string, string> = {
  TUINONDERHOUD: "Tuinonderhoud",
  TUINAANLEG: "Tuinaanleg",
};

// Specialization labels for display (grouped by main category)
export const specializationLabels: Record<string, string> = {
  // Tuinonderhoud
  GRAS_MAAIEN: "Gras maaien",
  SNOEIEN_BOMEN: "Bomen snoeien",
  SNOEIEN_STRUIKEN: "Struiken snoeien",
  HAAG_KNIPPEN: "Hagen knippen",
  ONKRUID_VERWIJDEREN: "Onkruid verwijderen",
  BLADEREN_RUIMEN: "Bladeren ruimen",
  BEMESTING: "Bemesting",
  GAZONONDERHOUD: "Gazononderhoud",
  // Tuinaanleg
  GRASAANLEG: "Grasaanleg",
  PADEN_TERRASSEN: "Paden & terrassen",
  HOUTEN_CONSTRUCTIES: "Houten constructies",
  AFSLUITINGEN: "Afsluitingen & hekwerk",
  VIJVERS: "Vijvers & waterpartijen",
  BESTRATING: "Bestrating",
  BEPLANTING: "Beplanting",
  IRRIGATIE: "Irrigatiesystemen",
};

// Group specializations by main category
export const specializationsByCategory: Record<string, string[]> = {
  TUINONDERHOUD: [
    "GRAS_MAAIEN",
    "SNOEIEN_BOMEN",
    "SNOEIEN_STRUIKEN",
    "HAAG_KNIPPEN",
    "ONKRUID_VERWIJDEREN",
    "BLADEREN_RUIMEN",
    "BEMESTING",
    "GAZONONDERHOUD",
  ],
  TUINAANLEG: [
    "GRASAANLEG",
    "PADEN_TERRASSEN",
    "HOUTEN_CONSTRUCTIES",
    "AFSLUITINGEN",
    "VIJVERS",
    "BESTRATING",
    "BEPLANTING",
    "IRRIGATIE",
  ],
};

// Belgian province labels
export const provinceLabels: Record<string, string> = {
  ANTWERPEN: "Antwerpen",
  LIMBURG: "Limburg",
  OOST_VLAANDEREN: "Oost-Vlaanderen",
  VLAAMS_BRABANT: "Vlaams-Brabant",
  WEST_VLAANDEREN: "West-Vlaanderen",
  BRABANT_WALLON: "Waals-Brabant",
  HAINAUT: "Henegouwen",
  LIEGE: "Luik",
  LUXEMBOURG: "Luxemburg",
  NAMUR: "Namen",
  BRUSSEL: "Brussel",
};

// Belgian region labels
export const regionLabels: Record<string, string> = {
  VLAANDEREN: "Vlaanderen",
  WALLONIE: "Wallonië",
  BRUSSEL: "Brussels Hoofdstedelijk Gewest",
};

// Language labels
export const languageLabels: Record<string, string> = {
  NL: "Nederlands",
  FR: "Frans",
  DE: "Duits",
  EN: "Engels",
};
