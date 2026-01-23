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
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  User, 
  Building2, 
  FileText, 
  Briefcase, 
  ArrowRight, 
  ArrowLeft, 
  Check,
  Loader2
} from "lucide-react";
import type { Category, Location } from "@shared/schema";

const BELGIAN_PROVINCES = [
  "Antwerpen",
  "Brussel",
  "Henegouwen",
  "Limburg",
  "Luik",
  "Luxemburg",
  "Namen",
  "Oost-Vlaanderen",
  "Vlaams-Brabant",
  "Waals-Brabant",
  "West-Vlaanderen",
];

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
});

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
];

function OnboardingContent() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, updateUserMetadata, getUserMetadata } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      await createProfileMutation.mutateAsync(data);
      toast({
        title: "Welkom!",
        description: "Je account en profiel zijn succesvol aangemaakt.",
      });
      setLocation("/dashboard");
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
                            <Input placeholder="bv. Tuinarchitect, Tuinonderhoud specialist" {...field} data-testid="input-title" />
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
                              <Input placeholder="+32 xxx xx xx xx" {...field} data-testid="input-phone" />
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
                              <Input placeholder="https://www.jouwsite.be" {...field} data-testid="input-website" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

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
                        <Button type="submit" disabled={isSubmitting} className="gap-2" data-testid="button-finish">
                          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                          Profiel aanmaken
                        </Button>
                      </div>
                    </div>
                  </form>
                </Form>
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
