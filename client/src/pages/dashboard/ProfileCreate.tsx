import { useEffect, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { z } from "zod";
import { DashboardLayout } from "./DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Save, ArrowLeft, Info, Eye, EyeOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import type { Category, Location } from "@shared/schema";
import { siteConfig } from "@/lib/theme.config";
import { useSpecializationMap } from "@/lib/useSpecializations";

// Calculate profile completeness from form values
function calculateProfileCompleteness(formValues: ProfileFormData): { percentage: number; missing: string[] } {
  const fields = [
    { key: "name", label: "Bedrijfsnaam", value: formValues.name },
    { key: "email", label: "Email", value: formValues.email },
    { key: "introduction", label: "Introductie", value: formValues.introduction },
    { key: "categoryId", label: "Categorie", value: formValues.categoryId },
    { key: "locationId", label: "Locatie", value: formValues.locationId },
    { key: "telnr", label: "Telefoonnummer", value: formValues.telnr },
    { key: "website", label: "Website", value: formValues.website },
    { key: "description", label: "Beschrijving", value: formValues.description },
    { key: "title", label: "Slagzin / tagline", value: formValues.title },
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
  introduction: z.string().min(10, "Introductie moet minimaal 10 karakters bevatten"),
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

export default function ProfileCreate() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

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
      email: user?.email || "",
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

  // Watch main categories at component level to avoid infinite loops
  const watchedMainCategories = useWatch({
    control: form.control,
    name: "mainCategories",
    defaultValue: [],
  });

  useEffect(() => {
    if (user?.email) {
      form.setValue("email", user.email);
    }
  }, [user?.email, form]);

  // Set default categoryId when categories load
  useEffect(() => {
    if (categories.length > 0 && !form.getValues("categoryId")) {
      form.setValue("categoryId", categories[0].id);
    }
  }, [categories, form]);

  const createProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      if (!user?.id) throw new Error("Je bent niet ingelogd");
      
      // Get or create account first
      const account = await apiRequest("POST", "/api/accounts", {
        authUserId: user.id,
        email: user.email,
      }) as { id: string };
      
      return apiRequest("POST", "/api/profiles", {
        ...data,
        accountId: account.id,
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
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-profiles"] });
      toast({
        title: "Profiel aangemaakt",
        description: "Je bedrijfsprofiel is succesvol aangemaakt.",
      });
      setLocation("/dashboard/profielen");
    },
    onError: (error: Error) => {
      toast({
        title: "Er ging iets mis",
        description: error.message || "Kon profiel niet aanmaken.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProfileFormData) => {
    createProfileMutation.mutate(data);
  };

  return (
    <DashboardLayout 
      title="Nieuw profiel aanmaken" 
      description="Vul de gegevens in om je bedrijfsprofiel aan te maken"
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

        {/* New Profile Info Alert */}
        <Alert 
          className="mb-4 border-muted"
          data-testid="alert-profile-status"
        >
          <Info className="h-4 w-4" />
          <AlertTitle>Nieuw profiel</AlertTitle>
          <AlertDescription>
            Na aanmaak wordt je profiel beoordeeld. Na goedkeuring wordt het zichtbaar op de website.
          </AlertDescription>
        </Alert>

        {/* Profile Completeness Indicator */}
        <ProfileCompletenessCard form={form} />

        <Card>
          <CardHeader>
            <CardTitle>Bedrijfsgegevens</CardTitle>
            <CardDescription>
              Vul je bedrijfsgegevens in om je profiel aan te maken.
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

                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Slagzin / tagline</FormLabel>
                        <FormControl>
                          <Input placeholder={siteConfig.placeholders.profileTitle} {...field} data-testid="input-title" />
                        </FormControl>
                        <FormDescription>Verschijnt als korte slagzin onder je naam op je profiel</FormDescription>
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
                {/* SECTION 3: INTRODUCTIE & BESCHRIJVING */}
                {/* ============================================ */}
                <div className="space-y-6">
                  <div className="border-b pb-2">
                    <h3 className="text-lg font-semibold">Introductie & Beschrijving</h3>
                    <p className="text-sm text-muted-foreground">
                      Vertel bezoekers over je bedrijf en diensten
                    </p>
                  </div>

                  <FormField
                    control={form.control}
                    name="introduction"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Korte introductie <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Schrijf een korte introductie over je bedrijf..." 
                            className="min-h-[100px]"
                            {...field} 
                            data-testid="input-introduction"
                          />
                        </FormControl>
                        <FormDescription>
                          Dit is het eerste wat bezoekers zien op je profielpagina (max 300 tekens)
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
                        <FormLabel>Uitgebreide beschrijving</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Uitgebreide beschrijving van je diensten, ervaring, aanpak, etc..." 
                            className="min-h-[150px]"
                            {...field} 
                            data-testid="input-description"
                          />
                        </FormControl>
                        <FormDescription>
                          Vertel meer over je ervaring, werkwijze en wat je onderscheidt
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
                            ? "Je profiel is zichtbaar voor bezoekers (na goedkeuring)" 
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
                    disabled={createProfileMutation.isPending}
                    className="gap-2"
                    data-testid="button-submit"
                  >
                    {createProfileMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Profiel aanmaken
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

        {/* Info about photo upload */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Profielfoto & Werk foto's</CardTitle>
            <CardDescription>
              Na het aanmaken van je profiel kun je foto's uploaden via het bewerken scherm.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </DashboardLayout>
  );
}
