import { supabaseAdmin } from "./lib/supabase";
import type {
  Category, InsertCategory,
  Location, InsertLocation,
  Business, InsertBusiness,
  Profile, InsertProfile,
  Office, InsertOffice,
  Practical, InsertPractical,
  ContactRequest, InsertContactRequest,
  ProfileWithRelations,
  SearchParams,
  SubscriptionPlan,
  ProfileStatusHistory, InsertProfileStatusHistory,
} from "@shared/schema";
import type { IStorage } from "./storage";

export class SupabaseStorage implements IStorage {
  // Categories
  async getCategories(): Promise<Category[]> {
    const { data, error } = await supabaseAdmin
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .order("sort_order");
    
    if (error) throw error;
    return (data || []).map(this.mapCategory);
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    const { data, error } = await supabaseAdmin
      .from("categories")
      .select("*")
      .eq("slug", slug)
      .single();
    
    if (error && error.code !== "PGRST116") throw error;
    return data ? this.mapCategory(data) : undefined;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const { data, error } = await supabaseAdmin
      .from("categories")
      .insert({
        name: category.name,
        slug: category.slug,
        main_category: category.mainCategory,
        description: category.description,
        is_active: category.isActive ?? true,
        sort_order: category.sortOrder ?? 0,
      })
      .select()
      .single();
    
    if (error) throw error;
    return this.mapCategory(data);
  }

  // Locations
  async getLocations(): Promise<Location[]> {
    const { data, error } = await supabaseAdmin
      .from("locations")
      .select("*")
      .eq("is_active", true)
      .order("name");
    
    if (error) throw error;
    return (data || []).map(this.mapLocation);
  }

  async getLocationBySlug(slug: string): Promise<Location | undefined> {
    const { data, error } = await supabaseAdmin
      .from("locations")
      .select("*")
      .eq("slug", slug)
      .single();
    
    if (error && error.code !== "PGRST116") throw error;
    return data ? this.mapLocation(data) : undefined;
  }

  async createLocation(location: InsertLocation): Promise<Location> {
    const { data, error } = await supabaseAdmin
      .from("locations")
      .insert({
        name: location.name,
        slug: location.slug,
        postcode: location.postcode,
        municipality: location.municipality,
        province: location.province,
        region: location.region,
        latitude: location.latitude,
        longitude: location.longitude,
        is_active: location.isActive ?? true,
      })
      .select()
      .single();
    
    if (error) throw error;
    return this.mapLocation(data);
  }

  // Businesses (formerly Gardeners)
  async getBusiness(id: string): Promise<Business | undefined> {
    const { data, error } = await supabaseAdmin
      .from("businesses")
      .select("*")
      .eq("id", id)
      .single();
    
    if (error && error.code !== "PGRST116") throw error;
    return data ? this.mapBusiness(data) : undefined;
  }

  async getBusinessByAccountId(accountId: string): Promise<Business | undefined> {
    const { data, error } = await supabaseAdmin
      .from("businesses")
      .select("*")
      .eq("account_id", accountId)
      .single();
    
    if (error && error.code !== "PGRST116") throw error;
    return data ? this.mapBusiness(data) : undefined;
  }

  async createBusiness(business: InsertBusiness): Promise<Business> {
    const { data, error } = await supabaseAdmin
      .from("businesses")
      .insert({
        account_id: business.accountId,
        email: business.email,
        role: business.role ?? "BUSINESS",
        email_verified: business.emailVerified ?? false,
        email_verified_at: business.emailVerifiedAt,
      })
      .select()
      .single();
    
    if (error) throw error;
    return this.mapBusiness(data);
  }

  // Profiles
  async getProfiles(): Promise<Profile[]> {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("is_active", true);
    
    if (error) throw error;
    return (data || []).map(this.mapProfile);
  }

  async getProfileBySlug(slug: string): Promise<ProfileWithRelations | undefined> {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select(`
        *,
        categories(*),
        locations(*),
        offices(*),
        practicals(*)
      `)
      .eq("slug", slug)
      .eq("is_active", true)
      .single();
    
    if (error && error.code !== "PGRST116") throw error;
    if (!data) return undefined;
    
    return this.mapProfileWithRelations(data);
  }

