import { pgTable, text, uuid, integer, doublePrecision, boolean, timestamp, date, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ---------------------------------------------------------------------------
// CORE: address
// ---------------------------------------------------------------------------
export const address = pgTable("address", {
  id: uuid("id").primaryKey().defaultRandom(),
  street: text("street"),
  number: text("number"),
  municipality: text("municipality"),
  postcode: text("postcode"),
  province: text("province"),
  region: text("region"),
  country: text("country"),
  longitude: doublePrecision("longitude"),
  latitude: doublePrecision("latitude"),
  isResidential: boolean("is_residential").default(false),
  showAddress: boolean("show_address").default(true),
  validFrom: date("valid_from"),
  validUntil: date("valid_until"),
  createdAt: timestamp("created_at").defaultNow(),
});
export const insertAddressSchema = createInsertSchema(address).omit({ id: true, createdAt: true });
export type InsertAddress = z.infer<typeof insertAddressSchema>;
export type Address = typeof address.$inferSelect;

// ---------------------------------------------------------------------------
// CORE: practitioner_type, practitioner, admin
// ---------------------------------------------------------------------------
export const practitionerType = pgTable("practitioner_type", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: text("key").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
});
export const insertPractitionerTypeSchema = createInsertSchema(practitionerType).omit({ id: true });
export type InsertPractitionerType = z.infer<typeof insertPractitionerTypeSchema>;
export type PractitionerType = typeof practitionerType.$inferSelect;

