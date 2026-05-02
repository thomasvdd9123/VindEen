import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAuth, RequireAuth } from "@/lib/auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient, authFetch } from "@/lib/queryClient";
import { isValidBelgianVAT, formatBelgianVAT } from "@/lib/utils";
import { 
  User, 
  Building2, 
  FileText, 
  Briefcase, 
  ArrowRight, 
  ArrowLeft, 
  Check,
  Loader2,
  CreditCard,
  BadgePercent,
  Clock,
  Shield,
  Camera,
  Upload,
  X,
  ImageIcon
} from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import type { Category, Location } from "@shared/schema";
import { formatPrice, siteConfig } from "@/lib/theme.config";
import { useSubscriptionOffers } from "@/lib/useSubscriptionOffers";
import { usePracticalQuestions } from "@/lib/usePracticalQuestions";
import { PracticalQuestionsForm } from "@/components/PracticalQuestionsForm";
import { Checkbox } from "@/components/ui/checkbox";

const personalSchema = z.object({
  firstName: z.string().min(2, "Voornaam is verplicht"),
  lastName: z.string().min(2, "Achternaam is verplicht"),
});

const businessSchema = z.object({
  invoiceName: z.string().min(2, "Bedrijfsnaam is verplicht"),
  street: z.string().min(2, "Straat en huisnummer is verplicht"),
  postcode: z.string().min(4, "Postcode is verplicht"),
  municipality: z.string().min(2, "Gemeente is verplicht"),
  btwPlichtig: z.string(),
  btwNumber: z.string().optional(),
  kvkNumber: z.string().optional(),
}).refine(
  (data) => {
    if (data.btwPlichtig === "ja" && data.btwNumber) {
      return isValidBelgianVAT(data.btwNumber);
    }
    return true;
  },
  {
    message: "Ongeldig BTW-nummer. Gebruik formaat BE0123456789 (BE + 10 cijfers)",
    path: ["btwNumber"],
  }
);

const profileSchema = z.object({
  name: z.string().min(2, "Bedrijfsnaam is verplicht"),
  title: z.string().optional(),
  introduction: z.string().min(10, "Introductie moet minimaal 10 karakters bevatten"),
  categoryId: z.string().min(1, "Selecteer een categorie"),
  locationId: z.string().min(1, "Selecteer een locatie"),
  telnr: z.string().optional(),
  website: z.string().optional(),
});

type PersonalFormData = z.infer<typeof personalSchema>;
type BusinessFormData = z.infer<typeof businessSchema>;
type ProfileFormData = z.infer<typeof profileSchema>;

const steps = [
  { id: 1, title: "Persoonlijk", icon: User },
  { id: 2, title: "Bedrijf", icon: Building2 },
  { id: 3, title: "Profiel", icon: Briefcase },
  { id: 4, title: "Foto's", icon: Camera },
  { id: 5, title: "Betaling", icon: CreditCard },
];

