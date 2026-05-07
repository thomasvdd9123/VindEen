import { useEffect, useState, useRef, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation, useParams } from "wouter";
import { z } from "zod";
import { DashboardLayout } from "./DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RichTextEditor } from "@/components/RichTextEditor";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Save, ArrowLeft, Info, Eye, EyeOff, CheckCircle, Upload, X, Image as ImageIcon, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { Category, Location, Profile } from "@shared/schema";
import { siteConfig } from "@/lib/theme.config";
import { PracticalQuestionsForm } from "@/components/PracticalQuestionsForm";
import { LogoUpload } from "@/components/ProfilePhotoUploads";
import { PortfolioManager } from "@/components/PortfolioManager";
import { useSpecializationMap } from "@/lib/useSpecializations";

// Calculate profile completeness from form values
function calculateProfileCompleteness(formValues: ProfileFormData): { percentage: number; missing: string[] } {
  const fields = [
    { key: "name", label: "Bedrijfsnaam", value: formValues.name },
    { key: "email", label: "Email", value: formValues.email },
    { key: "introduction", label: "Slagzin", value: formValues.introduction },
    { key: "categoryId", label: "Categorie", value: formValues.categoryId },
    { key: "locationId", label: "Locatie", value: formValues.locationId },
    { key: "telnr", label: "Telefoonnummer", value: formValues.telnr },
    { key: "website", label: "Website", value: formValues.website },
    { key: "description", label: "Beschrijving", value: formValues.description },
    { key: "specializations", label: "Specialisaties", value: formValues.specializations?.length ? formValues.specializations : null },
  ];
  
  const filled = fields.filter(f => f.value && String(f.value).trim() !== "");
  const missing = fields.filter(f => !f.value || String(f.value).trim() === "").map(f => f.label);
  
  return {
    percentage: Math.round((filled.length / fields.length) * 100),
    missing,
  };
}