  async getProfileById(id: string): Promise<ProfileWithRelations | undefined> {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select(`
        *,
        categories(*),
        locations(*),
        offices(*),
        practicals(*)
      `)
      .eq("id", id)
      .single();
    
    if (error && error.code !== "PGRST116") throw error;
    if (!data) return undefined;
    
    return this.mapProfileWithRelations(data);
  }

  async getProfilesByBusinessId(businessId: string): Promise<Profile[]> {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("business_id", businessId);
    
    if (error) throw error;
    return (data || []).map(d => this.mapProfile(d));
  }

  async getProfilesByGardenerId(gardenerId: string): Promise<Profile[]> {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("gardener_id", gardenerId);
    
    if (error) throw error;
    return (data || []).map(d => this.mapProfile(d));
  }

  async getFeaturedProfiles(): Promise<ProfileWithRelations[]> {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select(`
        *,
        categories(*),
        locations(*),
        offices(*),
        practicals(*)
      `)
      .eq("is_active", true)
      .eq("is_public", true)
      .limit(6);
    
    if (error) throw error;
    return (data || []).map(d => this.mapProfileWithRelations(d));
  }

  async searchProfiles(params: SearchParams): Promise<{ profiles: ProfileWithRelations[]; total: number; page: number; totalPages: number }> {
    let query = supabaseAdmin
      .from("profiles")
      .select(`
        *,
        categories(*),
        locations(*),
        offices(*),
        practicals(*)
      `, { count: "exact" })
      .eq("is_active", true)
      .eq("is_public", true);

    // Filter by category
    if (params.categorySlug) {
      const category = await this.getCategoryBySlug(params.categorySlug);
      if (category) {
        query = query.eq("category_id", category.id);
      }
    }

    // Filter by main category
    if (params.mainCategory) {
      const categories = await this.getCategories();
      const matchingCategories = categories.filter(c => c.mainCategory === params.mainCategory);
      if (matchingCategories.length > 0) {
        query = query.in("category_id", matchingCategories.map(c => c.id));
      }
    }

    // Filter by location
    if (params.locationSlug) {
      const location = await this.getLocationBySlug(params.locationSlug);
      if (location) {
        query = query.eq("location_id", location.id);
      }
    }

    // Filter by specializations
    if (params.specializations && params.specializations.length > 0) {
      query = query.overlaps("specializations", params.specializations);
    }

    // Search query
    if (params.query) {
      query = query.or(`name.ilike.%${params.query}%,description.ilike.%${params.query}%`);
    }

    const page = params.page || 1;
    const limit = params.limit || 12;
    const offset = (page - 1) * limit;

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    
    if (error) throw error;

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    return {
      profiles: (data || []).map(d => this.mapProfileWithRelations(d)),
      total,
      page,
      totalPages,
    };
  }

  async createProfile(profile: InsertProfile): Promise<Profile> {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .insert({
        business_id: profile.businessId,
        slug: profile.slug,
        name: profile.name,
        email: profile.email,
        telnr: profile.telnr,
        website: profile.website,
        has_website: profile.hasWebsite ?? false,
        description: profile.description,
        introduction: profile.introduction,
        title: profile.title,
        education: profile.education,
        specializations: profile.specializations,
        offered_services: profile.offeredServices,
        logo_url: profile.logoUrl,
        image_urls: profile.imageUrls,
        is_active: profile.isActive ?? true,
        is_public: profile.isPublic ?? false,
        hide_address: profile.hideAddress ?? false,
        seo_title: profile.seoTitle,
        seo_description: profile.seoDescription,
        category_id: profile.categoryId,
        location_id: profile.locationId,
      })
      .select()
      .single();
    
    if (error) throw error;
    return this.mapProfile(data);
  }