function OnboardingContent() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, updateUserMetadata, getUserMetadata } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { plans: pricingPlans, defaultPlanId } = useSubscriptionOffers();
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  useEffect(() => {
    if (!selectedPlan && defaultPlanId) setSelectedPlan(defaultPlanId);
  }, [defaultPlanId, selectedPlan]);
  const baseYearlyPrice = pricingPlans.find((p) => p.years === 1)?.pricePerYear
    ?? (pricingPlans[0]?.pricePerYear ?? 0);
  const [createdProfileId, setCreatedProfileId] = useState<string | null>(null);
  const [createdAccountId, setCreatedAccountId] = useState<string | null>(null);
  const [practicalAnswers, setPracticalAnswers] = useState<Record<string, any>>({});
  const { questions: practicalQuestions } = usePracticalQuestions();
  
  // Photo upload state
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [extraFiles, setExtraFiles] = useState<File[]>([]);
  const [extraPreviews, setExtraPreviews] = useState<string[]>([]);
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);

  const metadata = getUserMetadata();

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: locations = [] } = useQuery<Location[]>({
    queryKey: ["/api/locations"],
  });

  const personalForm = useForm<PersonalFormData>({
    resolver: zodResolver(personalSchema),
    defaultValues: {
      firstName: metadata.firstName || "",
      lastName: metadata.lastName || "",
    },
  });

  const businessForm = useForm<BusinessFormData>({
    resolver: zodResolver(businessSchema),
    defaultValues: {
      invoiceName: metadata.invoiceName || "",
      street: metadata.street || "",
      postcode: metadata.postcode || "",
      municipality: metadata.municipality || "",
      btwPlichtig: metadata.btwPlichtig || "nee",
      btwNumber: metadata.btwNumber || "",
      kvkNumber: metadata.kvkNumber || "",
    },
  });

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: metadata.invoiceName || "",
      title: "",
      introduction: "",
      categoryId: "",
      locationId: "",
      telnr: "",
      website: "",
    },
  });

  useEffect(() => {
    if (metadata.firstName) personalForm.setValue("firstName", metadata.firstName);
    if (metadata.lastName) personalForm.setValue("lastName", metadata.lastName);
    if (metadata.invoiceName) {
      businessForm.setValue("invoiceName", metadata.invoiceName);
      profileForm.setValue("name", metadata.invoiceName);
    }
    if (metadata.street) businessForm.setValue("street", metadata.street);
    if (metadata.postcode) businessForm.setValue("postcode", metadata.postcode);
    if (metadata.municipality) businessForm.setValue("municipality", metadata.municipality);
  }, [metadata, personalForm, businessForm, profileForm]);

  const createProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      if (!user?.id) throw new Error("Je bent niet ingelogd");
      
      const account = await apiRequest("POST", "/api/accounts", {
        authUserId: user.id,
        email: user.email,
      }) as { id: string };
      
      return apiRequest("POST", "/api/profiles", {
        ...data,
        accountId: account.id,
        email: user.email,
        hasWebsite: !!data.website,
        practical: practicalAnswers,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-profiles"] });
    },
  });

  const handlePersonalSubmit = async (data: PersonalFormData) => {
    setIsSubmitting(true);
    try {
      const { error } = await updateUserMetadata(data);
      if (error) {
        toast({ title: "Fout", description: error.message, variant: "destructive" });
        return;
      }
      setCurrentStep(2);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBusinessSubmit = async (data: BusinessFormData) => {
    setIsSubmitting(true);
    try {
      const { error } = await updateUserMetadata({
        ...data,
        country: "België",
        btwNumber: data.btwPlichtig === "ja" && data.btwNumber ? formatBelgianVAT(data.btwNumber) : "",
      });
      if (error) {
        toast({ title: "Fout", description: error.message, variant: "destructive" });
        return;
      }
      profileForm.setValue("name", data.invoiceName);
      setCurrentStep(3);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProfileSubmit = async (data: ProfileFormData) => {
    setIsSubmitting(true);
    try {
      const result = await createProfileMutation.mutateAsync(data) as { id: string; accountId: string };
      setCreatedProfileId(result.id);
      setCreatedAccountId(result.accountId);
      setCurrentStep(4); // Go to photos step
    } catch (error: any) {
      toast({ 
        title: "Fout", 
        description: error.message || "Kon profiel niet aanmaken", 
        variant: "destructive" 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle logo file selection
  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // Handle extra images selection
  const handleExtraImagesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const maxFiles = 5 - extraFiles.length;
    const newFiles = files.slice(0, maxFiles);
    
    setExtraFiles(prev => [...prev, ...newFiles]);
    
    newFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setExtraPreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  // Remove extra image
  const removeExtraImage = (index: number) => {
    setExtraFiles(prev => prev.filter((_, i) => i !== index));
    setExtraPreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Handle photos upload and proceed to payment
  const handlePhotosSubmit = async () => {
    if (!createdProfileId) {
      toast({ title: "Fout", description: "Profiel niet gevonden", variant: "destructive" });
      return;
    }

    setIsUploadingPhotos(true);
    try {
      // Upload logo if selected
      if (logoFile) {
        const logoFormData = new FormData();
        logoFormData.append("file", logoFile);
        logoFormData.append("type", "profile");
        await authFetch(`/api/profiles/${createdProfileId}/upload`, {
          method: "POST",
          body: logoFormData,
        });
      }

      // Upload extra images if any
      for (const file of extraFiles) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", "extra");
        await authFetch(`/api/profiles/${createdProfileId}/upload`, {
          method: "POST",
          body: formData,
        });
      }

      queryClient.invalidateQueries({ queryKey: ["/api/my-profiles"] });
      
      toast({
        title: "Foto's geüpload!",
        description: "Je foto's zijn succesvol opgeslagen.",
      });

      setCurrentStep(5); // Go to payment step
    } catch (error: any) {
      toast({
        title: "Upload mislukt",
        description: error.message || "Kon foto's niet uploaden",
        variant: "destructive",
      });
    } finally {
      setIsUploadingPhotos(false);
    }
  };

  // Skip photos and go directly to payment
  const handleSkipPhotos = () => {
    setCurrentStep(5);
  };

  const handlePaymentSubmit = async () => {
    setIsSubmitting(true);
    try {
      const plan = pricingPlans.find(p => p.id === selectedPlan);
      if (!plan || !createdAccountId || !createdProfileId) {
        throw new Error("Geen abonnement geselecteerd of profiel niet gevonden");
      }

      // Create Mollie payment
      const response = await authFetch("/api/mollie/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: createdAccountId,
          profileId: createdProfileId,
          planId: selectedPlan,
          offerId: plan.offerId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Payment failed");
      }

      const data = await response.json();

      if (data.paymentUrl) {
        toast({
          title: "Doorsturen naar betaling...",
          description: "Je wordt doorgestuurd naar Mollie.",
        });
        window.location.href = data.paymentUrl;
      } else {
        throw new Error("Geen betaal-URL ontvangen");
      }
    } catch (error: any) {
      toast({ 
        title: "Fout", 
        description: error.message || "Kon betaling niet starten", 
        variant: "destructive" 
      });
      setIsSubmitting(false);
    }
  };

  const handleSkipProfile = async () => {
    toast({
      title: "Welkom!",
      description: "Je account is aangemaakt. Je kunt later een profiel toevoegen.",
    });
    setLocation("/dashboard");
  };

  const progress = (currentStep / steps.length) * 100;

  return (
    <Layout>
      <div className="min-h-[calc(100vh-200px)] py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-center mb-2">Welkom bij het platform</h1>
            <p className="text-muted-foreground text-center mb-6">
              Laten we je account instellen in een paar eenvoudige stappen.
            </p>
            
            <div className="flex items-center justify-center gap-4 mb-4">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div 
                    className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                      currentStep >= step.id 
                        ? "bg-primary border-primary text-primary-foreground" 
                        : "border-muted-foreground/30 text-muted-foreground"
                    }`}
                  >
                    {currentStep > step.id ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <step.icon className="h-5 w-5" />
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div 
                      className={`w-12 h-0.5 mx-2 transition-colors ${
                        currentStep > step.id ? "bg-primary" : "bg-muted-foreground/30"
                      }`} 
                    />
                  )}
                </div>
              ))}
            </div>

            <Progress value={progress} className="h-2" />
          </div>

          {currentStep === 1 && (
            <Card data-testid="card-step-personal">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Persoonlijke gegevens
                </CardTitle>
                <CardDescription>
                  Vertel ons wie je bent zodat we je profiel kunnen personaliseren.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...personalForm}>
                  <form onSubmit={personalForm.handleSubmit(handlePersonalSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={personalForm.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Voornaam <span className="text-destructive">*</span></FormLabel>
                            <FormControl>
                              <Input placeholder="Je voornaam" {...field} data-testid="input-firstname" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={personalForm.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Achternaam <span className="text-destructive">*</span></FormLabel>
                            <FormControl>
                              <Input placeholder="Je achternaam" {...field} data-testid="input-lastname" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="pt-4 flex justify-end">
                      <Button type="submit" disabled={isSubmitting} className="gap-2" data-testid="button-next">
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        Volgende
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}

          {currentStep === 2 && (
            <Card data-testid="card-step-business">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Bedrijfsgegevens
                </CardTitle>
                <CardDescription>
                  Deze gegevens gebruiken we voor facturatie en je bedrijfsprofiel.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...businessForm}>
                  <form onSubmit={businessForm.handleSubmit(handleBusinessSubmit)} className="space-y-4">
                    <FormField
                      control={businessForm.control}
                      name="invoiceName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bedrijfsnaam <span className="text-destructive">*</span></FormLabel>
                          <FormControl>
                            <Input placeholder="Officiële bedrijfsnaam" {...field} data-testid="input-company" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={businessForm.control}
                      name="street"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Straat en huisnummer <span className="text-destructive">*</span></FormLabel>
                          <FormControl>
                            <Input placeholder="Hoofdstraat 123" {...field} data-testid="input-street" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={businessForm.control}
                        name="postcode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Postcode <span className="text-destructive">*</span></FormLabel>
                            <FormControl>
                              <Input placeholder="9000" {...field} data-testid="input-postcode" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={businessForm.control}
                        name="municipality"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Gemeente <span className="text-destructive">*</span></FormLabel>
                            <FormControl>
                              <Input placeholder="Gent" {...field} data-testid="input-municipality" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={businessForm.control}
                      name="btwPlichtig"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>BTW-plichtig?</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-btw">
                                <SelectValue placeholder="Selecteer" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="ja">Ja</SelectItem>
                              <SelectItem value="nee">Nee</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {businessForm.watch("btwPlichtig") === "ja" && (
                      <FormField
                        control={businessForm.control}
                        name="btwNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>BTW-nummer</FormLabel>
                            <FormControl>
                              <Input placeholder="BE0123456789" {...field} data-testid="input-btw" />
                            </FormControl>
                            <FormDescription>Belgisch BTW-nummer (BE gevolgd door 10 cijfers)</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <FormField
                      control={businessForm.control}
                      name="kvkNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ondernemingsnummer (KBO)</FormLabel>
                          <FormControl>
                            <Input placeholder="0123.456.789" {...field} data-testid="input-kbo" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="pt-4 flex justify-between">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setCurrentStep(1)}
                        className="gap-2"
                        data-testid="button-back"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        Terug
                      </Button>
                      <Button type="submit" disabled={isSubmitting} className="gap-2" data-testid="button-next">
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        Volgende
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}

          {currentStep === 3 && (
            <Card data-testid="card-step-profile">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Maak je eerste profiel
                </CardTitle>
                <CardDescription>
                  Maak je eerste bedrijfsprofiel aan zodat klanten je kunnen vinden.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)} className="space-y-4">
                    <FormField
                      control={profileForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Profielnaam <span className="text-destructive">*</span></FormLabel>
                          <FormControl>
                            <Input placeholder="Naam zoals weergegeven aan klanten" {...field} data-testid="input-profile-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={profileForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Specialisatie</FormLabel>
                          <FormControl>
                            <Input placeholder={siteConfig.placeholders.profileTitle} {...field} data-testid="input-title" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={profileForm.control}
                        name="categoryId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Categorie <span className="text-destructive">*</span></FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-category">
                                  <SelectValue placeholder="Selecteer categorie" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {categories.map((cat) => (
                                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={profileForm.control}
                        name="locationId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Locatie <span className="text-destructive">*</span></FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-location">
                                  <SelectValue placeholder="Selecteer locatie" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {locations.map((loc) => (
                                  <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={profileForm.control}
                      name="introduction"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Introductie <span className="text-destructive">*</span></FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Beschrijf kort je diensten en wat je uniek maakt..." 
                              className="min-h-[100px]"
                              {...field} 
                              data-testid="input-introduction"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={profileForm.control}
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
                      <FormField
                        control={profileForm.control}
                        name="website"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Website</FormLabel>
                            <FormControl>
                              <Input placeholder={siteConfig.placeholders.website} {...field} data-testid="input-website" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {practicalQuestions.length > 0 && (
                      <div className="pt-4 border-t">
                        <PracticalQuestionsForm
                          values={practicalAnswers}
                          onChange={setPracticalAnswers}
                          heading="Praktische info (optioneel)"
                        />
                      </div>
                    )}

                    <div className="pt-4 flex justify-between">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setCurrentStep(2)}
                        className="gap-2"
                        data-testid="button-back"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        Terug
                      </Button>
                      <div className="flex gap-2">
                        <Button 
                          type="button" 
                          variant="ghost"
                          onClick={handleSkipProfile}
                          data-testid="button-skip"
                        >
                          Later doen
                        </Button>
                        <Button type="submit" disabled={isSubmitting} className="gap-2" data-testid="button-next-payment">
                          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                          Volgende
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}

          {currentStep === 4 && (
            <Card data-testid="card-step-photos">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Voeg foto's toe
                </CardTitle>
                <CardDescription>
                  Upload je logo en extra foto's om je profiel aantrekkelijker te maken voor klanten.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Logo upload */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Bedrijfslogo</Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Upload je logo. Dit wordt weergegeven op je profiel en in zoekresultaten.
                  </p>
                  <div className="flex items-start gap-4">
                    <div className="w-24 h-24 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted/50 overflow-hidden">
                      {logoPreview ? (
                        <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoSelect}
                        className="hidden"
                        id="logo-upload"
                        data-testid="input-logo"
                      />
                      <Label htmlFor="logo-upload" className="cursor-pointer">
                        <Button type="button" variant="outline" size="sm" className="gap-2" asChild>
                          <span>
                            <Upload className="h-4 w-4" />
                            {logoFile ? "Wijzig logo" : "Upload logo"}
                          </span>
                        </Button>
                      </Label>
                      {logoFile && (
                        <p className="text-xs text-muted-foreground mt-2">{logoFile.name}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Extra images upload */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Extra foto's (optioneel)</Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Voeg foto's toe van je werk, team of materiaal. Max 5 foto's.
                  </p>
                  
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                    {extraPreviews.map((preview, index) => (
                      <div key={index} className="relative aspect-square rounded-lg overflow-hidden border group">
                        <img src={preview} alt={`Extra ${index + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeExtraImage(index)}
                          className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          data-testid={`button-remove-image-${index}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    
                    {extraFiles.length < 5 && (
                      <label className="aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors bg-muted/50">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleExtraImagesSelect}
                          className="hidden"
                          data-testid="input-extra-images"
                        />
                        <Upload className="h-5 w-5 text-muted-foreground mb-1" />
                        <span className="text-xs text-muted-foreground">Toevoegen</span>
                      </label>
                    )}
                  </div>
                </div>

                <div className="pt-4 flex justify-between">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setCurrentStep(3)}
                    className="gap-2"
                    data-testid="button-back"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Terug
                  </Button>
                  <div className="flex gap-2">
                    <Button 
                      type="button" 
                      variant="ghost"
                      onClick={handleSkipPhotos}
                      data-testid="button-skip-photos"
                    >
                      Overslaan
                    </Button>
                    <Button 
                      onClick={handlePhotosSubmit}
                      disabled={isUploadingPhotos}
                      className="gap-2"
                      data-testid="button-next-payment"
                    >
                      {isUploadingPhotos ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ArrowRight className="h-4 w-4" />
                      )}
                      {logoFile || extraFiles.length > 0 ? "Uploaden & doorgaan" : "Volgende"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 5 && (
            <Card data-testid="card-step-payment">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Kies je abonnement
                </CardTitle>
                <CardDescription>
                  Selecteer de duur van je abonnement. Hoe langer je kiest, hoe meer je bespaart.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <RadioGroup 
                  value={selectedPlan} 
                  onValueChange={setSelectedPlan}
                  className="space-y-3"
                >
                  {pricingPlans.map((plan) => (
                    <div key={plan.id} className="relative">
                      <Label
                        htmlFor={plan.id}
                        className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedPlan === plan.id 
                            ? "border-primary bg-primary/5" 
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <RadioGroupItem value={plan.id} id={plan.id} data-testid={`radio-plan-${plan.id}`} />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{plan.label}</span>
                              {plan.popular && (
                                <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                                  Populair
                                </span>
                              )}
                              {plan.discount > 0 && (
                                <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                                  <BadgePercent className="h-3 w-3" />
                                  {plan.discount}% korting
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {formatPrice(plan.pricePerYear, { withCents: true })}/jaar
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-lg">{formatPrice(plan.totalPrice, { withCents: true })}</div>
                          {plan.discount > 0 && baseYearlyPrice > 0 && (
                            <div className="text-xs text-muted-foreground line-through">
                              {formatPrice(baseYearlyPrice * plan.years, { withCents: true })}
                            </div>
                          )}
                        </div>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>

                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    Inbegrepen in elk abonnement
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li className="flex items-center gap-2">
                      <Check className="h-3 w-3 text-primary" />
                      Profiel zichtbaar in zoekresultaten
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-3 w-3 text-primary" />
                      Onbeperkt contactaanvragen ontvangen
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-3 w-3 text-primary" />
                      Dashboard met statistieken
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-3 w-3 text-primary" />
                      Klantenservice via email
                    </li>
                  </ul>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Je abonnement wordt actief na betaling</span>
                </div>

                <div className="pt-4 flex justify-between">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setCurrentStep(4)}
                    className="gap-2"
                    data-testid="button-back"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Terug
                  </Button>
                  <Button 
                    onClick={handlePaymentSubmit} 
                    disabled={isSubmitting || !selectedPlan || pricingPlans.length === 0} 
                    className="gap-2" 
                    data-testid="button-pay"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CreditCard className="h-4 w-4" />
                    )}
                    Betalen - {(() => {
                      const tot = pricingPlans.find((p) => p.id === selectedPlan)?.totalPrice;
                      return tot != null ? formatPrice(tot, { withCents: true }) : "";
                    })()}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default function Onboarding() {
  return (
    <RequireAuth>
      <OnboardingContent />
    </RequireAuth>
  );
}
