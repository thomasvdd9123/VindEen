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
import { Loader2, Save, ArrowLeft, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { Category, Location } from "@shared/schema";

interface CategoryOption {
  key: string;
  name: string;
  slug: string;
  description: string | null;
}

interface GroupedCategoriesResponse {
  mainCategories: { key: string; name: string; description: string }[];
  specializations: Record<string, CategoryOption[]>;
}

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
    { key: "title", label: "Functietitel", value: formValues.title },
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

  const { data: groupedCategories } = useQuery<GroupedCategoriesResponse>({
    queryKey: ["/api/categories/grouped"],
  });
  
  const mainCategoryLabels = useMemo(() => {
    return groupedCategories?.mainCategories?.reduce((acc, cat) => {
      acc[cat.key] = cat.name;
      return acc;
    }, {} as Record<string, string>) || { TUINONDERHOUD: "Tuinonderhoud", TUINAANLEG: "Tuinaanleg" };
  }, [groupedCategories]);
  
  const specializationLabels = useMemo(() => {
    return Object.values(groupedCategories?.specializations || {}).flat().reduce((acc, spec) => {
      acc[spec.key] = spec.name;
      return acc;
    }, {} as Record<string, string>) || {};
  }, [groupedCategories]);
  
  const specializationsByCategory = useMemo(() => {
    return groupedCategories?.specializations 
      ? Object.fromEntries(
          Object.entries(groupedCategories.specializations).map(([key, specs]) => [key, specs.map(s => s.key)])
        )
      : { TUINONDERHOUD: [], TUINAANLEG: [] };
  }, [groupedCategories]);

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
      specializations: [],
      mainCategories: [],
      officeStreet: "",
      officeNumber: "",
      officeTown: "",
      officePostcode: "",
    },
  });

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
        hasWebsite: !!data.website,
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
      description="Vul de gegevens in om je bedrijfsprofiel aan te maken."
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

        <Alert className="mb-4 border-muted" data-testid="alert-profile-info">
          <Info className="h-4 w-4" />
          <AlertTitle>Nieuw profiel</AlertTitle>
          <AlertDescription>
            Na aanmaak wordt je profiel beoordeeld. Na goedkeuring wordt het zichtbaar op de website.
          </AlertDescription>
        </Alert>

        <ProfileCompletenessCard form={form} />

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Bedrijfsgegevens</CardTitle>
            <CardDescription>
              Vul je bedrijfsgegevens in.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                      <FormLabel>Functietitel</FormLabel>
                      <FormControl>
                        <Input placeholder="bv. Tuinarchitect & ontwerper" {...field} data-testid="input-title" />
                      </FormControl>
                      <FormDescription>Een korte titel die je specialisatie beschrijft</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hoofdcategorie <span className="text-destructive">*</span></FormLabel>
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
                    control={form.control}
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
                              <SelectItem key={loc.id} value={loc.id}>{loc.name} ({loc.postcode})</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Main Categories Selection */}
                <FormField
                  control={form.control}
                  name="mainCategories"
                  render={() => (
                    <FormItem>
                      <FormLabel>Type diensten</FormLabel>
                      <FormDescription>
                        Selecteer welke type diensten je aanbiedt
                      </FormDescription>
                      <div className="flex flex-wrap gap-4 mt-2">
                        {Object.entries(mainCategoryLabels).map(([key, label]) => (
                          <FormField
                            key={key}
                            control={form.control}
                            name="mainCategories"
                            render={({ field }) => (
                              <FormItem className="flex items-center space-x-2 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(key)}
                                    onCheckedChange={(checked) => {
                                      const current = field.value || [];
                                      if (checked) {
                                        field.onChange([...current, key]);
                                      } else {
                                        field.onChange(current.filter((v: string) => v !== key));
                                        const specsToRemove = specializationsByCategory[key] || [];
                                        const currentSpecs = form.getValues("specializations") || [];
                                        form.setValue(
                                          "specializations",
                                          currentSpecs.filter(s => !specsToRemove.includes(s))
                                        );
                                      }
                                    }}
                                    data-testid={`checkbox-main-category-${key.toLowerCase()}`}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal cursor-pointer">
                                  {label}
                                </FormLabel>
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                    </FormItem>
                  )}
                />

                {/* Specializations based on selected main categories */}
                {watchedMainCategories && watchedMainCategories.length > 0 && (
                  <FormField
                    control={form.control}
                    name="specializations"
                    render={() => (
                      <FormItem>
                        <FormLabel>Specialisaties</FormLabel>
                        <FormDescription>
                          Selecteer je specifieke specialisaties
                        </FormDescription>
                        <div className="space-y-4 mt-2">
                          {watchedMainCategories.map((mainCat: string) => (
                            <div key={mainCat} className="space-y-2">
                              <p className="text-sm font-medium text-muted-foreground">
                                {mainCategoryLabels[mainCat]}
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {(specializationsByCategory[mainCat] || []).map((specKey: string) => (
                                  <FormField
                                    key={specKey}
                                    control={form.control}
                                    name="specializations"
                                    render={({ field }) => (
                                      <FormItem className="flex items-center space-x-1 space-y-0">
                                        <FormControl>
                                          <Checkbox
                                            checked={field.value?.includes(specKey)}
                                            onCheckedChange={(checked) => {
                                              const current = field.value || [];
                                              if (checked) {
                                                field.onChange([...current, specKey]);
                                              } else {
                                                field.onChange(current.filter((v: string) => v !== specKey));
                                              }
                                            }}
                                            data-testid={`checkbox-spec-${specKey.toLowerCase().replace(/_/g, '-')}`}
                                          />
                                        </FormControl>
                                        <FormLabel className="font-normal text-sm cursor-pointer">
                                          {specializationLabels[specKey] || specKey}
                                        </FormLabel>
                                      </FormItem>
                                    )}
                                  />
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="introduction"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Introductie <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Schrijf een korte introductie over je bedrijf..." 
                          className="min-h-[100px]"
                          {...field} 
                          data-testid="input-introduction"
                        />
                      </FormControl>
                      <FormDescription>
                        Dit is het eerste wat bezoekers zien op je profielpagina
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
                          placeholder="Uitgebreide beschrijving van je diensten, ervaring, etc..." 
                          className="min-h-[150px]"
                          {...field} 
                          data-testid="input-description"
                        />
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
                          <Input placeholder="+32 xxx xx xx xx" {...field} data-testid="input-phone" />
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
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Office Address Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Vestigingsadres</CardTitle>
            <CardDescription>
              Voeg je bedrijfslocatie toe (optioneel)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="officeStreet"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Straat</FormLabel>
                      <FormControl>
                        <Input placeholder="Straatnaam" {...field} data-testid="input-office-street" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="officeNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Huisnummer</FormLabel>
                      <FormControl>
                        <Input placeholder="123" {...field} data-testid="input-office-number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
            </Form>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex gap-4">
          <Button 
            type="submit" 
            onClick={form.handleSubmit(onSubmit)}
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
      </div>
    </DashboardLayout>
  );
}
