import { randomUUID } from "crypto";
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
import { supabaseStorage } from "./supabase-storage";

export interface IStorage {
  // Categories
  getCategories(): Promise<Category[]>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;

  // Locations
  getLocations(): Promise<Location[]>;
  getLocationBySlug(slug: string): Promise<Location | undefined>;
  createLocation(location: InsertLocation): Promise<Location>;

  // Businesses (formerly Gardeners)
  getBusiness(id: string): Promise<Business | undefined>;
  getBusinessByAccountId(accountId: string): Promise<Business | undefined>;
  createBusiness(business: InsertBusiness): Promise<Business>;

  // Profiles
  getProfiles(): Promise<Profile[]>;
  getProfileBySlug(slug: string): Promise<ProfileWithRelations | undefined>;
  getProfileById(id: string): Promise<ProfileWithRelations | undefined>;
  getProfilesByBusinessId(businessId: string): Promise<Profile[]>;
  getFeaturedProfiles(): Promise<ProfileWithRelations[]>;
  searchProfiles(params: SearchParams): Promise<{ profiles: ProfileWithRelations[]; total: number; page: number; totalPages: number }>;
  createProfile(profile: InsertProfile): Promise<Profile>;
  updateProfile(id: string, updates: Partial<InsertProfile>): Promise<Profile | undefined>;
  deleteProfile(id: string): Promise<void>;
  incrementProfileViewCount(id: string): Promise<void>;

  // Profile Status History
  getProfileStatusHistory(profileId: string): Promise<ProfileStatusHistory[]>;
  createProfileStatusHistory(entry: InsertProfileStatusHistory): Promise<ProfileStatusHistory>;

  // Offices
  getOfficeByProfileId(profileId: string): Promise<Office | undefined>;
  createOffice(office: InsertOffice): Promise<Office>;
  updateOffice(profileId: string, updates: Partial<InsertOffice>): Promise<Office | undefined>;

  // Practicals
  getPracticalByProfileId(profileId: string): Promise<Practical | undefined>;
  createPractical(practical: InsertPractical): Promise<Practical>;
  updatePractical(profileId: string, updates: Partial<InsertPractical>): Promise<Practical | undefined>;

  // Contact Requests
  createContactRequest(request: InsertContactRequest): Promise<ContactRequest>;
  getContactRequestsByProfileId(profileId: string): Promise<ContactRequest[]>;

  // Subscription Plans
  getSubscriptionPlans(): Promise<SubscriptionPlan[]>;
}

export class MemStorage implements IStorage {
  private categories: Map<string, Category>;
  private locations: Map<string, Location>;
  private businesses: Map<string, Business>;
  private profiles: Map<string, Profile>;
  private profileStatusHistory: Map<string, ProfileStatusHistory>;
  private offices: Map<string, Office>;
  private practicals: Map<string, Practical>;
  private contactRequests: Map<string, ContactRequest>;

  constructor() {
    this.categories = new Map();
    this.locations = new Map();
    this.businesses = new Map();
    this.profiles = new Map();
    this.profileStatusHistory = new Map();
    this.offices = new Map();
    this.practicals = new Map();
    this.contactRequests = new Map();

    this.seedData();
  }

