import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { z } from "zod";
import { DashboardLayout } from "./DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Save, ArrowLeft, Info, Eye, EyeOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import type { Category } from "@shared/schema";
import { PracticalQuestionsForm } from "@/components/PracticalQuestionsForm";
import { LogoUpload } from "@/components/ProfilePhotoUploads";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Camera } from "lucide-react";
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

export default function ProfileCreate() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

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

  const w = form.watch();

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
