import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { z } from "zod";
import { DashboardLayout } from "./DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RichTextEditor } from "@/components/RichTextEditor";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Save, ArrowLeft, Info, Eye, EyeOff, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import type { Category, Location } from "@shared/schema";
import { siteConfig } from "@/lib/theme.config";
import { useSpecializationMap } from "@/lib/useSpecializations";
import { PracticalQuestionsForm } from "@/components/PracticalQuestionsForm";
import { LogoUpload } from "@/components/ProfilePhotoUploads";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Camera } from "lucide-react";

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

export default function ProfileCreate() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [aiLoading, setAiLoading] = useState(false);

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

  const [practicalAnswers, setPracticalAnswers] = useState<Record<string, any>>({});
  const [createdProfileId, setCreatedProfileId] = useState<string | null>(null);

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
        practical: practicalAnswers,
        office: {
          street: data.officeStreet,
          number: data.officeNumber,
          town: data.officeTown,
          postcode: data.officePostcode,
        },
      });
    },
    onSuccess: (profile: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-profiles"] });
      setCreatedProfileId(profile?.id ?? null);
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

                {/* Praktische info */}
                <div className="rounded-lg border p-4">
                  <PracticalQuestionsForm
                    values={practicalAnswers}
                    onChange={setPracticalAnswers}
                    heading="Praktische info"
                    excludeKeys={["priceHour"]}
                  />
                </div>

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

        {/* Photo upload dialog — shown immediately after profile creation */}
        <Dialog
          open={!!createdProfileId}
          onOpenChange={(open) => {
            if (!open) setLocation("/dashboard/profielen");
          }}
        >
          <DialogContent className="max-w-lg" data-testid="dialog-photo-upload">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Camera className="h-5 w-5 text-primary" />
                <DialogTitle>Foto's toevoegen</DialogTitle>
              </div>
              <DialogDescription>
                Je profiel is aangemaakt! Voeg nu een logo en werkfoto's toe om je profiel compleet te maken.
              </DialogDescription>
            </DialogHeader>
            {createdProfileId && (
              <div className="space-y-6 pt-2">
                <div>
                  <p className="text-sm font-medium mb-3">Profielfoto / logo</p>
                  <LogoUpload
                    profileId={createdProfileId}
                    currentLogoUrl={null}
                    onUploadSuccess={() => queryClient.invalidateQueries({ queryKey: ["/api/my-profiles"] })}
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <Button
                    className="flex-1"
                    onClick={() => setLocation("/dashboard/profielen")}
                    data-testid="button-photos-done"
                  >
                    Klaar
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setLocation("/dashboard/profielen")}
                    data-testid="button-photos-skip"
                  >
                    Overslaan
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