export const practitioner = pgTable("practitioner", {
  id: uuid("id").primaryKey().defaultRandom(),
  authUserId: uuid("auth_user_id").notNull().unique(),
  practitionerTypeId: uuid("practitioner_type_id").references(() => practitionerType.id),
  billingAddressId: uuid("billing_address_id").references(() => address.id),
  email: text("email"),
  firstname: text("firstname"),
  lastname: text("lastname"),
  gender: text("gender"),
  birthdate: date("birthdate"),
  showAge: boolean("show_age").default(false),
  subjectToVat: boolean("subject_to_vat").default(false),
  vat: text("vat"),
  companyName: text("company_name"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
export const insertPractitionerSchema = createInsertSchema(practitioner).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPractitioner = z.infer<typeof insertPractitionerSchema>;
export type Practitioner = typeof practitioner.$inferSelect;

export const admin = pgTable("admin", {
  id: uuid("id").primaryKey().defaultRandom(),
  authUserId: uuid("auth_user_id").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});
export const insertAdminSchema = createInsertSchema(admin).omit({ id: true, createdAt: true });
export type InsertAdmin = z.infer<typeof insertAdminSchema>;
export type Admin = typeof admin.$inferSelect;

// ---------------------------------------------------------------------------
// CORE: profile
// ---------------------------------------------------------------------------
export const profile = pgTable("profile", {
  id: uuid("id").primaryKey().defaultRandom(),
  practitionerId: uuid("practitioner_id").notNull().references(() => practitioner.id, { onDelete: "cascade" }),
  officeAddressId: uuid("office_address_id").references(() => address.id),
  companyName: text("company_name"),
  telnr: text("telnr"),
  contactEmail: text("contact_email"),
  title: text("title"),
  introduction: text("introduction"),
  logourl: text("logourl"),
  imageurls: text("imageurls").array(),
  websiteurl: text("websiteurl"),
  hasWebsite: boolean("has_website").default(false),
  isActive: boolean("is_active").default(false),
  isPublic: boolean("is_public").default(false),
  isVerified: boolean("is_verified").default(false),
  verificationStatus: text("verification_status").default("PENDING"),
  viewCount: integer("view_count").default(0),
  websiteClicks: integer("website_clicks").default(0),
  slug: text("slug").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
export const insertProfileSchema = createInsertSchema(profile).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type Profile = typeof profile.$inferSelect;

// ---------------------------------------------------------------------------
// VERIFICATION EVENT TRAIL
// ---------------------------------------------------------------------------
export const practitionerVerificationEvent = pgTable("practitioner_verification_event", {
  id: uuid("id").primaryKey().defaultRandom(),
  profileId: uuid("profile_id").notNull().references(() => profile.id, { onDelete: "cascade" }),
  fromStatus: text("from_status"),
  toStatus: text("to_status").notNull(),
  reason: text("reason"),
  actorAdminId: uuid("actor_admin_id").references(() => admin.id),
  createdAt: timestamp("created_at").defaultNow(),
});
export const insertVerificationEventSchema = createInsertSchema(practitionerVerificationEvent).omit({ id: true, createdAt: true });
export type InsertVerificationEvent = z.infer<typeof insertVerificationEventSchema>;
export type VerificationEvent = typeof practitionerVerificationEvent.$inferSelect;

// ---------------------------------------------------------------------------
// SERVICE AREA
// ---------------------------------------------------------------------------
export const serviceArea = pgTable("service_area", {
  id: uuid("id").primaryKey().defaultRandom(),
  municipality: text("municipality"),
  postcode: text("postcode"),
  province: text("province"),
  region: text("region"),
  country: text("country"),
  slug: text("slug"),
  longitude: doublePrecision("longitude"),
  latitude: doublePrecision("latitude"),
  isSystemDefined: boolean("is_system_defined").default(true),
});
export const insertServiceAreaSchema = createInsertSchema(serviceArea).omit({ id: true });
export type InsertServiceArea = z.infer<typeof insertServiceAreaSchema>;
export type ServiceArea = typeof serviceArea.$inferSelect;

export const profileServiceArea = pgTable("profile_service_area", {
  profileId: uuid("profile_id").references(() => profile.id, { onDelete: "cascade" }),
  serviceAreaId: uuid("service_area_id").references(() => serviceArea.id, { onDelete: "cascade" }),
}, (t) => ({ pk: primaryKey({ columns: [t.profileId, t.serviceAreaId] }) }));

// ---------------------------------------------------------------------------
// TAXONOMIE
// ---------------------------------------------------------------------------
export const serviceCategory = pgTable("service_category", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  sortOrder: integer("sort_order").default(0),
  isSystemDefined: boolean("is_system_defined").default(true),
});
export const insertServiceCategorySchema = createInsertSchema(serviceCategory).omit({ id: true });
export type InsertServiceCategory = z.infer<typeof insertServiceCategorySchema>;
export type ServiceCategory = typeof serviceCategory.$inferSelect;

export const specialization = pgTable("specialization", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  serviceCategoryId: uuid("service_category_id").references(() => serviceCategory.id),
  sortOrder: integer("sort_order").default(0),
  isSystemDefined: boolean("is_system_defined").default(true),
});
export const insertSpecializationSchema = createInsertSchema(specialization).omit({ id: true });
export type InsertSpecialization = z.infer<typeof insertSpecializationSchema>;
export type Specialization = typeof specialization.$inferSelect;

export const offeredService = pgTable("offered_service", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  sortOrder: integer("sort_order").default(0),
  isSystemDefined: boolean("is_system_defined").default(true),
});
export const insertOfferedServiceSchema = createInsertSchema(offeredService).omit({ id: true });
export type InsertOfferedService = z.infer<typeof insertOfferedServiceSchema>;
export type OfferedService = typeof offeredService.$inferSelect;

export const profileServiceCategory = pgTable("profile_service_category", {
  profileId: uuid("profile_id").references(() => profile.id, { onDelete: "cascade" }),
  serviceCategoryId: uuid("service_category_id").references(() => serviceCategory.id, { onDelete: "cascade" }),
  isMain: boolean("is_main").default(false),
}, (t) => ({ pk: primaryKey({ columns: [t.profileId, t.serviceCategoryId] }) }));

export const profileSpecialization = pgTable("profile_specialization", {
  profileId: uuid("profile_id").references(() => profile.id, { onDelete: "cascade" }),
  specializationId: uuid("specialization_id").references(() => specialization.id, { onDelete: "cascade" }),
  isMain: boolean("is_main").default(false),
}, (t) => ({ pk: primaryKey({ columns: [t.profileId, t.specializationId] }) }));

export const profileOfferedService = pgTable("profile_offered_service", {
  profileId: uuid("profile_id").references(() => profile.id, { onDelete: "cascade" }),
  offeredServiceId: uuid("offered_service_id").references(() => offeredService.id, { onDelete: "cascade" }),
}, (t) => ({ pk: primaryKey({ columns: [t.profileId, t.offeredServiceId] }) }));

// ---------------------------------------------------------------------------
// PRACTICAL QUESTIONS
// ---------------------------------------------------------------------------
export const variableType = pgTable("variable_type", {
  key: text("key").primaryKey(),
});

export const practicalQuestion = pgTable("practical_question", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: text("key").notNull().unique(),
  name: text("name").notNull(),
  fieldType: text("field_type").notNull(),
  isMulti: boolean("is_multi").default(false),
  isRequired: boolean("is_required").default(false),
  sortOrder: integer("sort_order").default(0),
});
export const insertPracticalQuestionSchema = createInsertSchema(practicalQuestion).omit({ id: true });
export type InsertPracticalQuestion = z.infer<typeof insertPracticalQuestionSchema>;
export type PracticalQuestion = typeof practicalQuestion.$inferSelect;

export const practicalOption = pgTable("practical_option", {
  id: uuid("id").primaryKey().defaultRandom(),
  practicalQuestionId: uuid("practical_question_id").notNull().references(() => practicalQuestion.id, { onDelete: "cascade" }),
  key: text("key").notNull(),
  name: text("name").notNull(),
  sortOrder: integer("sort_order").default(0),
});
export const insertPracticalOptionSchema = createInsertSchema(practicalOption).omit({ id: true });
export type InsertPracticalOption = z.infer<typeof insertPracticalOptionSchema>;
export type PracticalOption = typeof practicalOption.$inferSelect;

export const practicalAnswer = pgTable("practical_answer", {
  id: uuid("id").primaryKey().defaultRandom(),
  profileId: uuid("profile_id").notNull().references(() => profile.id, { onDelete: "cascade" }),
  practicalQuestionId: uuid("practical_question_id").notNull().references(() => practicalQuestion.id, { onDelete: "cascade" }),
});

export const practicalAnswerString = pgTable("practical_answer_string", {
  practicalAnswerId: uuid("practical_answer_id").primaryKey().references(() => practicalAnswer.id, { onDelete: "cascade" }),
  value: text("value"),
});

export const practicalAnswerInt = pgTable("practical_answer_int", {
  practicalAnswerId: uuid("practical_answer_id").primaryKey().references(() => practicalAnswer.id, { onDelete: "cascade" }),
  value: integer("value"),
});

export const practicalAnswerDouble = pgTable("practical_answer_double", {
  practicalAnswerId: uuid("practical_answer_id").primaryKey().references(() => practicalAnswer.id, { onDelete: "cascade" }),
  value: doublePrecision("value"),
});

export const practicalAnswerDate = pgTable("practical_answer_date", {
  practicalAnswerId: uuid("practical_answer_id").primaryKey().references(() => practicalAnswer.id, { onDelete: "cascade" }),
  value: date("value"),
});

export const practicalAnswerOption = pgTable("practical_answer_option", {
  practicalAnswerId: uuid("practical_answer_id").references(() => practicalAnswer.id, { onDelete: "cascade" }),
  practicalOptionId: uuid("practical_option_id").references(() => practicalOption.id, { onDelete: "cascade" }),
}, (t) => ({ pk: primaryKey({ columns: [t.practicalAnswerId, t.practicalOptionId] }) }));

// ---------------------------------------------------------------------------
// BILLING & SUBSCRIPTIONS
// ---------------------------------------------------------------------------
export const billingCycle = pgTable("billing_cycle", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: text("key").notNull().unique(),
  interval: text("interval").notNull(),
  isActive: boolean("is_active").default(true),
});
export const insertBillingCycleSchema = createInsertSchema(billingCycle).omit({ id: true });
export type BillingCycle = typeof billingCycle.$inferSelect;

