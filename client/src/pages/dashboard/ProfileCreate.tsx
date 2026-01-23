import { useEffect } from "react";
import { useForm } from "react-hook-form";
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
import { Loader2, Save, ArrowLeft } from "lucide-react";
import type { Category, Location } from "@shared/schema";

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
});

type ProfileFormData = z.infer<typeof profileSchema>;

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
    },
  });

  useEffect(() => {
    if (user?.email) {
      form.setValue("email", user.email);
    }
  }, [user?.email, form]);

  const createProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      if (!user?.id) throw new Error("Je bent niet ingelogd");
      
      // Get or create account
      const account = await apiRequest("POST", "/api/accounts", {
        authUserId: user.id,
        email: user.email,
      }) as { id: string };
      
      return apiRequest("POST", "/api/profiles", {
        ...data,
        accountId: account.id,
        hasWebsite: !!data.website,
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

        <Card>
          <CardHeader>
            <CardTitle>Bedrijfsgegevens</CardTitle>
            <CardDescription>
              Vul je bedrijfsgegevens in. Je profiel wordt na aanmaak gecontroleerd voordat het zichtbaar wordt.
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
      </div>
    </DashboardLayout>
  );
}