  async updateProfile(id: string, updates: Partial<InsertProfile>): Promise<Profile | undefined> {
    const updateData: Record<string, unknown> = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.email !== undefined) updateData.email = updates.email;
    if (updates.telnr !== undefined) updateData.telnr = updates.telnr;
    if (updates.website !== undefined) updateData.website = updates.website;
    if (updates.hasWebsite !== undefined) updateData.has_website = updates.hasWebsite;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.introduction !== undefined) updateData.introduction = updates.introduction;
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.education !== undefined) updateData.education = updates.education;
    if (updates.specializations !== undefined) updateData.specializations = updates.specializations;
    if (updates.offeredServices !== undefined) updateData.offered_services = updates.offeredServices;
    if (updates.logoUrl !== undefined) updateData.logo_url = updates.logoUrl;
    if (updates.imageUrls !== undefined) updateData.image_urls = updates.imageUrls;
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
    if (updates.isPublic !== undefined) updateData.is_public = updates.isPublic;
    if (updates.categoryId !== undefined) updateData.category_id = updates.categoryId;
    if (updates.locationId !== undefined) updateData.location_id = updates.locationId;
    if (updates.seoTitle !== undefined) updateData.seo_title = updates.seoTitle;
    if (updates.seoDescription !== undefined) updateData.seo_description = updates.seoDescription;
    if (updates.hideAddress !== undefined) updateData.hide_address = updates.hideAddress;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();
    
    if (error && error.code !== "PGRST116") throw error;
    return data ? this.mapProfile(data) : undefined;
  }

  async deleteProfile(id: string): Promise<void> {
    // Delete related data first
    await supabaseAdmin.from("offices").delete().eq("profile_id", id);
    await supabaseAdmin.from("practicals").delete().eq("profile_id", id);
    await supabaseAdmin.from("profile_status_history").delete().eq("profile_id", id);
    
    const { error } = await supabaseAdmin.from("profiles").delete().eq("id", id);
    if (error) throw error;
  }

  async incrementProfileViewCount(id: string): Promise<void> {
    const { data } = await supabaseAdmin
      .from("profiles")
      .select("view_count")
      .eq("id", id)
      .single();
    
    if (data) {
      await supabaseAdmin
        .from("profiles")
        .update({ view_count: (data.view_count || 0) + 1 })
        .eq("id", id);
    }
  }

  // Profile Status History
  async getProfileStatusHistory(profileId: string): Promise<ProfileStatusHistory[]> {
    const { data, error } = await supabaseAdmin
      .from("profile_status_history")
      .select("*")
      .eq("profile_id", profileId)
      .order("created_at", { ascending: false });
    
    if (error) throw error;
    return (data || []).map(this.mapProfileStatusHistory);
  }

  async createProfileStatusHistory(entry: InsertProfileStatusHistory): Promise<ProfileStatusHistory> {
    const { data, error } = await supabaseAdmin
      .from("profile_status_history")
      .insert({
        profile_id: entry.profileId,
        status: entry.status,
        reason: entry.reason,
      })
      .select()
      .single();
    
    if (error) throw error;
    return this.mapProfileStatusHistory(data);
  }

  // Offices
  async getOfficeByProfileId(profileId: string): Promise<Office | undefined> {
    const { data, error } = await supabaseAdmin
      .from("offices")
      .select("*")
      .eq("profile_id", profileId)
      .single();
    
    if (error && error.code !== "PGRST116") throw error;
    return data ? this.mapOffice(data) : undefined;
  }

  async createOffice(office: InsertOffice): Promise<Office> {
    const { data, error } = await supabaseAdmin
      .from("offices")
      .insert({
        profile_id: office.profileId,
        street: office.street,
        number: office.number,
        town: office.town,
        municipality: office.municipality,
        postcode: office.postcode,
        province: office.province,
        latitude: office.latitude,
        longitude: office.longitude,
      })
      .select()
      .single();
    
    if (error) throw error;
    return this.mapOffice(data);
  }

  async updateOffice(profileId: string, updates: Partial<InsertOffice>): Promise<Office | undefined> {
    const updateData: Record<string, unknown> = {};
    if (updates.street !== undefined) updateData.street = updates.street;
    if (updates.number !== undefined) updateData.number = updates.number;
    if (updates.town !== undefined) updateData.town = updates.town;
    if (updates.municipality !== undefined) updateData.municipality = updates.municipality;
    if (updates.postcode !== undefined) updateData.postcode = updates.postcode;
    if (updates.province !== undefined) updateData.province = updates.province;
    if (updates.latitude !== undefined) updateData.latitude = updates.latitude;
    if (updates.longitude !== undefined) updateData.longitude = updates.longitude;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from("offices")
      .update(updateData)
      .eq("profile_id", profileId)
      .select()
      .single();
    
    if (error && error.code !== "PGRST116") throw error;
    return data ? this.mapOffice(data) : undefined;
  }

  // Practicals
  async getPracticalByProfileId(profileId: string): Promise<Practical | undefined> {
    const { data, error } = await supabaseAdmin
      .from("practicals")
      .select("*")
      .eq("profile_id", profileId)
      .single();
    
    if (error && error.code !== "PGRST116") throw error;
    return data ? this.mapPractical(data) : undefined;
  }

  async createPractical(practical: InsertPractical): Promise<Practical> {
    const { data, error } = await supabaseAdmin
      .from("practicals")
      .insert({
        profile_id: practical.profileId,
        experience_years: practical.experienceYears,
        languages: practical.languages,
        tariff: practical.tariff,
        accepted_payment_methods: practical.acceptedPaymentMethods,
      })
      .select()
      .single();
    
    if (error) throw error;
    return this.mapPractical(data);
  }

  async updatePractical(profileId: string, updates: Partial<InsertPractical>): Promise<Practical | undefined> {
    const updateData: Record<string, unknown> = {};
    if (updates.experienceYears !== undefined) updateData.experience_years = updates.experienceYears;
    if (updates.languages !== undefined) updateData.languages = updates.languages;
    if (updates.tariff !== undefined) updateData.tariff = updates.tariff;
    if (updates.acceptedPaymentMethods !== undefined) updateData.accepted_payment_methods = updates.acceptedPaymentMethods;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from("practicals")
      .update(updateData)
      .eq("profile_id", profileId)
      .select()
      .single();
    
    if (error && error.code !== "PGRST116") throw error;
    return data ? this.mapPractical(data) : undefined;
  }

  // Contact Requests
  async createContactRequest(request: InsertContactRequest): Promise<ContactRequest> {
    const { data, error } = await supabaseAdmin
      .from("contact_requests")
      .insert({
        profile_id: request.profileId,
        visitor_name: request.visitorName,
        visitor_email: request.visitorEmail,
        telnr: request.telnr,
        subject: request.subject,
        message: request.message,
      })
      .select()
      .single();
    
    if (error) throw error;
    return this.mapContactRequest(data);
  }

  async getContactRequestsByProfileId(profileId: string): Promise<ContactRequest[]> {
    const { data, error } = await supabaseAdmin
      .from("contact_requests")
      .select("*")
      .eq("profile_id", profileId)
      .order("created_at", { ascending: false });
    
    if (error) throw error;
    return (data || []).map(this.mapContactRequest);
  }

  // Subscription Plans
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    const { data, error } = await supabaseAdmin
      .from("subscription_plans")
      .select("*")
      .eq("is_active", true)
      .order("sort_order");
    
    if (error) throw error;
    return (data || []).map(this.mapSubscriptionPlan);
  }

  // Mapping functions
  private mapCategory(data: Record<string, unknown>): Category {
    return {
      id: data.id as string,
      name: data.name as string,
      slug: data.slug as string,
      mainCategory: data.main_category as "TUINONDERHOUD" | "TUINAANLEG",
      description: data.description as string | null,
      isActive: data.is_active as boolean,
      sortOrder: data.sort_order as number | null,
      createdAt: new Date(data.created_at as string),
      updatedAt: new Date(data.updated_at as string),
    };
  }

  private mapLocation(data: Record<string, unknown>): Location {
    return {
      id: data.id as string,
      name: data.name as string,
      slug: data.slug as string,
      postcode: data.postcode as string,
      municipality: data.municipality as string,
      province: data.province as Location["province"],
      region: data.region as Location["region"],
      latitude: data.latitude as number | null,
      longitude: data.longitude as number | null,
      isActive: data.is_active as boolean,
      createdAt: new Date(data.created_at as string),
      updatedAt: new Date(data.updated_at as string),
    };
  }

  private mapBusiness(data: Record<string, unknown>): Business {
    return {
      id: data.id as string,
      accountId: data.account_id as string,
      email: data.email as string,
      role: data.role as Business["role"],
      emailVerified: data.email_verified as boolean | null,
      emailVerifiedAt: data.email_verified_at ? new Date(data.email_verified_at as string) : null,
      createdAt: new Date(data.created_at as string),
      updatedAt: new Date(data.updated_at as string),
    };
  }

  private mapProfile(data: Record<string, unknown>): Profile {
    return {
      id: data.id as string,
      businessId: data.business_id as string,
      slug: data.slug as string,
      name: data.name as string,
      email: data.email as string,
      telnr: data.telnr as string | null,
      website: data.website as string | null,
      hasWebsite: data.has_website as boolean,
      description: data.description as string | null,
      introduction: data.introduction as string | null,
      title: data.title as string | null,
      education: data.education as string | null,
      specializations: data.specializations as string[] | null,
      offeredServices: data.offered_services as string[] | null,
      logoUrl: data.logo_url as string | null,
      imageUrls: data.image_urls as string[] | null,
      isActive: data.is_active as boolean,
      isPublic: data.is_public as boolean,
      hideAddress: (data.hide_address as boolean) ?? false,
      viewCount: (data.view_count as number) ?? 0,
      seoTitle: data.seo_title as string | null,
      seoDescription: data.seo_description as string | null,
      categoryId: data.category_id as string | null,
      locationId: data.location_id as string | null,
      createdAt: new Date(data.created_at as string),
      updatedAt: new Date(data.updated_at as string),
    };
  }

  private mapProfileStatusHistory(data: Record<string, unknown>): ProfileStatusHistory {
    return {
      id: data.id as string,
      profileId: data.profile_id as string,
      status: data.status as ProfileStatusHistory["status"],
      reason: data.reason as string | null,
      createdAt: new Date(data.created_at as string),
    };
  }

  private mapOffice(data: Record<string, unknown>): Office {
    return {
      id: data.id as string,
      profileId: data.profile_id as string,
      street: data.street as string,
      number: data.number as string,
      town: data.town as string,
      municipality: data.municipality as string,
      postcode: data.postcode as string,
      province: data.province as Office["province"],
      latitude: data.latitude as number | null,
      longitude: data.longitude as number | null,
      createdAt: new Date(data.created_at as string),
      updatedAt: new Date(data.updated_at as string),
    };
  }

  private mapPractical(data: Record<string, unknown>): Practical {
    return {
      id: data.id as string,
      profileId: data.profile_id as string,
      experienceYears: data.experience_years as number | null,
      languages: data.languages as Practical["languages"],
      tariff: data.tariff as string | null,
      acceptedPaymentMethods: data.accepted_payment_methods as string | null,
      createdAt: new Date(data.created_at as string),
      updatedAt: new Date(data.updated_at as string),
    };
  }

  private mapContactRequest(data: Record<string, unknown>): ContactRequest {
    return {
      id: data.id as string,
      profileId: data.profile_id as string,
      visitorName: data.visitor_name as string,
      visitorEmail: data.visitor_email as string,
      telnr: data.telnr as string | null,
      subject: data.subject as string,
      message: data.message as string,
      createdAt: new Date(data.created_at as string),
    };
  }

  private mapSubscriptionPlan(data: Record<string, unknown>): SubscriptionPlan {
    return {
      id: data.id as string,
      type: data.type as SubscriptionPlan["type"],
      name: data.name as string,
      price: data.price as number,
      molliepriceId: data.mollie_price_id as string | null,
      mollieProductId: data.mollie_product_id as string | null,
      generalInfo: data.general_info as string | null,
      features: data.features as string | null,
      isActive: data.is_active as boolean,
      sortOrder: data.sort_order as number | null,
      createdAt: new Date(data.created_at as string),
      updatedAt: new Date(data.updated_at as string),
    };
  }

  private mapProfileWithRelations(data: Record<string, unknown>): ProfileWithRelations {
    const profile = this.mapProfile(data);
    return {
      ...profile,
      category: data.categories ? this.mapCategory(data.categories as Record<string, unknown>) : undefined,
      location: data.locations ? this.mapLocation(data.locations as Record<string, unknown>) : undefined,
      office: data.offices ? this.mapOffice(data.offices as Record<string, unknown>) : undefined,
      practical: data.practicals ? this.mapPractical(data.practicals as Record<string, unknown>) : undefined,
    };
  }
}

export const supabaseStorage = new SupabaseStorage();
