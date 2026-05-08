import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation, useParams } from "wouter";
import { z } from "zod";
import { DashboardLayout } from "./DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Save, ArrowLeft, Info, Eye, EyeOff, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import type { Profile } from "@shared/schema";
import { PracticalQuestionsForm } from "@/components/PracticalQuestionsForm";
import { LogoUpload } from "@/components/ProfilePhotoUploads";
import { PortfolioManager } from "@/components/PortfolioManager";
import { useSpecializationMap } from "@/lib/useSpecializations";
import { ProfileContactSection } from "@/components/profile/ProfileContactSection";
import { ProfileAddressSection } from "@/components/profile/ProfileAddressSection";
import { ProfileAboutSection } from "@/components/profile/ProfileAboutSection";
import { ProfileServicesSection } from "@/components/profile/ProfileServicesSection";

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
  const { data: profile, isLoading: profileLoading } = useQuery<Profile>({
    queryKey: ["/api/profiles/id", id],
    queryFn: async () => {
      return apiRequest("GET", `/api/profiles/by-id/${id}`);
    },
    enabled: !!id,
  });

  // Catalog needed only to derive mainCategories from specializations on load
  const { specializationsByCategory } = useSpecializationMap();

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

  const w = form.watch();

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
                
                {/* ── Shared field sections ──────────────────────────────── */}
                <ProfileContactSection
                  value={{
                    name: w.name || "",
                    email: w.email || "",
                    telnr: w.telnr || "",
                    website: w.website || "",
                    locationId: w.locationId || "",
                  }}
                  onChange={(key, val) => form.setValue(key as any, val as any, { shouldDirty: true })}
                  errors={{
                    name: form.formState.errors.name?.message,
                    email: form.formState.errors.email?.message,
                    locationId: form.formState.errors.locationId?.message,
                  }}
                />

                <ProfileAddressSection
                  value={{
                    officeStreet: w.officeStreet || "",
                    officeNumber: w.officeNumber || "",
                    officeTown: w.officeTown || "",
                    officePostcode: w.officePostcode || "",
                    hideAddress: w.hideAddress || false,
                  }}
                  onChange={(key, val) => form.setValue(key as any, val as any, { shouldDirty: true })}
                />

                <ProfileAboutSection
                  value={{
                    introduction: w.introduction || "",
                    description: w.description || "",
                  }}
                  onChange={(key, val) => form.setValue(key as any, val, { shouldDirty: true })}
                  websiteUrl={w.website}
                  companyName={w.name}
                />

                <ProfileServicesSection
                  value={{
                    mainCategories: w.mainCategories || [],
                    specializations: w.specializations || [],
                  }}
                  onChange={(cats, specs) => {
                    form.setValue("mainCategories", cats, { shouldDirty: true });
                    form.setValue("specializations", specs, { shouldDirty: true });
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