const profileSchema = z.object({
  name: z.string().min(2, "Bedrijfsnaam is verplicht"),
  email: z.string().email("Ongeldig email adres"),
  telnr: z.string().optional(),
  website: z.string().optional(),
  title: z.string().optional(),
  introduction: z.string().max(200, "Slagzin mag maximaal 200 tekens zijn").optional(),
  description: z.string().optional(),
  categoryId: z.string().min(1, "Selecteer een categorie"),
  locationId: z.string().min(1, "Selecteer een locatie"),
  isActive: z.boolean().default(true),
  hideAddress: z.boolean().default(false),
  specializations: z.array(z.string()).optional(),
  mainCategories: z.array(z.string()).optional(),
  officeStreet: z.string().optional(),
  officeNumber: z.string().optional(),
  officeTown: z.string().optional(),
  officePostcode: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

function ProfileCompletenessCard({ form }: { form: ReturnType<typeof useForm<ProfileFormData>> }) {
  const formValues = form.watch();
  const { percentage, missing } = calculateProfileCompleteness(formValues);
  
  return (
    <Card className="mb-4" data-testid="card-profile-completeness">
      <CardContent className="pt-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Profiel volledigheid</span>
          <Badge variant={percentage === 100 ? "default" : "secondary"}>
            {percentage}%
          </Badge>
        </div>
        <Progress value={percentage} className="h-2" />
        {missing.length > 0 && (
          <p className="text-xs text-muted-foreground mt-2">
            Nog toe te voegen: {missing.join(", ")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function ProfileEdit() {
  const [, setLocation] = useLocation();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [aiLoading, setAiLoading] = useState(false);

  const { data: profile, isLoading: profileLoading } = useQuery<Profile>({
    queryKey: ["/api/profiles/id", id],
    queryFn: async () => {
      return apiRequest("GET", `/api/profiles/by-id/${id}`);
    },
    enabled: !!id,
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: locations = [] } = useQuery<Location[]>({
    queryKey: ["/api/locations"],
  });

  // Vertical-agnostic catalog from normalized endpoints (no legacy grouped).
  const {
    mainCategoryLabels,
    labelByKey: specializationLabels,
    specializationsByCategory,
    serviceCategories,
  } = useSpecializationMap();
  const mainCategoryDescriptions = useMemo(() => {
    const m: Record<string, string> = {};
    serviceCategories.forEach((c) => {
      m[c.slug] = c.description || "";
    });
    return m;
  }, [serviceCategories]);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      email: "",
      telnr: "",
      website: "",
      title: "",
      introduction: "",
      description: "",
      categoryId: "",
      locationId: "",
      isActive: true,
      hideAddress: false,
      specializations: [],
      mainCategories: [],
      officeStreet: "",
      officeNumber: "",
      officeTown: "",
      officePostcode: "",
    },
  });

  // Practical-question answers — vertical-agnostic, fully data-driven via
  // /api/practical-questions. Hydrated from profile.practical on load and sent
  // back as part of the PUT body.
  const [practicalAnswers, setPracticalAnswers] = useState<Record<string, any>>({});

  // Watch main categories at component level to avoid infinite loops
  const watchedMainCategories = useWatch({
    control: form.control,
    name: "mainCategories",
    defaultValue: [],
  });

  useEffect(() => {
    // Only run when we have real data (not just default empty arrays)
    const categoryKeys = Object.keys(specializationsByCategory);
    const hasRealData = categoryKeys.some((k) => specializationsByCategory[k]?.length > 0);
    if (profile && hasRealData) {
      // Derive main categories from specializations (generic — works for any vertical)
      const derivedMainCategories: string[] = categoryKeys.filter((catKey) => {
        const specs = specializationsByCategory[catKey] || [];
        return profile.specializations?.some((s: string) => specs.includes(s));
      });
      
      form.reset({
        name: profile.name || "",
        email: profile.email || "",
        telnr: profile.telnr || "",
        website: profile.website || "",
        title: profile.title || "",
        introduction: profile.introduction || "",
        description: profile.description || "",
        categoryId: profile.categoryId || "",
        locationId: profile.locationId || "",
        isActive: profile.isActive ?? true,
        hideAddress: profile.hideAddress ?? false,
        specializations: profile.specializations || [],
        mainCategories: derivedMainCategories,
        officeStreet: (profile as any).office?.street || "",
        officeNumber: (profile as any).office?.number || "",
        officeTown: (profile as any).office?.town || "",
        officePostcode: (profile as any).office?.postcode || "",
      });
      setPracticalAnswers((profile as any).practical || {});
    }
  }, [profile, form, specializationsByCategory]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      return apiRequest("PUT", `/api/profiles/${id}`, {
        ...data,
        hasWebsite: !!data.website,
        isActive: data.isActive,
        hideAddress: data.hideAddress,
        specializations: data.specializations,
        office: {
          street: data.officeStreet,
          number: data.officeNumber,
          town: data.officeTown,
          postcode: data.officePostcode,
        },
        practical: practicalAnswers,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/profiles/id", id] });
      toast({
        title: "Profiel bijgewerkt",
        description: "Je wijzigingen zijn opgeslagen.",
      });
      setLocation("/dashboard/profielen");
    },
    onError: (error: Error) => {
      toast({
        title: "Er ging iets mis",
        description: error.message || "Kon profiel niet bijwerken.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data);
  };

  if (profileLoading) {
    return (
      <DashboardLayout title="Profiel bewerken" description="Even geduld...">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (!profile) {
    return (
      <DashboardLayout title="Profiel niet gevonden" description="">
        <Card>
          <CardContent className="py-12 text-center">
            <p>Dit profiel bestaat niet of je hebt geen toegang.</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => setLocation("/dashboard/profielen")}
            >
              Terug naar profielen
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      title="Profiel bewerken" 
      description={`Bewerk de gegevens van ${profile.name}`}
    >
      <div className="max-w-3xl">
        <Button 
          variant="ghost" 
          className="mb-4 gap-2"
          onClick={() => setLocation("/dashboard/profielen")}
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4" />
          Terug naar profielen
        </Button>

        {/* Profile Status Alert */}
        {profile && (
          <Alert 
            className={`mb-4 ${profile.isPublic ? "border-primary/50" : "border-muted"}`}
            data-testid="alert-profile-status"
          >
            {profile.isPublic ? (
              <>
                <CheckCircle className="h-4 w-4 text-primary" />
                <AlertTitle>Profiel is gepubliceerd</AlertTitle>
                <AlertDescription>
                  Je profiel is zichtbaar voor bezoekers op de website.
                </AlertDescription>
              </>
            ) : (
              <>
                <Info className="h-4 w-4" />
                <AlertTitle>Profiel is nog niet gepubliceerd</AlertTitle>
                <AlertDescription>
                  {profile.verificationStatus === "PENDING" 
                    ? "Je profiel wordt beoordeeld. Na goedkeuring wordt het zichtbaar op de website."
                    : profile.verificationStatus === "REJECTED"
                    ? "Je profiel is afgewezen. Pas de gegevens aan en probeer opnieuw."
                    : "Vul je profiel volledig in en activeer het om zichtbaar te worden."}
                </AlertDescription>
              </>
            )}
          </Alert>
        )}

        {/* Profile Completeness Indicator */}
        <ProfileCompletenessCard form={form} />

        <Card>
          <CardHeader>
            <CardTitle>Bedrijfsgegevens</CardTitle>
            <CardDescription>
              Pas je bedrijfsgegevens aan.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                
                {/* ============================================ */}
                {/* SECTION 1: BEDRIJFSGEGEVENS & CONTACTGEGEVENS */}
                {/* ============================================ */}
                <div className="space-y-6">
                  <div className="border-b pb-2">
                    <h3 className="text-lg font-semibold">Bedrijfsgegevens</h3>
                    <p className="text-sm text-muted-foreground">
                      Basisgegevens en contactinformatie van je bedrijf
                    </p>
                  </div>

                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bedrijfsnaam <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="Jouw bedrijfsnaam" {...field} data-testid="input-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />


                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact email <span className="text-destructive">*</span></FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="email@voorbeeld.be" {...field} data-testid="input-email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="telnr"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefoonnummer</FormLabel>
                          <FormControl>
                            <Input placeholder={siteConfig.placeholders.phone} {...field} data-testid="input-phone" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website</FormLabel>
                        <FormControl>
                          <Input placeholder="https://www.jouwwebsite.be" {...field} data-testid="input-website" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="locationId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Regio <span className="text-destructive">*</span></FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-location">
                              <SelectValue placeholder="Selecteer regio" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {locations.map((loc) => (
                              <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>De regio waarin je hoofdzakelijk actief bent</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* ============================================ */}
                {/* SECTION 2: BEDRIJFSADRES */}
                {/* ============================================ */}
                <div className="space-y-6">
                  <div className="border-b pb-2">
                    <h3 className="text-lg font-semibold">Bedrijfsadres</h3>
                    <p className="text-sm text-muted-foreground">
                      Het adres waar je bedrijf gevestigd is
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <FormField
                        control={form.control}
                        name="officeStreet"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Straat</FormLabel>
                            <FormControl>
                              <Input placeholder="Kerkstraat" {...field} data-testid="input-office-street" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="officeNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nr.</FormLabel>
                          <FormControl>
                            <Input placeholder="12" {...field} data-testid="input-office-number" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="officePostcode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Postcode</FormLabel>
                          <FormControl>
                            <Input placeholder="9000" {...field} data-testid="input-office-postcode" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="sm:col-span-2">
                      <FormField
                        control={form.control}
                        name="officeTown"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Gemeente</FormLabel>
                            <FormControl>
                              <Input placeholder="Gent" {...field} data-testid="input-office-town" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="hideAddress"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Adres verbergen</FormLabel>
                          <FormDescription>
                            Verberg je exacte adres op je profiel. Je gemeente blijft altijd zichtbaar.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-hide-address"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                {/* ============================================ */}
                {/* SECTION 3: SLAGZIN & BESCHRIJVING */}
                {/* ============================================ */}
                <div className="space-y-6">
                  <div className="border-b pb-2">
                    <h3 className="text-lg font-semibold">Slagzin & Beschrijving</h3>
                    <p className="text-sm text-muted-foreground">
                      Vertel bezoekers wie je bent en wat je doet
                    </p>
                  </div>

                  <FormField
                    control={form.control}
                    name="introduction"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Slagzin <span className="text-muted-foreground font-normal text-xs">(optioneel)</span></FormLabel>
                        <FormControl>
                          <Input
                            placeholder="bv. Familiebedrijf gespecialiseerd in regulier tuinonderhoud rond Leuven."
                            {...field}
                            data-testid="input-introduction"
                          />
                        </FormControl>
                        <FormDescription>
                          Één zin die verschijnt direct onder je bedrijfsnaam. Kort en krachtig — wie je bent en wat je doet.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between mb-1">
                          <FormLabel>Beschrijving <span className="text-muted-foreground font-normal text-xs">(optioneel, maar sterk aanbevolen)</span></FormLabel>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={aiLoading}
                            onClick={async () => {
                              const website = form.getValues("website");
                              const name = form.getValues("name");
                              if (!website) {
                                toast({ title: "Website vereist", description: "Vul eerst je website-adres in bovenaan.", variant: "destructive" });
                                return;
                              }
                              setAiLoading(true);
                              try {
                                const res = await fetch("/api/ai/generate-description", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ websiteUrl: website, companyName: name }),
                                });
                                if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Onbekende fout"); }
                                const data = await res.json();
                                form.setValue("description", data.description, { shouldDirty: true });
                                toast({ title: "✨ Beschrijving gegenereerd!", description: "Lees de tekst na en pas aan waar nodig." });
                              } catch (e: any) {
                                toast({ title: "AI generatie mislukt", description: e.message, variant: "destructive" });
                              } finally {
                                setAiLoading(false);
                              }
                            }}
                            data-testid="button-ai-generate"
                          >
                            {aiLoading ? <Loader2 className="h-3 w-3 mr-1.5 animate-spin" /> : <Sparkles className="h-3 w-3 mr-1.5" />}
                            Genereer met AI
                          </Button>
                        </div>
                        <FormControl>
                          <RichTextEditor
                            value={field.value || ""}
                            onChange={field.onChange}
                            placeholder="Schrijf hier je beschrijving..."
                            minHeight="250px"
                            data-testid="input-description"
                          />
                        </FormControl>
                        <FormDescription>
                          <span className="font-medium text-foreground">Tips voor een goede beschrijving:</span>
                          <ul className="mt-1.5 space-y-1 list-disc list-inside">
                            <li>Wie ben je? Familiebedrijf, solo of met een team? Hoeveel jaar ervaring?</li>
                            <li>Welke diensten bied je precies aan? (bv. maaien, snoeien, aanleg, bemesting, vijvers)</li>
                            <li>In welke regio's of gemeenten ben je actief?</li>
                            <li>Wat maakt jou anders? (bv. milieuvriendelijk, eigen materiaal, vaste contactpersoon)</li>
                            <li>Hoe werkt een samenwerking? (bv. vrijblijvend plaatsbezoek → persoonlijke prijsopgave)</li>
                            <li>Schrijf in "wij" bij een team, in "ik" als soloondernemer.</li>
                            <li className="font-medium">Heb je een website? Gebruik de AI-knop hierboven — die leest je site en schrijft een unieke tekst.</li>
                          </ul>
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* ============================================ */}
                {/* SECTION 4: CATEGORIEËN */}
                {/* ============================================ */}
                <div className="space-y-6">
                  <div className="border-b pb-2">
                    <h3 className="text-lg font-semibold">Categorieën</h3>
                    <p className="text-sm text-muted-foreground">
                      In welk type tuinwerk ben je gespecialiseerd?
                    </p>
                  </div>

                  <FormField
                    control={form.control}
                    name="mainCategories"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Selecteer je hoofdcategorieën</FormLabel>
                        <FormDescription className="mb-3">
                          Je kunt beide categorieën selecteren als je in beide actief bent
                        </FormDescription>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {Object.entries(mainCategoryLabels).map(([key, label]) => {
                            const isSelected = field.value?.includes(key) || false;
                            const description = mainCategoryDescriptions[key] || "";
                            
                            const handleToggle = (checked: boolean) => {
                              const current = field.value || [];
                              if (checked) {
                                field.onChange([...current, key]);
                              } else {
                                field.onChange(current.filter((c: string) => c !== key));
                                // Also remove specializations from this category
                                const specs = form.getValues("specializations") || [];
                                const categorySpecs = specializationsByCategory[key] || [];
                                form.setValue("specializations", specs.filter((s: string) => !categorySpecs.includes(s)));
                              }
                            };
                            
                            return (
                              <label 
                                key={key}
                                htmlFor={`main-cat-${key}`}
                                className={`relative rounded-lg border-2 p-4 cursor-pointer transition-colors block ${
                                  isSelected 
                                    ? "border-primary bg-primary/5" 
                                    : "border-muted hover:border-muted-foreground/50"
                                }`}
                                data-testid={`card-main-cat-${key.toLowerCase()}`}
                              >
                                <div className="flex items-start gap-3">
                                  <Checkbox
                                    id={`main-cat-${key}`}
                                    checked={isSelected}
                                    onCheckedChange={handleToggle}
                                    className="mt-1"
                                    data-testid={`checkbox-main-cat-${key.toLowerCase()}`}
                                  />
                                  <div className="flex-1">
                                    <span className="text-base font-medium">
                                      {label}
                                    </span>
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {description}
                                    </p>
                                  </div>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* ============================================ */}
                {/* SECTION 5: SPECIALISATIES (per categorie) */}
                {/* ============================================ */}
                <FormField
                  control={form.control}
                  name="specializations"
                  render={({ field }) => {
                    const selectedMainCategories = watchedMainCategories || [];
                    
                    if (selectedMainCategories.length === 0) {
                      return (
                        <div className="space-y-6">
                          <div className="border-b pb-2">
                            <h3 className="text-lg font-semibold text-muted-foreground">Specialisaties</h3>
                            <p className="text-sm text-muted-foreground">
                              Selecteer eerst een hoofdcategorie hierboven
                            </p>
                          </div>
                          <div className="rounded-lg border border-dashed p-6 text-center">
                            <p className="text-muted-foreground">
                              Selecteer eerst een hoofdcategorie om je specialisaties te kiezen
                            </p>
                          </div>
                        </div>
                      );
                    }
                    
                    return (
                      <div className="space-y-6">
                        <div className="border-b pb-2">
                          <h3 className="text-lg font-semibold">Specialisaties</h3>
                          <p className="text-sm text-muted-foreground">
                            Selecteer je specifieke specialisaties per categorie
                          </p>
                        </div>

                        {selectedMainCategories.map(cat => (
                          <div key={cat} className="space-y-3">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-primary" />
                              <h4 className="font-medium">{mainCategoryLabels[cat]}</h4>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pl-4 border-l-2 border-primary/20">
                              {(specializationsByCategory[cat] || []).map((spec) => (
                                <div key={spec} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`spec-${spec}`}
                                    checked={field.value?.includes(spec) || false}
                                    onCheckedChange={(checked) => {
                                      const current = field.value || [];
                                      if (checked) {
                                        field.onChange([...current, spec]);
                                      } else {
                                        field.onChange(current.filter((s) => s !== spec));
                                      }
                                    }}
                                    data-testid={`checkbox-spec-${spec.toLowerCase()}`}
                                  />
                                  <label
                                    htmlFor={`spec-${spec}`}
                                    className="text-sm cursor-pointer"
                                  >
                                    {specializationLabels[spec] || spec}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                        <FormMessage />
                      </div>
                    );
                  }}
                />

                {/* Practical questions */}
                <div className="rounded-lg border p-4">
                  <PracticalQuestionsForm
                    values={practicalAnswers}
                    onChange={setPracticalAnswers}
                    heading="Praktische info"
                    excludeKeys={["priceHour"]}
                  />
                </div>

                {/* Active/Inactive Toggle */}
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base flex items-center gap-2">
                          {field.value ? (
                            <Eye className="h-4 w-4 text-primary" />
                          ) : (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          )}
                          Profiel actief
                        </FormLabel>
                        <FormDescription>
                          {field.value 
                            ? "Je profiel is zichtbaar voor bezoekers" 
                            : "Je profiel is verborgen voor bezoekers"}
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-active"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="pt-4 flex gap-4">
                  <Button 
                    type="submit" 
                    disabled={updateProfileMutation.isPending}
                    className="gap-2"
                    data-testid="button-submit"
                  >
                    {updateProfileMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Wijzigingen opslaan
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setLocation("/dashboard/profielen")}
                  >
                    Annuleren
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Profile Photo Upload */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Profielfoto</CardTitle>
            <CardDescription>
              Upload een profielfoto of bedrijfslogo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LogoUpload 
              profileId={id!} 
              currentLogoUrl={profile?.logoUrl}
              onUploadSuccess={() => {
                queryClient.refetchQueries({ queryKey: ["/api/profiles/id", id] });
              }}
            />
          </CardContent>
        </Card>

        {/* Portfolio Projects */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Portfolio — projecten</CardTitle>
            <CardDescription>
              Voeg projecten toe met foto's, prijs, duur en beschrijving. Klanten zien dit op je profielpagina.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PortfolioManager profileId={id!} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