export const subscriptionPlan = pgTable("subscription_plan", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: text("key").notNull().unique(),
  name: text("name").notNull(),
  price: doublePrecision("price").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  validFrom: date("valid_from"),
  validUntil: date("valid_until"),
});
export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlan).omit({ id: true });
export type SubscriptionPlan = typeof subscriptionPlan.$inferSelect;

export const subscriptionPlanOffer = pgTable("subscription_plan_offer", {
  id: uuid("id").primaryKey().defaultRandom(),
  subscriptionPlanId: uuid("subscription_plan_id").notNull().references(() => subscriptionPlan.id, { onDelete: "cascade" }),
  durationInYears: integer("duration_in_years"),
  discountPercentage: integer("discount_percentage"),
  totalPrice: doublePrecision("total_price"),
  isPopular: boolean("is_popular").default(false),
  isActive: boolean("is_active").default(true),
  validFrom: date("valid_from"),
  validUntil: date("valid_until"),
});
export const insertSubscriptionPlanOfferSchema = createInsertSchema(subscriptionPlanOffer).omit({ id: true });
export type SubscriptionPlanOffer = typeof subscriptionPlanOffer.$inferSelect;

export const profileSubscription = pgTable("profile_subscription", {
  id: uuid("id").primaryKey().defaultRandom(),
  profileId: uuid("profile_id").notNull().references(() => profile.id, { onDelete: "cascade" }),
  subscriptionPlanOfferId: uuid("subscription_plan_offer_id").notNull().references(() => subscriptionPlanOffer.id),
  billingCycleId: uuid("billing_cycle_id").notNull().references(() => billingCycle.id),
  startDate: date("start_date"),
  endDate: date("end_date"),
  autoRenew: boolean("auto_renew").default(false),
  status: text("status").default("PENDING"),
  gracePeriodUntil: date("grace_period_until"),
  refundedReason: text("refunded_reason"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
export const insertProfileSubscriptionSchema = createInsertSchema(profileSubscription).omit({ id: true, createdAt: true, updatedAt: true });
export type ProfileSubscription = typeof profileSubscription.$inferSelect;

// ---------------------------------------------------------------------------
// PAYMENTS
// ---------------------------------------------------------------------------
export const paymentProvider = pgTable("payment_provider", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: text("key").notNull().unique(),
  name: text("name").notNull(),
  isActive: boolean("is_active").default(true),
});
export type PaymentProvider = typeof paymentProvider.$inferSelect;

export const payment = pgTable("payment", {
  id: uuid("id").primaryKey().defaultRandom(),
  profileSubscriptionId: uuid("profile_subscription_id").notNull().references(() => profileSubscription.id, { onDelete: "cascade" }),
  paymentProviderId: uuid("payment_provider_id").notNull().references(() => paymentProvider.id),
  amount: doublePrecision("amount").notNull(),
  currency: text("currency").default("EUR"),
  status: text("status").default("PENDING"),
  externalPaymentId: text("external_payment_id"),
  externalInvoiceId: text("external_invoice_id"),
  invoiceUrl: text("invoice_url"),
  refundReason: text("refund_reason"),
  paidAt: timestamp("paid_at"),
  refundedAt: timestamp("refunded_at"),
  createdAt: timestamp("created_at").defaultNow(),
});
export const insertPaymentSchema = createInsertSchema(payment).omit({ id: true, createdAt: true });
export type Payment = typeof payment.$inferSelect;

// ---------------------------------------------------------------------------
// CONTACT REQUESTS
// ---------------------------------------------------------------------------
export const contactRequest = pgTable("contact_request", {
  id: uuid("id").primaryKey().defaultRandom(),
  profileId: uuid("profile_id").notNull().references(() => profile.id, { onDelete: "cascade" }),
  visitorEmail: text("visitor_email"),
  visitorName: text("visitor_name"),
  telnr: text("telnr"),
  subject: text("subject"),
  message: text("message"),
  createdAt: timestamp("created_at").defaultNow(),
});
export const insertContactRequestSchema = createInsertSchema(contactRequest).omit({ id: true, createdAt: true });
export type InsertContactRequest = z.infer<typeof insertContactRequestSchema>;
export type ContactRequest = typeof contactRequest.$inferSelect;

// ---------------------------------------------------------------------------
// SITE_CONFIG
// ---------------------------------------------------------------------------
export const siteConfig = pgTable("site_config", {
  id: uuid("id").primaryKey().defaultRandom(),
  siteName: text("site_name").notNull(),
  siteTagline: text("site_tagline"),
  supportEmail: text("support_email").notNull(),
  defaultCountryCode: text("default_country_code").notNull(),
  defaultCountryName: text("default_country_name").notNull(),
  defaultRegion: text("default_region"),
  defaultLanguage: text("default_language").notNull(),
  defaultCurrencyCode: text("default_currency_code").notNull(),
  defaultVatPercentage: doublePrecision("default_vat_percentage").notNull(),
  companyVatNumber: text("company_vat_number"),
  companyLegalName: text("company_legal_name"),
  defaultPractitionerTypeId: uuid("default_practitioner_type_id").references(() => practitionerType.id),
  defaultSubscriptionPlanId: uuid("default_subscription_plan_id").references(() => subscriptionPlan.id),
  postcodePattern: text("postcode_pattern"),
  phonePattern: text("phone_pattern"),
  phoneCountryCode: text("phone_country_code"),
  updatedAt: timestamp("updated_at").defaultNow(),
});
export type SiteConfig = typeof siteConfig.$inferSelect;

// ---------------------------------------------------------------------------
// BACKWARDS-COMPAT EXPORTS (frontend uses legacy names; api/index.ts hydrates)
// ---------------------------------------------------------------------------

// specialization → Dutch label proxy: converts kebab-slug to Title Case
export const specializationLabels = new Proxy({} as Record<string, string>, {
  get(_t, prop: string) {
    if (typeof prop !== "string") return undefined;
    return prop.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  },
});

// Legacy type aliases (loose, since api hydrates camelCase + nested relations)
export type Category = {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  mainCategory?: string;
  isActive?: boolean;
  sortOrder?: number;
};

export type Location = {
  id: string;
  slug: string;
  name: string;
  postcode: string;
  province?: string | null;
  region?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  isActive?: boolean;
};

export type Account = {
  id: string;
  authUserId: string;
  email?: string | null;
  firstname?: string | null;
  lastname?: string | null;
  companyName?: string | null;
  vat?: string | null;
  subjectToVat?: boolean | null;
  billingAddress?: Address | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
};

export type SubscriptionItem = {
  id: string;
  accountId: string;
  profileId?: string | null;
  planId?: string | null;
  status?: string | null;
  startDate?: string | Date | null;
  endDate?: string | Date | null;
  createdAt?: string | Date | null;
};

export type SubscriptionPlanLegacy = {
  id: string;
  name: string;
  price: number;
  currency: string;
  durationInYears?: number;
  description?: string | null;
};
export type { SubscriptionPlanLegacy as SubscriptionPlan };

export type ProfileWithRelations = Profile & {
  category?: Category | null;
  categoryId?: string | null;
  location?: Location | null;
  locationId?: string | null;
  office?: any;
  practical?: any;
  specializations?: string[];
  companyName?: string | null;
  contactEmail?: string | null;
  telnr?: string | null;
  hasWebsite?: boolean;
  websiteurl?: string | null;
  distanceKm?: number;
};

// Contact form schema (visitor → profile)
export const contactFormSchema = z.object({
  visitorName: z.string().min(2, "Naam is verplicht"),
  visitorEmail: z.string().email("Geldig e-mailadres vereist"),
  telnr: z.string().optional(),
  subject: z.string().optional(),
  message: z.string().min(10, "Bericht moet minstens 10 tekens bevatten"),
  recaptchaToken: z.string().optional(),
});
export type ContactFormData = z.infer<typeof contactFormSchema>;
