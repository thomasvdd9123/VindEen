import { supabaseAdmin } from "./lib/supabase";
import type {
  Category, InsertCategory,
  Location, InsertLocation,
  Account, InsertAccount,
  Profile, InsertProfile,
  Office, InsertOffice,
  Practical, InsertPractical,
  ContactRequest, InsertContactRequest,
  ProfileWithRelations,
  SearchParams,
  SubscriptionPlan,
  SubscriptionItem, InsertSubscriptionItem,
  ProfileStatusHistory, InsertProfileStatusHistory,
} from "@shared/schema";
import type { IStorage } from "./storage";

// Haversine formula to calculate distance between two coordinates in km
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Radius in km for location search (hardcoded to 20km)
const SEARCH_RADIUS_KM = 20;

// Cache for locations (they rarely change)
let cachedLocations: Location[] | null = null;
let locationsCacheTime: number = 0;
const LOCATIONS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

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
    // Use cached locations if available and not expired
    const now = Date.now();
    if (cachedLocations && (now - locationsCacheTime) < LOCATIONS_CACHE_TTL) {
      return cachedLocations;
    }

    const { data, error } = await supabaseAdmin
      .from("locations")
      .select("*")
      .eq("is_active", true)
      .order("name");
    
    if (error) throw error;
    
    const locations = (data || []).map(this.mapLocation);
    
    // Update cache
    cachedLocations = locations;
    locationsCacheTime = now;
    
    return locations;
  }

  async getLocationBySlug(slug: string): Promise<Location | undefined> {
    // Try to find from cache first to avoid extra database call
    const now = Date.now();
    if (cachedLocations && (now - locationsCacheTime) < LOCATIONS_CACHE_TTL) {
      return cachedLocations.find(loc => loc.slug === slug);
    }

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

  // Accounts (login, VAT, billing)
  async getAccount(id: string): Promise<Account | undefined> {
    const { data, error } = await supabaseAdmin
      .from("accounts")
      .select("*")
      .eq("id", id)
      .single();
    
    if (error && error.code !== "PGRST116") throw error;
    return data ? this.mapAccount(data) : undefined;
  }

  async getAccountByAuthUserId(authUserId: string): Promise<Account | undefined> {
    const { data, error } = await supabaseAdmin
      .from("accounts")
      .select("*")
      .eq("auth_user_id", authUserId)
      .single();
    
    if (error && error.code !== "PGRST116") throw error;
    return data ? this.mapAccount(data) : undefined;
  }

  async getAccountByProfileId(profileId: string): Promise<Account | undefined> {
    // First get the profile to find the account_id
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("account_id")
      .eq("id", profileId)
      .single();
    
    if (profileError || !profile?.account_id) return undefined;
    
    return this.getAccount(profile.account_id);
  }

  async createAccount(account: InsertAccount): Promise<Account> {
    const { data, error } = await supabaseAdmin
      .from("accounts")
      .insert({
        auth_user_id: account.authUserId,
        email: account.email,
        role: account.role ?? "GARDENER",
        email_verified: account.emailVerified ?? false,
        email_verified_at: account.emailVerifiedAt,
      })
      .select()
      .single();
    
    if (error) throw error;
    return this.mapAccount(data);
  }

  async updateAccount(id: string, updates: Partial<InsertAccount>): Promise<Account | undefined> {
    const updateData: Record<string, unknown> = {};
    
    if (updates.email !== undefined) updateData.email = updates.email;
    if (updates.role !== undefined) updateData.role = updates.role;
    if (updates.vatNumber !== undefined) updateData.vat_number = updates.vatNumber;
    if (updates.companyName !== undefined) updateData.company_name = updates.companyName;
    if (updates.billingStreet !== undefined) updateData.billing_street = updates.billingStreet;
    if (updates.billingNumber !== undefined) updateData.billing_number = updates.billingNumber;
    if (updates.billingPostcode !== undefined) updateData.billing_postcode = updates.billingPostcode;
    if (updates.billingCity !== undefined) updateData.billing_city = updates.billingCity;
    if (updates.emailVerified !== undefined) updateData.email_verified = updates.emailVerified;
    if (updates.emailVerifiedAt !== undefined) updateData.email_verified_at = updates.emailVerifiedAt;
    
    updateData.updated_at = new Date().toISOString();
    
    const { data, error } = await supabaseAdmin
      .from("accounts")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();
    
    if (error && error.code !== "PGRST116") throw error;
    return data ? this.mapAccount(data) : undefined;
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

  async getProfilesByAccountId(accountId: string): Promise<Profile[]> {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("account_id", accountId);
    
    if (error) throw error;
    return (data || []).map(d => this.mapProfile(d));
  }

  // Debug methods
  async getAllProfiles(): Promise<Profile[]> {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("*");
    
    if (error) throw error;
    return (data || []).map(d => this.mapProfile(d));
  }

  async getAccounts(): Promise<Account[]> {
    const { data, error } = await supabaseAdmin
      .from("accounts")
      .select("*");
    
    if (error) throw error;
    return (data || []).map(d => this.mapAccount(d));
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

  async searchProfiles(params: SearchParams): Promise<{ profiles: (ProfileWithRelations & { distanceKm?: number })[]; total: number; page: number; totalPages: number; searchLocation?: { lat: number; lng: number; name: string } }> {
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

    // Store search location for distance calculation
    let searchLocationData: { lat: number; lng: number; name: string; id: string } | null = null;

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

    // Filter by location with 20km radius search
    if (params.locationSlug) {
      const searchLocation = await this.getLocationBySlug(params.locationSlug);
      if (searchLocation && searchLocation.latitude && searchLocation.longitude) {
        // Store for distance calculation
        searchLocationData = {
          lat: searchLocation.latitude,
          lng: searchLocation.longitude,
          name: searchLocation.name,
          id: searchLocation.id,
        };
        
        // Find all locations within 20km radius
        try {
          const allLocations = await this.getLocations();
          console.log(`[Search] Found ${allLocations.length} total locations for radius search`);
          
          const nearbyLocationIds = allLocations
            .filter(loc => {
              if (!loc.latitude || !loc.longitude) return false;
              const distance = calculateDistance(
                searchLocation.latitude!,
                searchLocation.longitude!,
                loc.latitude,
                loc.longitude
              );
              return distance <= SEARCH_RADIUS_KM;
            })
            .map(loc => loc.id);
          
          console.log(`[Search] Found ${nearbyLocationIds.length} locations within ${SEARCH_RADIUS_KM}km of ${searchLocation.name}`);
          
          if (nearbyLocationIds.length > 0) {
            query = query.in("location_id", nearbyLocationIds);
          } else {
            // Fallback to exact match if no nearby locations found
            console.log(`[Search] No nearby locations found, using exact match for ${searchLocation.name}`);
            query = query.eq("location_id", searchLocation.id);
          }
        } catch (error) {
          console.error("[Search] Error fetching locations for radius search:", error);
          // Fallback to exact match on error
          query = query.eq("location_id", searchLocation.id);
        }
      } else if (searchLocation) {
        // No coordinates, use exact match
        searchLocationData = {
          lat: 0,
          lng: 0,
          name: searchLocation.name,
          id: searchLocation.id,
        };
        query = query.eq("location_id", searchLocation.id);
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

    // OPTIMIZATION: Only fetch all results when we need distance sorting (location search)
    // For non-location searches, use database pagination directly (faster for Vercel)
    if (searchLocationData && searchLocationData.lat && searchLocationData.lng) {
      // Location search: fetch all, sort by distance, then paginate in memory
      const { data, error } = await query;
      
      if (error) throw error;

      // Map profiles and calculate distance
      let allProfiles = (data || []).map(d => {
        const profile = this.mapProfileWithRelations(d) as ProfileWithRelations & { distanceKm?: number };
        
        if (profile.location?.latitude && profile.location?.longitude) {
          const distance = calculateDistance(
            searchLocationData.lat,
            searchLocationData.lng,
            profile.location.latitude,
            profile.location.longitude
          );
          if (distance > 0.1) {
            profile.distanceKm = Math.round(distance * 10) / 10;
          }
        }
        
        return profile;
      });

      // Sort by distance (closest first), then alphabetically
      allProfiles.sort((a, b) => {
        const distA = a.distanceKm ?? 0;
        const distB = b.distanceKm ?? 0;
        
        if (distA !== distB) {
          return distA - distB;
        }
        return a.name.localeCompare(b.name, 'nl');
      });

      // Apply pagination AFTER sorting
      const total = allProfiles.length;
      const totalPages = Math.ceil(total / limit);
      const paginatedProfiles = allProfiles.slice(offset, offset + limit);

      return {
        profiles: paginatedProfiles,
        total,
        page,
        totalPages,
        searchLocation: { lat: searchLocationData.lat, lng: searchLocationData.lng, name: searchLocationData.name },
      };
    } else {
      // Non-location search: use database pagination directly (faster)
      query = query.order("name", { ascending: true });
      query = query.range(offset, offset + limit - 1);
      
      const { data, error, count } = await query;
      
      if (error) throw error;

      const profiles = (data || []).map(d => this.mapProfileWithRelations(d));
      const total = count || 0;
      const totalPages = Math.ceil(total / limit);

      return {
        profiles,
        total,
        page,
        totalPages,
      };
    }
  }

  async createProfile(profile: InsertProfile): Promise<Profile> {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .insert({
        account_id: profile.accountId,
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
        logo_url: profile.logoUrl,
        image_urls: profile.imageUrls,
        is_active: profile.isActive ?? true,
        is_public: profile.isPublic ?? false,
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
    if (updates.logoUrl !== undefined) updateData.logo_url = updates.logoUrl;
    if (updates.imageUrls !== undefined) updateData.image_urls = updates.imageUrls;
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
    if (updates.isPublic !== undefined) updateData.is_public = updates.isPublic;
    if ((updates as any).hideAddress !== undefined) updateData.hide_address = (updates as any).hideAddress;
    if (updates.categoryId !== undefined) updateData.category_id = updates.categoryId;
    if (updates.locationId !== undefined) updateData.location_id = updates.locationId;
    if (updates.seoTitle !== undefined) updateData.seo_title = updates.seoTitle;
    if (updates.seoDescription !== undefined) updateData.seo_description = updates.seoDescription;
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

  async incrementWebsiteClicks(id: string): Promise<void> {
    const { data } = await supabaseAdmin
      .from("profiles")
      .select("website_clicks")
      .eq("id", id)
      .single();
    
    if (data) {
      await supabaseAdmin
        .from("profiles")
        .update({ website_clicks: ((data as any).website_clicks || 0) + 1 })
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

  // Subscription Items
  async createSubscriptionItem(item: InsertSubscriptionItem): Promise<SubscriptionItem> {
    const { data, error } = await supabaseAdmin
      .from("subscription_items")
      .insert({
        gardener_id: item.accountId,
        profile_id: item.profileId,
        subscription_plan_id: item.subscriptionPlanId,
        start_date: item.startDate,
        end_date: item.endDate,
        status: item.status || "PENDING",
        payment_frequency: item.paymentFrequency || "YEARLY",
        auto_renew: item.autoRenew ?? true,
        years: item.years || 1,
        total_amount: item.totalAmount,
        mollie_payment_id: item.molliePaymentId,
      })
      .select()
      .single();
    
    if (error) {
      console.error("Error creating subscription item:", error);
      throw error;
    }
    return this.mapSubscriptionItem(data);
  }

  async getSubscriptionItemsByAccountId(accountId: string): Promise<SubscriptionItem[]> {
    const { data, error } = await supabaseAdmin
      .from("subscription_items")
      .select("*")
      .eq("gardener_id", accountId)
      .order("created_at", { ascending: false });
    
    if (error) throw error;
    return (data || []).map(this.mapSubscriptionItem);
  }

  async getSubscriptionItemByProfileId(profileId: string): Promise<SubscriptionItem | null> {
    const { data, error } = await supabaseAdmin
      .from("subscription_items")
      .select("*")
      .eq("profile_id", profileId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    
    if (error) {
      if (error.code === "PGRST116") return null; // No rows found
      throw error;
    }
    return data ? this.mapSubscriptionItem(data) : null;
  }

  async getSubscriptionItemById(id: string): Promise<SubscriptionItem | null> {
    const { data, error } = await supabaseAdmin
      .from("subscription_items")
      .select("*")
      .eq("id", id)
      .single();
    
    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }
    return data ? this.mapSubscriptionItem(data) : null;
  }

  async getSubscriptionItemByMolliePaymentId(molliePaymentId: string): Promise<SubscriptionItem | null> {
    const { data, error } = await supabaseAdmin
      .from("subscription_items")
      .select("*")
      .eq("mollie_payment_id", molliePaymentId)
      .single();
    
    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }
    return data ? this.mapSubscriptionItem(data) : null;
  }

  async updateSubscriptionItem(id: string, updates: Partial<SubscriptionItem>): Promise<SubscriptionItem> {
    const dbUpdates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.startDate !== undefined) dbUpdates.start_date = updates.startDate instanceof Date ? updates.startDate.toISOString() : updates.startDate;
    if (updates.endDate !== undefined) dbUpdates.end_date = updates.endDate instanceof Date ? updates.endDate.toISOString() : updates.endDate;
    if (updates.years !== undefined) dbUpdates.years = updates.years;
    if (updates.totalAmount !== undefined) dbUpdates.total_amount = updates.totalAmount;
    if (updates.paidAt !== undefined) dbUpdates.paid_at = updates.paidAt instanceof Date ? updates.paidAt.toISOString() : updates.paidAt;
    if (updates.molliePaymentId !== undefined) dbUpdates.mollie_payment_id = updates.molliePaymentId;
    if (updates.autoRenew !== undefined) dbUpdates.auto_renew = updates.autoRenew;
    
    const { data, error } = await supabaseAdmin
      .from("subscription_items")
      .update(dbUpdates)
      .eq("id", id)
      .select()
      .single();
    
    if (error) throw error;
    return this.mapSubscriptionItem(data);
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

  private mapAccount(data: Record<string, unknown>): Account {
    return {
      id: data.id as string,
      authUserId: data.auth_user_id as string,
      email: data.email as string,
      role: data.role as Account["role"],
      vatNumber: data.vat_number as string | null ?? null,
      companyName: data.company_name as string | null ?? null,
      billingStreet: data.billing_street as string | null ?? null,
      billingNumber: data.billing_number as string | null ?? null,
      billingPostcode: data.billing_postcode as string | null ?? null,
      billingCity: data.billing_city as string | null ?? null,
      emailVerified: data.email_verified as boolean | null,
      emailVerifiedAt: data.email_verified_at ? new Date(data.email_verified_at as string) : null,
      createdAt: new Date(data.created_at as string),
      updatedAt: new Date(data.updated_at as string),
    };
  }

  private mapProfile(data: Record<string, unknown>): Profile {
    return {
      id: data.id as string,
      accountId: data.account_id as string,
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
      logoUrl: data.logo_url as string | null,
      imageUrls: data.image_urls as string[] | null,
      isActive: data.is_active as boolean,
      isPublic: data.is_public as boolean,
      isVerified: (data.is_verified as boolean) ?? false,
      verificationStatus: (data.verification_status as Profile["verificationStatus"]) ?? "PENDING",
      viewCount: (data.view_count as number) ?? 0,
      websiteClicks: (data.website_clicks as number) ?? 0,
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

  private mapSubscriptionItem(data: Record<string, unknown>): SubscriptionItem {
    return {
      id: data.id as string,
      accountId: (data.gardener_id || data.account_id) as string,
      profileId: data.profile_id as string | null,
      subscriptionPlanId: data.subscription_plan_id as string | null,
      mollieSubscriptionId: data.mollie_subscription_id as string | null,
      mollieCustomerId: data.mollie_customer_id as string | null,
      molliePaymentId: data.mollie_payment_id as string | null,
      startDate: new Date(data.start_date as string),
      endDate: new Date(data.end_date as string),
      currentPeriodStart: data.current_period_start ? new Date(data.current_period_start as string) : null,
      currentPeriodEnd: data.current_period_end ? new Date(data.current_period_end as string) : null,
      years: data.years as number | null,
      totalAmount: data.total_amount as string | null,
      paidAt: data.paid_at ? new Date(data.paid_at as string) : null,
      autoRenew: data.auto_renew as boolean | null,
      paymentFrequency: data.payment_frequency as SubscriptionItem["paymentFrequency"],
      status: data.status as SubscriptionItem["status"],
      mailInvoice: data.mail_invoice as boolean | null,
      gracePeriodUntil: data.grace_period_until ? new Date(data.grace_period_until as string) : null,
      cancelAtPeriodEnd: data.cancel_at_period_end as boolean | null,
      canceledAt: data.canceled_at ? new Date(data.canceled_at as string) : null,
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