  private seedData() {
    // Seed Categories (now Tuinonderhoud and Tuinaanleg as main categories)
    const categoriesData = [
      { name: "Tuinonderhoud", slug: "tuinonderhoud", mainCategory: "TUINONDERHOUD" as const, description: "Onderhoud van bestaande tuinen", sortOrder: 1 },
      { name: "Tuinaanleg", slug: "tuinaanleg", mainCategory: "TUINAANLEG" as const, description: "Aanleg van nieuwe tuinen", sortOrder: 2 },
    ];

    categoriesData.forEach((cat) => {
      const id = randomUUID();
      const category: Category = {
        id,
        name: cat.name,
        slug: cat.slug,
        mainCategory: cat.mainCategory,
        description: cat.description,
        isActive: true,
        sortOrder: cat.sortOrder,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.categories.set(id, category);
    });

    // Seed Locations (Belgian cities with provinces and regions)
    const locationsData = [
      { name: "Gent", slug: "gent", postcode: "9000", municipality: "Gent", province: "OOST_VLAANDEREN" as const, region: "VLAANDEREN" as const, latitude: 51.0543, longitude: 3.7174 },
      { name: "Antwerpen", slug: "antwerpen", postcode: "2000", municipality: "Antwerpen", province: "ANTWERPEN" as const, region: "VLAANDEREN" as const, latitude: 51.2194, longitude: 4.4025 },
      { name: "Brussel", slug: "brussel", postcode: "1000", municipality: "Brussel", province: "BRUSSEL" as const, region: "BRUSSEL" as const, latitude: 50.8503, longitude: 4.3517 },
      { name: "Brugge", slug: "brugge", postcode: "8000", municipality: "Brugge", province: "WEST_VLAANDEREN" as const, region: "VLAANDEREN" as const, latitude: 51.2093, longitude: 3.2247 },
      { name: "Leuven", slug: "leuven", postcode: "3000", municipality: "Leuven", province: "VLAAMS_BRABANT" as const, region: "VLAANDEREN" as const, latitude: 50.8798, longitude: 4.7005 },
      { name: "Mechelen", slug: "mechelen", postcode: "2800", municipality: "Mechelen", province: "ANTWERPEN" as const, region: "VLAANDEREN" as const, latitude: 51.0259, longitude: 4.4776 },
      { name: "Hasselt", slug: "hasselt", postcode: "3500", municipality: "Hasselt", province: "LIMBURG" as const, region: "VLAANDEREN" as const, latitude: 50.9307, longitude: 5.3378 },
      { name: "Kortrijk", slug: "kortrijk", postcode: "8500", municipality: "Kortrijk", province: "WEST_VLAANDEREN" as const, region: "VLAANDEREN" as const, latitude: 50.8279, longitude: 3.2649 },
      { name: "Aalst", slug: "aalst", postcode: "9300", municipality: "Aalst", province: "OOST_VLAANDEREN" as const, region: "VLAANDEREN" as const, latitude: 50.9364, longitude: 4.0355 },
      { name: "Oostende", slug: "oostende", postcode: "8400", municipality: "Oostende", province: "WEST_VLAANDEREN" as const, region: "VLAANDEREN" as const, latitude: 51.2154, longitude: 2.9286 },
      { name: "Sint-Niklaas", slug: "sint-niklaas", postcode: "9100", municipality: "Sint-Niklaas", province: "OOST_VLAANDEREN" as const, region: "VLAANDEREN" as const, latitude: 51.1562, longitude: 4.1437 },
      { name: "Roeselare", slug: "roeselare", postcode: "8800", municipality: "Roeselare", province: "WEST_VLAANDEREN" as const, region: "VLAANDEREN" as const, latitude: 50.9444, longitude: 3.1257 },
    ];

    locationsData.forEach((loc) => {
      const id = randomUUID();
      const location: Location = {
        id,
        name: loc.name,
        slug: loc.slug,
        postcode: loc.postcode,
        municipality: loc.municipality,
        province: loc.province,
        region: loc.region,
        latitude: loc.latitude,
        longitude: loc.longitude,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.locations.set(id, location);
    });

    // Get category and location IDs
    const categoryArray = Array.from(this.categories.values());
    const locationArray = Array.from(this.locations.values());

    // Seed sample Businesses and Profiles
    const sampleProfiles = [
      {
        name: "Groene Vingers Tuinen",
        slug: "groene-vingers-tuinen",
        email: "info@groenevingers.be",
        telnr: "+32 9 123 45 67",
        website: "https://groenevingers.be",
        hasWebsite: true,
        title: "Tuinaanleg & Onderhoud",
        introduction: "Met meer dan 15 jaar ervaring creëren wij droomtuinen. Van kleine stadstuinen tot grote landschapsprojecten, wij maken uw groene dromen waar.",
        description: "Groene Vingers Tuinen is gespecialiseerd in het ontwerpen en aanleggen van tuinen die perfect passen bij uw woning en levensstijl. Wij werken met duurzame materialen en hebben oog voor detail.\n\nOnze diensten omvatten complete tuinaanleg, terrasaanleg, vijvers, gazonaanleg en seizoensonderhoud.",
        specializations: ["GRASAANLEG", "PADEN_TERRASSEN", "BESTRATING"],
        offeredServices: ["Tuinontwerp", "Tuinaanleg", "Terrasaanleg", "Gazonaanleg", "Seizoensonderhoud", "Snoeien"],
        isPublic: true,
        isActive: true,
        isVerified: true,
        verificationStatus: "APPROVED" as const,
        categorySlug: "tuinaanleg",
        locationSlug: "gent",
        office: { street: "Korenmarkt", number: "15", town: "Gent", municipality: "Gent", postcode: "9000", province: "OOST_VLAANDEREN" as const },
        practical: { experienceYears: 15, languages: ["NL" as const, "FR" as const, "EN" as const], tariff: "Op aanvraag", acceptedPaymentMethods: "Bankoverschrijving, Bancontact" },
      },
      {
        name: "De Tuinarchitect",
        slug: "de-tuinarchitect",
        email: "contact@detuinarchitect.be",
        telnr: "+32 3 456 78 90",
        website: "https://detuinarchitect.be",
        hasWebsite: true,
        title: "Tuinontwerp & Landschapsarchitectuur",
        introduction: "Innovatieve tuinontwerpen die functionaliteit en esthetiek combineren. Elk project is uniek, net zoals uw tuin dat verdient te zijn.",
        description: "Als ervaren tuinarchitect ontwerp ik tuinen die niet alleen mooi zijn, maar ook praktisch en duurzaam. Ik luister naar uw wensen en vertaal deze naar een coherent ontwerp dat past bij uw budget en onderhoudsmogelijkheden.",
        specializations: ["GRASAANLEG", "BEPLANTING", "VIJVERS"],
        offeredServices: ["3D Tuinontwerp", "Beplantingsplan", "Verlichtingsplan", "Begeleiding aanleg", "Adviesgesprek"],
        isPublic: true,
        isActive: true,
        isVerified: true,
        verificationStatus: "APPROVED" as const,
        categorySlug: "tuinaanleg",
        locationSlug: "antwerpen",
        office: { street: "Meir", number: "42", town: "Antwerpen", municipality: "Antwerpen", postcode: "2000", province: "ANTWERPEN" as const },
        practical: { experienceYears: 12, languages: ["NL" as const, "EN" as const], tariff: "€75-125/uur", acceptedPaymentMethods: "Bankoverschrijving" },
      },
      {
        name: "Boomzorg Vlaanderen",
        slug: "boomzorg-vlaanderen",
        email: "info@boomzorg.be",
        telnr: "+32 50 123 456",
        hasWebsite: false,
        title: "Gecertificeerd Boomverzorger",
        introduction: "Professionele boomverzorging door gecertificeerde arboristen. Veilig, vakkundig en met respect voor de natuur.",
        description: "Boomzorg Vlaanderen biedt complete boomverzorging aan: van snoeien en vellen tot stronkverwijdering en boomonderzoek. Al onze medewerkers zijn European Tree Worker gecertificeerd.",
        specializations: ["SNOEIEN_BOMEN", "SNOEIEN_STRUIKEN"],
        offeredServices: ["Snoeien", "Vellen", "Stronkverwijdering", "Boomonderzoek", "Stormschade", "Kroonreductie"],
        isPublic: true,
        isActive: true,
        isVerified: true,
        verificationStatus: "APPROVED" as const,
        categorySlug: "tuinonderhoud",
        locationSlug: "brugge",
        office: { street: "Markt", number: "7", town: "Brugge", municipality: "Brugge", postcode: "8000", province: "WEST_VLAANDEREN" as const },
        practical: { experienceYears: 20, languages: ["NL" as const, "FR" as const], tariff: "Op basis van offerte", acceptedPaymentMethods: "Cash, Bankoverschrijving" },
      },
      {
        name: "Tuinonderhoud Plus",
        slug: "tuinonderhoud-plus",
        email: "hello@tuinonderhoudplus.be",
        telnr: "+32 16 789 012",
        website: "https://tuinonderhoudplus.be",
        hasWebsite: true,
        title: "Hovenier",
        introduction: "Betrouwbaar tuinonderhoud het hele jaar door. Van grasmaaien tot complete seizoensklussen.",
        specializations: ["GRAS_MAAIEN", "GAZONONDERHOUD", "SNOEIEN_STRUIKEN"],
        offeredServices: ["Grasmaaien", "Hagen knippen", "Onkruid verwijderen", "Bladruimen", "Bemesting", "Verticuteren"],
        isPublic: true,
        isActive: true,
        isVerified: true,
        verificationStatus: "APPROVED" as const,
        categorySlug: "tuinonderhoud",
        locationSlug: "leuven",
        office: { street: "Bondgenotenlaan", number: "88", town: "Leuven", municipality: "Leuven", postcode: "3000", province: "VLAAMS_BRABANT" as const },
        practical: { experienceYears: 8, languages: ["NL" as const], tariff: "€35/uur", acceptedPaymentMethods: "Bancontact, Cash" },
      },
      {
        name: "Eco Tuinen",
        slug: "eco-tuinen",
        email: "info@ecotuinen.be",
        telnr: "+32 11 234 567",
        website: "https://ecotuinen.be",
        hasWebsite: true,
        title: "Ecologische Tuinaanleg",
        introduction: "Duurzame tuinen die bijdragen aan de biodiversiteit. Wij creëren natuurlijke tuinen waar mens, dier en plant floreren.",
        description: "Eco Tuinen is gespecialiseerd in ecologische tuinaanleg. Wij gebruiken uitsluitend inheemse plantensoorten en duurzame materialen. Onze tuinen trekken vlinders, bijen en vogels aan.",
        specializations: ["BEPLANTING", "GRASAANLEG", "VIJVERS"],
        offeredServices: ["Ecologische tuinaanleg", "Insectenhotels", "Natuurlijke vijvers", "Bloemenweiden", "Biodiversiteitsadvies"],
        isPublic: true,
        isActive: true,
        isVerified: true,
        verificationStatus: "APPROVED" as const,
        categorySlug: "tuinaanleg",
        locationSlug: "hasselt",
        office: { street: "Kolonel Dusartplein", number: "12", town: "Hasselt", municipality: "Hasselt", postcode: "3500", province: "LIMBURG" as const },
        practical: { experienceYears: 10, languages: ["NL" as const, "DE" as const], tariff: "Op aanvraag", acceptedPaymentMethods: "Bankoverschrijving" },
      },
      {
        name: "Gazon Expert",
        slug: "gazon-expert",
        email: "contact@gazonexpert.be",
        telnr: "+32 56 345 678",
        hasWebsite: false,
        title: "Gazonspecialist",
        introduction: "Het perfecte gazon begint hier. Aanleg, renovatie en professioneel onderhoud van gazons.",
        specializations: ["GAZONONDERHOUD", "GRAS_MAAIEN", "BEMESTING"],
        offeredServices: ["Gazonaanleg", "Gazonrenovatie", "Verticuteren", "Bemesting", "Mosbestrijding", "Graszoden plaatsen"],
        isPublic: true,
        isActive: true,
        isVerified: true,
        verificationStatus: "APPROVED" as const,
        categorySlug: "tuinonderhoud",
        locationSlug: "kortrijk",
        office: { street: "Grote Markt", number: "1", town: "Kortrijk", municipality: "Kortrijk", postcode: "8500", province: "WEST_VLAANDEREN" as const },
        practical: { experienceYears: 6, languages: ["NL" as const, "FR" as const], tariff: "€40/uur of forfait", acceptedPaymentMethods: "Cash, Bancontact, Bankoverschrijving" },
      },
    ];

    sampleProfiles.forEach((profileData) => {
      const businessId = randomUUID();
      const profileId = randomUUID();
      const officeId = randomUUID();
      const practicalId = randomUUID();
      const statusHistoryId = randomUUID();

      const category = categoryArray.find((c) => c.slug === profileData.categorySlug);
      const location = locationArray.find((l) => l.slug === profileData.locationSlug);

      // Create business
      this.businesses.set(businessId, {
        id: businessId,
        accountId: randomUUID(),
        email: profileData.email,
        role: "BUSINESS",
        emailVerified: true,
        emailVerifiedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Create profile
      this.profiles.set(profileId, {
        id: profileId,
        businessId,
        slug: profileData.slug,
        name: profileData.name,
        email: profileData.email,
        telnr: profileData.telnr || null,
        website: profileData.website || null,
        hasWebsite: profileData.hasWebsite || false,
        description: profileData.description || null,
        introduction: profileData.introduction || null,
        title: profileData.title || null,
        education: null,
        specializations: profileData.specializations,
        offeredServices: profileData.offeredServices,
        logoUrl: null,
        imageUrls: null,
        isActive: profileData.isActive,
        isPublic: profileData.isPublic,
        isVerified: profileData.isVerified || false,
        verificationStatus: profileData.verificationStatus || "PENDING",
        hideAddress: false,
        viewCount: 0,
        seoTitle: null,
        seoDescription: null,
        categoryId: category?.id || null,
        locationId: location?.id || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Create initial status history
      this.profileStatusHistory.set(statusHistoryId, {
        id: statusHistoryId,
        profileId,
        status: "APPROVED",
        reason: null,
        createdAt: new Date(),
      });

      // Create office
      if (profileData.office) {
        this.offices.set(officeId, {
          id: officeId,
          profileId,
          street: profileData.office.street,
          number: profileData.office.number,
          town: profileData.office.town,
          municipality: profileData.office.municipality,
          postcode: profileData.office.postcode,
          province: profileData.office.province,
          latitude: null,
          longitude: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      // Create practical
      if (profileData.practical) {
        this.practicals.set(practicalId, {
          id: practicalId,
          profileId,
          experienceYears: profileData.practical.experienceYears,
          languages: profileData.practical.languages,
          tariff: profileData.practical.tariff || null,
          acceptedPaymentMethods: profileData.practical.acceptedPaymentMethods || null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    });
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values())
      .filter((c) => c.isActive)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    return Array.from(this.categories.values()).find((c) => c.slug === slug && c.isActive);
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const id = randomUUID();
    const newCategory: Category = {
      id,
      name: category.name,
      slug: category.slug,
      mainCategory: category.mainCategory,
      description: category.description ?? null,
      isActive: category.isActive ?? true,
      sortOrder: category.sortOrder ?? 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.categories.set(id, newCategory);
    return newCategory;
  }

  // Locations
  async getLocations(): Promise<Location[]> {
    return Array.from(this.locations.values())
      .filter((l) => l.isActive)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async getLocationBySlug(slug: string): Promise<Location | undefined> {
    return Array.from(this.locations.values()).find((l) => l.slug === slug && l.isActive);
  }

  async createLocation(location: InsertLocation): Promise<Location> {
    const id = randomUUID();
    const newLocation: Location = {
      id,
      name: location.name,
      slug: location.slug,
      postcode: location.postcode,
      municipality: location.municipality,
      province: location.province ?? null,
      region: location.region ?? null,
      latitude: location.latitude ?? null,
      longitude: location.longitude ?? null,
      isActive: location.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.locations.set(id, newLocation);
    return newLocation;
  }

  // Businesses
  async getBusiness(id: string): Promise<Business | undefined> {
    return this.businesses.get(id);
  }

  async getBusinessByAccountId(accountId: string): Promise<Business | undefined> {
    return Array.from(this.businesses.values()).find((b) => b.accountId === accountId);
  }

  async createBusiness(business: InsertBusiness): Promise<Business> {
    const id = randomUUID();
    const newBusiness: Business = {
      id,
      ...business,
      role: business.role ?? "BUSINESS",
      emailVerified: business.emailVerified ?? false,
      emailVerifiedAt: business.emailVerifiedAt ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.businesses.set(id, newBusiness);
    return newBusiness;
  }

  // Profiles
  async getProfiles(): Promise<Profile[]> {
    return Array.from(this.profiles.values()).filter((p) => p.isActive);
  }

  async getProfileBySlug(slug: string): Promise<ProfileWithRelations | undefined> {
    const profile = Array.from(this.profiles.values()).find((p) => p.slug === slug && p.isActive);
    if (!profile) return undefined;
    return this.enrichProfile(profile);
  }

  async getProfileById(id: string): Promise<ProfileWithRelations | undefined> {
    const profile = this.profiles.get(id);
    if (!profile) return undefined;
    return this.enrichProfile(profile);
  }

  async getProfilesByBusinessId(businessId: string): Promise<Profile[]> {
    return Array.from(this.profiles.values()).filter((p) => p.businessId === businessId);
  }

  async getFeaturedProfiles(): Promise<ProfileWithRelations[]> {
    const featured = Array.from(this.profiles.values())
      .filter((p) => p.isActive && p.isPublic)
      .slice(0, 6);
    return Promise.all(featured.map((p) => this.enrichProfile(p)));
  }

  async searchProfiles(params: SearchParams): Promise<{ profiles: ProfileWithRelations[]; total: number; page: number; totalPages: number }> {
    let results = Array.from(this.profiles.values()).filter((p) => p.isActive && p.isPublic);

    // Filter by category
    if (params.categorySlug) {
      const category = await this.getCategoryBySlug(params.categorySlug);
      if (category) {
        results = results.filter((p) => p.categoryId === category.id);
      }
    }

    // Filter by main category
    if (params.mainCategory) {
      const categories = await this.getCategories();
      const matchingCategories = categories.filter((c) => c.mainCategory === params.mainCategory);
      const categoryIds = matchingCategories.map((c) => c.id);
      results = results.filter((p) => p.categoryId && categoryIds.includes(p.categoryId));
    }

    // Filter by location
    if (params.locationSlug) {
      const location = await this.getLocationBySlug(params.locationSlug);
      if (location) {
        results = results.filter((p) => p.locationId === location.id);
      }
    }

    // Filter by specializations
    if (params.specializations && params.specializations.length > 0) {
      results = results.filter((p) =>
        p.specializations && params.specializations!.some((s) => p.specializations!.includes(s))
      );
    }

    // Search query
    if (params.query) {
      const query = params.query.toLowerCase();
      results = results.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query) ||
          p.title?.toLowerCase().includes(query)
      );
    }

    const total = results.length;
    const page = params.page || 1;
    const limit = params.limit || 12;
    const totalPages = Math.ceil(total / limit);

    const paginatedResults = results.slice((page - 1) * limit, page * limit);
    const enrichedProfiles = await Promise.all(paginatedResults.map((p) => this.enrichProfile(p)));

    return { profiles: enrichedProfiles, total, page, totalPages };
  }

  async createProfile(profile: InsertProfile): Promise<Profile> {
    const id = randomUUID();
    const newProfile: Profile = {
      id,
      businessId: profile.businessId,
      slug: profile.slug,
      name: profile.name,
      email: profile.email,
      telnr: profile.telnr ?? null,
      website: profile.website ?? null,
      hasWebsite: profile.hasWebsite ?? false,
      description: profile.description ?? null,
      introduction: profile.introduction ?? null,
      title: profile.title ?? null,
      education: profile.education ?? null,
      specializations: profile.specializations ?? null,
      offeredServices: profile.offeredServices ?? null,
      logoUrl: profile.logoUrl ?? null,
      imageUrls: profile.imageUrls ?? null,
      isActive: profile.isActive ?? true,
      isPublic: profile.isPublic ?? false,
      hideAddress: profile.hideAddress ?? false,
      viewCount: profile.viewCount ?? 0,
      seoTitle: profile.seoTitle ?? null,
      seoDescription: profile.seoDescription ?? null,
      categoryId: profile.categoryId ?? null,
      locationId: profile.locationId ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.profiles.set(id, newProfile);
    return newProfile;
  }

  async updateProfile(id: string, updates: Partial<InsertProfile>): Promise<Profile | undefined> {
    const profile = this.profiles.get(id);
    if (!profile) return undefined;

    const updatedProfile: Profile = {
      ...profile,
      ...updates,
      updatedAt: new Date(),
    };
    this.profiles.set(id, updatedProfile);
    return updatedProfile;
  }

  async deleteProfile(id: string): Promise<void> {
    this.profiles.delete(id);
    // Also delete related data
    const officeEntries = Array.from(this.offices.entries());
    for (const [officeId, office] of officeEntries) {
      if (office.profileId === id) {
        this.offices.delete(officeId);
      }
    }
    const practicalEntries = Array.from(this.practicals.entries());
    for (const [practicalId, practical] of practicalEntries) {
      if (practical.profileId === id) {
        this.practicals.delete(practicalId);
      }
    }
  }

  async incrementProfileViewCount(id: string): Promise<void> {
    const profile = this.profiles.get(id);
    if (profile) {
      profile.viewCount = (profile.viewCount || 0) + 1;
      this.profiles.set(id, profile);
    }
  }

  // Profile Status History
  async getProfileStatusHistory(profileId: string): Promise<ProfileStatusHistory[]> {
    return Array.from(this.profileStatusHistory.values())
      .filter((h) => h.profileId === profileId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createProfileStatusHistory(entry: InsertProfileStatusHistory): Promise<ProfileStatusHistory> {
    const id = randomUUID();
    const newEntry: ProfileStatusHistory = {
      id,
      profileId: entry.profileId,
      status: entry.status,
      reason: entry.reason ?? null,
      createdAt: new Date(),
    };
    this.profileStatusHistory.set(id, newEntry);
    return newEntry;
  }

  // Offices
  async getOfficeByProfileId(profileId: string): Promise<Office | undefined> {
    return Array.from(this.offices.values()).find((o) => o.profileId === profileId);
  }

  async createOffice(office: InsertOffice): Promise<Office> {
    const id = randomUUID();
    const newOffice: Office = {
      id,
      profileId: office.profileId,
      street: office.street,
      number: office.number,
      town: office.town,
      municipality: office.municipality,
      postcode: office.postcode,
      province: office.province ?? null,
      latitude: office.latitude ?? null,
      longitude: office.longitude ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.offices.set(id, newOffice);
    return newOffice;
  }

  async updateOffice(profileId: string, updates: Partial<InsertOffice>): Promise<Office | undefined> {
    const office = Array.from(this.offices.values()).find((o) => o.profileId === profileId);
    if (!office) return undefined;

    const updatedOffice: Office = {
      ...office,
      ...updates,
      updatedAt: new Date(),
    };
    this.offices.set(office.id, updatedOffice);
    return updatedOffice;
  }

  // Practicals
  async getPracticalByProfileId(profileId: string): Promise<Practical | undefined> {
    return Array.from(this.practicals.values()).find((p) => p.profileId === profileId);
  }

  async createPractical(practical: InsertPractical): Promise<Practical> {
    const id = randomUUID();
    const newPractical: Practical = {
      id,
      profileId: practical.profileId,
      experienceYears: practical.experienceYears ?? null,
      languages: practical.languages ?? null,
      tariff: practical.tariff ?? null,
      acceptedPaymentMethods: practical.acceptedPaymentMethods ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.practicals.set(id, newPractical);
    return newPractical;
  }

  async updatePractical(profileId: string, updates: Partial<InsertPractical>): Promise<Practical | undefined> {
    const practical = Array.from(this.practicals.values()).find((p) => p.profileId === profileId);
    if (!practical) return undefined;

    const updatedPractical: Practical = {
      ...practical,
      ...updates,
      updatedAt: new Date(),
    };
    this.practicals.set(practical.id, updatedPractical);
    return updatedPractical;
  }

  // Contact Requests
  async createContactRequest(request: InsertContactRequest): Promise<ContactRequest> {
    const id = randomUUID();
    const newRequest: ContactRequest = {
      id,
      profileId: request.profileId,
      visitorName: request.visitorName,
      visitorEmail: request.visitorEmail,
      telnr: request.telnr ?? null,
      subject: request.subject,
      message: request.message,
      createdAt: new Date(),
    };
    this.contactRequests.set(id, newRequest);
    return newRequest;
  }

  async getContactRequestsByProfileId(profileId: string): Promise<ContactRequest[]> {
    return Array.from(this.contactRequests.values())
      .filter((r) => r.profileId === profileId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Subscription Plans
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return [];
  }

  // Helper to enrich profile with relations
  private async enrichProfile(profile: Profile): Promise<ProfileWithRelations> {
    const category = profile.categoryId ? this.categories.get(profile.categoryId) : undefined;
    const location = profile.locationId ? this.locations.get(profile.locationId) : undefined;
    const office = await this.getOfficeByProfileId(profile.id);
    const practical = await this.getPracticalByProfileId(profile.id);

    return {
      ...profile,
      category,
      location,
      office,
      practical,
    };
  }
}

// Use environment variable to determine which storage to use
const USE_SUPABASE = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY;

export const storage: IStorage = USE_SUPABASE ? supabaseStorage : new MemStorage();
