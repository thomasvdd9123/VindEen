import { supabaseAdmin } from "./lib/supabase";
import type {
  Category, InsertCategory,
  Location, InsertLocation,
  Gardener, InsertGardener,
  Profile, InsertProfile,
  Office, InsertOffice,
  Practical, InsertPractical,
  ContactRequest, InsertContactRequest,
  ProfileWithRelations,
  SearchParams,
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
        latitude: location.latitude,
        longitude: location.longitude,
        region: location.region,
        country: location.country ?? "België",
        is_active: location.isActive ?? true,
      })
      .select()
      .single();
    
    if (error) throw error;
    return this.mapLocation(data);
  }

  // Gardeners
  async getGardener(id: string): Promise<Gardener | undefined> {
    const { data, error } = await supabaseAdmin
      .from("gardeners")
      .select("*")
      .eq("id", id)
      .single();
    
    if (error && error.code !== "PGRST116") throw error;
    return data ? this.mapGardener(data) : undefined;
  }

  async getGardenerByAccountId(accountId: string): Promise<Gardener | undefined> {
    const { data, error } = await supabaseAdmin
      .from("gardeners")
      .select("*")
      .eq("account_id", accountId)
      .single();
    
    if (error && error.code !== "PGRST116") throw error;
    return data ? this.mapGardener(data) : undefined;
  }

  async createGardener(gardener: InsertGardener): Promise<Gardener> {
    const { data, error } = await supabaseAdmin
      .from("gardeners")
      .insert({
        account_id: gardener.accountId,
        email: gardener.email,
        role: gardener.role ?? "GARDENER",
        email_verified: gardener.emailVerified ?? false,
        email_verified_at: gardener.emailVerifiedAt,
      })
      .select()
      .single();
    
    if (error) throw error;
    return this.mapGardener(data);
  }

  // Profiles
  async getProfiles(): Promise<Profile[]> {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("is_active", true)
      .eq("is_public", true);
    
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
      .eq("is_featured", true)
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

    // Filter by location
    if (params.locationSlug) {
      const location = await this.getLocationBySlug(params.locationSlug);
      if (location) {
        query = query.eq("location_id", location.id);
      }
    }

    // Filter by query (name, introduction, title)
    if (params.query) {
      query = query.or(`name.ilike.%${params.query}%,introduction.ilike.%${params.query}%,title.ilike.%${params.query}%`);
    }

    // Filter by specializations
    if (params.specializations && params.specializations.length > 0) {
      query = query.overlaps("specializations", params.specializations);
    }

    const page = params.page || 1;
    const limit = params.limit || 12;
    const offset = (page - 1) * limit;

    const { data, error, count } = await query
      .range(offset, offset + limit - 1)
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false });

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
        gardener_id: profile.gardenerId,
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
        is_verified: profile.isVerified ?? false,
        verification_status: profile.verificationStatus ?? "PENDING",
        is_featured: profile.isFeatured ?? false,
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
        latitude: office.latitude,
        longitude: office.longitude,
        country: office.country ?? "België",
      })
      .select()
      .single();
    
    if (error) throw error;
    return this.mapOffice(data);
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
        reachability: practical.reachability,
        experience: practical.experience,
        languages: practical.languages,
        tariff: practical.tariff,
        accepted_payment_methods: practical.acceptedPaymentMethods,
      })
      .select()
      .single();
    
    if (error) throw error;
    return this.mapPractical(data);
  }

  // Contact Requests
  async createContactRequest(request: InsertContactRequest): Promise<ContactRequest> {
    const { data, error } = await supabaseAdmin
      .from("contact_requests")
      .insert({
        gardener_id: request.gardenerId,
        profile_id: request.profileId,
        visitor_name: request.visitorName,
        visitor_email: request.visitorEmail,
        telnr: request.telnr,
        subject: request.subject,
        message: request.message,
        status: request.status ?? "NEW",
      })
      .select()
      .single();
    
    if (error) throw error;
    return this.mapContactRequest(data);
  }

  // Mapping functions (snake_case to camelCase)
  private mapCategory(data: any): Category {
    return {
      id: data.id,
      name: data.name,
      slug: data.slug,
      description: data.description,
      isActive: data.is_active,
      sortOrder: data.sort_order,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  private mapLocation(data: any): Location {
    return {
      id: data.id,
      name: data.name,
      slug: data.slug,
      postcode: data.postcode,
      municipality: data.municipality,
      latitude: data.latitude,
      longitude: data.longitude,
      region: data.region,
      country: data.country,
      isActive: data.is_active,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  private mapGardener(data: any): Gardener {
    return {
      id: data.id,
      accountId: data.account_id,
      email: data.email,
      role: data.role,
      emailVerified: data.email_verified,
      emailVerifiedAt: data.email_verified_at ? new Date(data.email_verified_at) : null,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  private mapProfile(data: any): Profile {
    return {
      id: data.id,
      gardenerId: data.gardener_id,
      slug: data.slug,
      name: data.name,
      email: data.email,
      telnr: data.telnr,
      website: data.website,
      hasWebsite: data.has_website,
      description: data.description,
      introduction: data.introduction,
      title: data.title,
      education: data.education,
      specializations: data.specializations,
      offeredServices: data.offered_services,
      logoUrl: data.logo_url,
      imageUrls: data.image_urls,
      isActive: data.is_active,
      isPublic: data.is_public,
      isVerified: data.is_verified,
      verificationStatus: data.verification_status,
      verifiedAt: data.verified_at ? new Date(data.verified_at) : null,
      verifiedBy: data.verified_by,
      rejectionReason: data.rejection_reason,
      isFeatured: data.is_featured,
      seoTitle: data.seo_title,
      seoDescription: data.seo_description,
      categoryId: data.category_id,
      locationId: data.location_id,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  private mapOffice(data: any): Office {
    return {
      id: data.id,
      profileId: data.profile_id,
      street: data.street,
      number: data.number,
      town: data.town,
      municipality: data.municipality,
      postcode: data.postcode,
      latitude: data.latitude,
      longitude: data.longitude,
      country: data.country,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  private mapPractical(data: any): Practical {
    return {
      id: data.id,
      profileId: data.profile_id,
      reachability: data.reachability,
      experience: data.experience,
      languages: data.languages,
      tariff: data.tariff,
      acceptedPaymentMethods: data.accepted_payment_methods,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  private mapContactRequest(data: any): ContactRequest {
    return {
      id: data.id,
      gardenerId: data.gardener_id,
      profileId: data.profile_id,
      visitorName: data.visitor_name,
      visitorEmail: data.visitor_email,
      telnr: data.telnr,
      subject: data.subject,
      message: data.message,
      status: data.status,
      gardenerReadAt: data.gardener_read_at ? new Date(data.gardener_read_at) : null,
      adminNotified: data.admin_notified,
      date: new Date(data.date),
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  private mapProfileWithRelations(data: any): ProfileWithRelations {
    const profile = this.mapProfile(data);
    return {
      ...profile,
      category: data.categories ? this.mapCategory(data.categories) : undefined,
      location: data.locations ? this.mapLocation(data.locations) : undefined,
      office: data.offices ? this.mapOffice(data.offices) : undefined,
      practical: data.practicals ? this.mapPractical(data.practicals) : undefined,
    };
  }
}

export const supabaseStorage = new SupabaseStorage();
