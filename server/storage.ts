import { randomUUID } from "crypto";
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

  // Gardeners
  getGardener(id: string): Promise<Gardener | undefined>;
  getGardenerByAccountId(accountId: string): Promise<Gardener | undefined>;
  createGardener(gardener: InsertGardener): Promise<Gardener>;

  // Profiles
  getProfiles(): Promise<Profile[]>;
  getProfileBySlug(slug: string): Promise<ProfileWithRelations | undefined>;
  getProfileById(id: string): Promise<ProfileWithRelations | undefined>;
  getProfilesByGardenerId(gardenerId: string): Promise<Profile[]>;
  getFeaturedProfiles(): Promise<ProfileWithRelations[]>;
  searchProfiles(params: SearchParams): Promise<{ profiles: ProfileWithRelations[]; total: number; page: number; totalPages: number }>;
  createProfile(profile: InsertProfile): Promise<Profile>;
  updateProfile(id: string, updates: Partial<InsertProfile>): Promise<Profile | undefined>;
  deleteProfile(id: string): Promise<void>;

  // Offices
  getOfficeByProfileId(profileId: string): Promise<Office | undefined>;
  createOffice(office: InsertOffice): Promise<Office>;

  // Practicals
  getPracticalByProfileId(profileId: string): Promise<Practical | undefined>;
  createPractical(practical: InsertPractical): Promise<Practical>;

  // Contact Requests
  createContactRequest(request: InsertContactRequest): Promise<ContactRequest>;
}

export class MemStorage implements IStorage {
  private categories: Map<string, Category>;
  private locations: Map<string, Location>;
  private gardeners: Map<string, Gardener>;
  private profiles: Map<string, Profile>;
  private offices: Map<string, Office>;
  private practicals: Map<string, Practical>;
  private contactRequests: Map<string, ContactRequest>;

  constructor() {
    this.categories = new Map();
    this.locations = new Map();
    this.gardeners = new Map();
    this.profiles = new Map();
    this.offices = new Map();
    this.practicals = new Map();
    this.contactRequests = new Map();

    this.seedData();
  }

  private seedData() {
    // Seed Categories
    const categoriesData = [
      { name: "Tuinaanlegger", slug: "tuinaanlegger", description: "Specialisten in het aanleggen van tuinen", sortOrder: 1 },
      { name: "Tuinarchitect", slug: "tuinarchitect", description: "Ontwerpers van tuinen en buitenruimtes", sortOrder: 2 },
      { name: "Hovenier", slug: "hovenier", description: "Professionals in tuinonderhoud", sortOrder: 3 },
      { name: "Boomverzorger", slug: "boomverzorger", description: "Experts in boomverzorging en -snoei", sortOrder: 4 },
      { name: "Gazonspecialist", slug: "gazonspecialist", description: "Specialisten in gazonaanleg en -onderhoud", sortOrder: 5 },
      { name: "Vijverspecialist", slug: "vijverspecialist", description: "Experts in vijvers en waterpartijen", sortOrder: 6 },
    ];

    categoriesData.forEach((cat) => {
      const id = randomUUID();
      const category: Category = {
        id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        isActive: true,
        sortOrder: cat.sortOrder,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.categories.set(id, category);
    });

    // Seed Locations (Belgian cities)
    const locationsData = [
      { name: "Gent", slug: "gent", postcode: "9000", municipality: "Gent", region: "Oost-Vlaanderen", country: "België", latitude: 51.0543, longitude: 3.7174 },
      { name: "Antwerpen", slug: "antwerpen", postcode: "2000", municipality: "Antwerpen", region: "Antwerpen", country: "België", latitude: 51.2194, longitude: 4.4025 },
      { name: "Brussel", slug: "brussel", postcode: "1000", municipality: "Brussel", region: "Brussel", country: "België", latitude: 50.8503, longitude: 4.3517 },
      { name: "Brugge", slug: "brugge", postcode: "8000", municipality: "Brugge", region: "West-Vlaanderen", country: "België", latitude: 51.2093, longitude: 3.2247 },
      { name: "Leuven", slug: "leuven", postcode: "3000", municipality: "Leuven", region: "Vlaams-Brabant", country: "België", latitude: 50.8798, longitude: 4.7005 },
      { name: "Mechelen", slug: "mechelen", postcode: "2800", municipality: "Mechelen", region: "Antwerpen", country: "België", latitude: 51.0259, longitude: 4.4776 },
      { name: "Hasselt", slug: "hasselt", postcode: "3500", municipality: "Hasselt", region: "Limburg", country: "België", latitude: 50.9307, longitude: 5.3378 },
      { name: "Kortrijk", slug: "kortrijk", postcode: "8500", municipality: "Kortrijk", region: "West-Vlaanderen", country: "België", latitude: 50.8279, longitude: 3.2649 },
      { name: "Aalst", slug: "aalst", postcode: "9300", municipality: "Aalst", region: "Oost-Vlaanderen", country: "België", latitude: 50.9364, longitude: 4.0355 },
      { name: "Oostende", slug: "oostende", postcode: "8400", municipality: "Oostende", region: "West-Vlaanderen", country: "België", latitude: 51.2154, longitude: 2.9286 },
      { name: "Sint-Niklaas", slug: "sint-niklaas", postcode: "9100", municipality: "Sint-Niklaas", region: "Oost-Vlaanderen", country: "België", latitude: 51.1562, longitude: 4.1437 },
      { name: "Roeselare", slug: "roeselare", postcode: "8800", municipality: "Roeselare", region: "West-Vlaanderen", country: "België", latitude: 50.9444, longitude: 3.1257 },
    ];

    locationsData.forEach((loc) => {
      const id = randomUUID();
      const location: Location = {
        id,
        name: loc.name,
        slug: loc.slug,
        postcode: loc.postcode,
        municipality: loc.municipality,
        region: loc.region,
        country: loc.country,
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

    // Seed sample Gardeners and Profiles
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
        specializations: ["TUINAANLEG", "ONDERHOUD", "BESTRATING"],
        offeredServices: ["Tuinontwerp", "Tuinaanleg", "Terrasaanleg", "Gazonaanleg", "Seizoensonderhoud", "Snoeien"],
        isFeatured: true,
        isVerified: true,
        isPublic: true,
        isActive: true,
        categorySlug: "tuinaanlegger",
        locationSlug: "gent",
        office: { street: "Korenmarkt", number: "15", town: "Gent", municipality: "Gent", postcode: "9000", country: "België" },
        practical: { reachability: "Oost-Vlaanderen", experience: "15+ jaar", languages: ["Nederlands", "Frans", "Engels"], tariff: "Op aanvraag", acceptedPaymentMethods: "Bankoverschrijving, Bancontact" },
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
        specializations: ["TUINAANLEG", "STIJLSPECIALIST", "ECOLOGISCH_TUINIEREN"],
        offeredServices: ["3D Tuinontwerp", "Beplantingsplan", "Verlichtingsplan", "Begeleiding aanleg", "Adviesgesprek"],
        isFeatured: true,
        isVerified: true,
        isPublic: true,
        isActive: true,
        categorySlug: "tuinarchitect",
        locationSlug: "antwerpen",
        office: { street: "Meir", number: "42", town: "Antwerpen", municipality: "Antwerpen", postcode: "2000", country: "België" },
        practical: { reachability: "Heel Vlaanderen", experience: "12 jaar", languages: ["Nederlands", "Engels"], tariff: "€75-125/uur", acceptedPaymentMethods: "Bankoverschrijving" },
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
        specializations: ["BOOMVERZORGING", "SNOEIEN"],
        offeredServices: ["Snoeien", "Vellen", "Stronkverwijdering", "Boomonderzoek", "Stormschade", "Kroonreductie"],
        isFeatured: true,
        isVerified: true,
        isPublic: true,
        isActive: true,
        categorySlug: "boomverzorger",
        locationSlug: "brugge",
        office: { street: "Markt", number: "7", town: "Brugge", municipality: "Brugge", postcode: "8000", country: "België" },
        practical: { reachability: "West-Vlaanderen & Oost-Vlaanderen", experience: "20 jaar", languages: ["Nederlands", "Frans"], tariff: "Op basis van offerte", acceptedPaymentMethods: "Cash, Bankoverschrijving" },
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
        specializations: ["ONDERHOUD", "GAZONSPECIALIST", "SNOEIEN"],
        offeredServices: ["Grasmaaien", "Hagen knippen", "Onkruid verwijderen", "Bladruimen", "Bemesting", "Verticuteren"],
        isFeatured: false,
        isVerified: true,
        isPublic: true,
        isActive: true,
        categorySlug: "hovenier",
        locationSlug: "leuven",
        office: { street: "Bondgenotenlaan", number: "88", town: "Leuven", municipality: "Leuven", postcode: "3000", country: "België" },
        practical: { reachability: "Vlaams-Brabant", experience: "8 jaar", languages: ["Nederlands"], tariff: "€35/uur", acceptedPaymentMethods: "Bancontact, Cash" },
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
        specializations: ["ECOLOGISCH_TUINIEREN", "TUINAANLEG", "VIJVERS"],
        offeredServices: ["Ecologische tuinaanleg", "Insectenhotels", "Natuurlijke vijvers", "Bloemenweiden", "Biodiversiteitsadvies"],
        isFeatured: true,
        isVerified: true,
        isPublic: true,
        isActive: true,
        categorySlug: "tuinaanlegger",
        locationSlug: "hasselt",
        office: { street: "Kolonel Dusartplein", number: "12", town: "Hasselt", municipality: "Hasselt", postcode: "3500", country: "België" },
        practical: { reachability: "Limburg & Vlaams-Brabant", experience: "10 jaar", languages: ["Nederlands", "Duits"], tariff: "Op aanvraag", acceptedPaymentMethods: "Bankoverschrijving" },
      },
      {
        name: "Gazon Expert",
        slug: "gazon-expert",
        email: "contact@gazonexpert.be",
        telnr: "+32 56 345 678",
        hasWebsite: false,
        title: "Gazonspecialist",
        introduction: "Het perfecte gazon begint hier. Aanleg, renovatie en professioneel onderhoud van gazons.",
        specializations: ["GAZONSPECIALIST", "ONDERHOUD"],
        offeredServices: ["Gazonaanleg", "Gazonrenovatie", "Verticuteren", "Bemesting", "Mosbestrijding", "Graszoden plaatsen"],
        isFeatured: false,
        isVerified: true,
        isPublic: true,
        isActive: true,
        categorySlug: "gazonspecialist",
        locationSlug: "kortrijk",
        office: { street: "Grote Markt", number: "1", town: "Kortrijk", municipality: "Kortrijk", postcode: "8500", country: "België" },
        practical: { reachability: "West-Vlaanderen", experience: "6 jaar", languages: ["Nederlands", "Frans"], tariff: "€40/uur of forfait", acceptedPaymentMethods: "Cash, Bancontact, Bankoverschrijving" },
      },
    ];

    sampleProfiles.forEach((profileData) => {
      const gardenerId = randomUUID();
      const profileId = randomUUID();
      const officeId = randomUUID();
      const practicalId = randomUUID();

      const category = categoryArray.find((c) => c.slug === profileData.categorySlug);
      const location = locationArray.find((l) => l.slug === profileData.locationSlug);

      // Create gardener
      this.gardeners.set(gardenerId, {
        id: gardenerId,
        accountId: randomUUID(),
        email: profileData.email,
        role: "GARDENER",
        emailVerified: true,
        emailVerifiedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Create profile
      this.profiles.set(profileId, {
        id: profileId,
        gardenerId,
        slug: profileData.slug,
        name: profileData.name,
        email: profileData.email,
        telnr: profileData.telnr || null,
        website: profileData.website || null,
        hasWebsite: profileData.hasWebsite,
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
        isVerified: profileData.isVerified,
        verificationStatus: "APPROVED",
        verifiedAt: new Date(),
        verifiedBy: null,
        rejectionReason: null,
        isFeatured: profileData.isFeatured,
        seoTitle: null,
        seoDescription: null,
        categoryId: category?.id || null,
        locationId: location?.id || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Create office
      if (profileData.office) {
        this.offices.set(officeId, {
          id: officeId,
          profileId,
          ...profileData.office,
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
          reachability: profileData.practical.reachability || null,
          experience: profileData.practical.experience || null,
          languages: profileData.practical.languages || null,
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
    return Array.from(this.categories.values()).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    return Array.from(this.categories.values()).find((c) => c.slug === slug);
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const id = randomUUID();
    const newCategory: Category = {
      id,
      name: category.name,
      slug: category.slug,
      description: category.description ?? null,
      isActive: category.isActive ?? true,
      sortOrder: category.sortOrder ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.categories.set(id, newCategory);
    return newCategory;
  }

  // Locations
  async getLocations(): Promise<Location[]> {
    return Array.from(this.locations.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  async getLocationBySlug(slug: string): Promise<Location | undefined> {
    return Array.from(this.locations.values()).find((l) => l.slug === slug);
  }

  async createLocation(location: InsertLocation): Promise<Location> {
    const id = randomUUID();
    const newLocation: Location = {
      id,
      name: location.name,
      slug: location.slug,
      postcode: location.postcode,
      municipality: location.municipality,
      latitude: location.latitude ?? null,
      longitude: location.longitude ?? null,
      region: location.region ?? null,
      country: location.country ?? "België",
      isActive: location.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.locations.set(id, newLocation);
    return newLocation;
  }

  // Gardeners
  async getGardener(id: string): Promise<Gardener | undefined> {
    return this.gardeners.get(id);
  }

  async getGardenerByAccountId(accountId: string): Promise<Gardener | undefined> {
    return Array.from(this.gardeners.values()).find((g) => g.accountId === accountId);
  }

  async createGardener(gardener: InsertGardener): Promise<Gardener> {
    const id = randomUUID();
    const newGardener: Gardener = {
      id,
      accountId: gardener.accountId,
      email: gardener.email,
      role: gardener.role ?? "GARDENER",
      emailVerified: gardener.emailVerified ?? null,
      emailVerifiedAt: gardener.emailVerifiedAt ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.gardeners.set(id, newGardener);
    return newGardener;
  }

  // Helper to enrich profile with relations
  private async enrichProfile(profile: Profile): Promise<ProfileWithRelations> {
    const category = profile.categoryId ? Array.from(this.categories.values()).find((c) => c.id === profile.categoryId) : undefined;
    const location = profile.locationId ? Array.from(this.locations.values()).find((l) => l.id === profile.locationId) : undefined;
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

  // Profiles
  async getProfiles(): Promise<Profile[]> {
    return Array.from(this.profiles.values()).filter((p) => p.isActive && p.isPublic);
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

  async getFeaturedProfiles(): Promise<ProfileWithRelations[]> {
    const featured = Array.from(this.profiles.values())
      .filter((p) => p.isActive && p.isPublic && p.isFeatured)
      .slice(0, 6);
    
    return Promise.all(featured.map((p) => this.enrichProfile(p)));
  }

  async searchProfiles(params: SearchParams): Promise<{ profiles: ProfileWithRelations[]; total: number; page: number; totalPages: number }> {
    let profiles = Array.from(this.profiles.values()).filter((p) => p.isActive && p.isPublic);

    // Filter by category
    if (params.categorySlug) {
      const category = await this.getCategoryBySlug(params.categorySlug);
      if (category) {
        profiles = profiles.filter((p) => p.categoryId === category.id);
      }
    }

    // Filter by location
    if (params.locationSlug) {
      const location = await this.getLocationBySlug(params.locationSlug);
      if (location) {
        profiles = profiles.filter((p) => p.locationId === location.id);
      }
    }

    // Filter by query (name, introduction)
    if (params.query) {
      const query = params.query.toLowerCase();
      profiles = profiles.filter((p) =>
        p.name.toLowerCase().includes(query) ||
        p.introduction?.toLowerCase().includes(query) ||
        p.title?.toLowerCase().includes(query)
      );
    }

    // Filter by specializations
    if (params.specializations && params.specializations.length > 0) {
      profiles = profiles.filter((p) =>
        p.specializations?.some((s) => params.specializations!.includes(s))
      );
    }

    const total = profiles.length;
    const page = params.page || 1;
    const limit = params.limit || 12;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;

    const paginatedProfiles = profiles.slice(offset, offset + limit);
    const enrichedProfiles = await Promise.all(paginatedProfiles.map((p) => this.enrichProfile(p)));

    return { profiles: enrichedProfiles, total, page, totalPages };
  }

  async createProfile(profile: InsertProfile): Promise<Profile> {
    const id = randomUUID();
    const newProfile: Profile = {
      id,
      gardenerId: profile.gardenerId,
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
      isVerified: profile.isVerified ?? null,
      verificationStatus: profile.verificationStatus ?? "PENDING",
      verifiedAt: profile.verifiedAt ?? null,
      verifiedBy: profile.verifiedBy ?? null,
      rejectionReason: profile.rejectionReason ?? null,
      isFeatured: profile.isFeatured ?? null,
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

  async getProfilesByGardenerId(gardenerId: string): Promise<Profile[]> {
    return Array.from(this.profiles.values()).filter(p => p.gardenerId === gardenerId);
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
      latitude: office.latitude ?? null,
      longitude: office.longitude ?? null,
      country: office.country ?? "België",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.offices.set(id, newOffice);
    return newOffice;
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
      reachability: practical.reachability ?? null,
      experience: practical.experience ?? null,
      languages: practical.languages ?? null,
      tariff: practical.tariff ?? null,
      acceptedPaymentMethods: practical.acceptedPaymentMethods ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.practicals.set(id, newPractical);
    return newPractical;
  }

  // Contact Requests
  async createContactRequest(request: InsertContactRequest): Promise<ContactRequest> {
    const id = randomUUID();
    const newRequest: ContactRequest = {
      id,
      gardenerId: request.gardenerId,
      profileId: request.profileId,
      visitorName: request.visitorName,
      visitorEmail: request.visitorEmail,
      telnr: request.telnr ?? null,
      subject: request.subject,
      message: request.message,
      status: request.status ?? "NEW",
      gardenerReadAt: request.gardenerReadAt ?? null,
      adminNotified: request.adminNotified ?? null,
      date: request.date ?? new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.contactRequests.set(id, newRequest);
    return newRequest;
  }
}

// Check if Supabase is configured
const isSupabaseConfigured = Boolean(
  process.env.SUPABASE_URL &&
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Use Supabase storage if configured, otherwise use in-memory storage
const storage: IStorage = isSupabaseConfigured ? supabaseStorage : new MemStorage();

if (isSupabaseConfigured) {
  console.log("✅ Using Supabase database storage");
} else {
  console.log("⚠️ Using in-memory storage (Supabase not configured)");
}

export { storage };
