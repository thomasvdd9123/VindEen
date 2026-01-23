import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation, useParams } from "wouter";
import { z } from "zod";
import { DashboardLayout } from "./DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Save, ArrowLeft, Info, Eye, EyeOff, CheckCircle, Upload, X, Image as ImageIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { Category, Location, Profile } from "@shared/schema";
import { specializationLabels, specializationsByCategory, mainCategoryLabels } from "@shared/schema";

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
    { key: "title", label: "Functietitel", value: formValues.title },
    { key: "offeredServices", label: "Diensten", value: formValues.offeredServices?.length ? formValues.offeredServices : null },
  ];
  
  const filled = fields.filter(f => f.value && String(f.value).trim() !== "");
  const missing = fields.filter(f => !f.value || String(f.value).trim() === "").map(f => f.label);
  
  return {
    percentage: Math.round((filled.length / fields.length) * 100),
    missing,
  };
}

// Predefined services for selection
const AVAILABLE_SERVICES = [
  "Tuinaanleg",
  "Tuinonderhoud",
  "Snoeien",
  "Gazon aanleg",
  "Gazon onderhoud",
  "Vijver aanleg",
  "Haag snoeien",
  "Terras aanleg",
  "Bestrating",
  "Beplanting",
  "Boomverzorging",
  "Tuinontwerp",
  "Irrigatie systemen",
  "Verlichting",
  "Afsluitingen",
];

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
  offeredServices: z.array(z.string()).optional(),
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

// Logo Upload Component
function LogoUpload({ profileId, currentLogoUrl, onUploadSuccess }: { 
  profileId: string; 
  currentLogoUrl?: string | null;
  onUploadSuccess: () => void;
}) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentLogoUrl || null);

  useEffect(() => {
    setPreviewUrl(currentLogoUrl || null);
  }, [currentLogoUrl]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Fout", description: "Alleen afbeeldingen zijn toegestaan", variant: "destructive" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Fout", description: "Bestand is te groot (max 5MB)", variant: "destructive" });
      return;
    }

    setIsUploading(true);

    try {
      // Check if Supabase storage is available
      if (!supabase.storage) {
        console.error("Supabase storage not available - using mock client");
        throw new Error("Supabase is not configured for storage");
      }
      
      const fileExt = file.name.split('.').pop();
      const fileName = `profiles/${profileId}/profile/${Date.now()}.${fileExt}`;
      
      console.log("Uploading to Supabase Storage:", { bucket: 'uploads', path: fileName, fileSize: file.size, isSupabaseConfigured });
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(fileName, file, { upsert: true });

      console.log("Supabase Storage upload result:", { data: uploadData, error: uploadError });

      if (uploadError) {
        console.error("Supabase Storage upload error:", uploadError);
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('uploads')
        .getPublicUrl(fileName);

      console.log("Public URL generated:", publicUrl);

      await apiRequest('PATCH', `/api/profiles/${profileId}`, { logoUrl: publicUrl });
      
      setPreviewUrl(publicUrl);
      toast({ title: "Gelukt", description: "Logo is geupload" });
      onUploadSuccess();
    } catch (error) {
      console.error("Upload error caught:", error);
      toast({ title: "Fout", description: error instanceof Error ? error.message : "Kon logo niet uploaden", variant: "destructive" });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-4">
        <div 
          className="w-24 h-24 rounded-md border-2 border-dashed border-muted-foreground/25 flex items-center justify-center overflow-hidden bg-muted"
          data-testid="logo-preview"
        >
          {previewUrl ? (
            <img src={previewUrl} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" crossOrigin="anonymous" />
          ) : (
            <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
          )}
        </div>
        <div className="flex-1 space-y-2">
          <p className="text-sm text-muted-foreground">
            Upload een profielfoto of bedrijfslogo. Max 5MB, alleen afbeeldingen.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            data-testid="input-logo-file"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="gap-2"
            data-testid="button-upload-logo"
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {isUploading ? "Uploaden..." : "Logo uploaden"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Work Photos Upload Component
function WorkPhotosUpload({ profileId, currentPhotos, onUploadSuccess }: {
  profileId: string;
  currentPhotos: string[];
  onUploadSuccess: () => void;
}) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [photos, setPhotos] = useState<string[]>(currentPhotos);

  useEffect(() => {
    setPhotos(currentPhotos);
  }, [currentPhotos]);

  const handleFilesSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const validFiles = Array.from(files).filter(file => {
      if (!file.type.startsWith("image/")) {
        toast({ title: "Overgeslagen", description: `${file.name} is geen afbeelding`, variant: "destructive" });
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "Overgeslagen", description: `${file.name} is te groot (max 5MB)`, variant: "destructive" });
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setIsUploading(true);

    try {
      const uploadedUrls: string[] = [];
      
      for (const file of validFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `profiles/${profileId}/extra/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('uploads')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('uploads')
          .getPublicUrl(fileName);
          
        uploadedUrls.push(publicUrl);
      }

      const allUrls = [...photos, ...uploadedUrls];
      await apiRequest('PATCH', `/api/profiles/${profileId}`, { imageUrls: allUrls });
      
      setPhotos(allUrls);
      toast({ title: "Gelukt", description: `${uploadedUrls.length} foto('s) geupload` });
      onUploadSuccess();
    } catch (error) {
      toast({ title: "Fout", description: error instanceof Error ? error.message : "Kon foto's niet uploaden", variant: "destructive" });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDeletePhoto = async (url: string) => {
    setIsDeleting(url);
    try {
      const urlPath = url.split('/uploads/')[1];
      if (urlPath) {
        await supabase.storage.from('uploads').remove([urlPath]);
      }

      const remainingUrls = photos.filter(p => p !== url);
      await apiRequest('PATCH', `/api/profiles/${profileId}`, { imageUrls: remainingUrls });
      
      setPhotos(remainingUrls);
      toast({ title: "Gelukt", description: "Foto verwijderd" });
      onUploadSuccess();
    } catch (error) {
      toast({ title: "Fout", description: error instanceof Error ? error.message : "Kon foto niet verwijderen", variant: "destructive" });
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Upload foto's van je werk. Max 10 foto's, elk max 5MB.
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFilesSelect}
          className="hidden"
          data-testid="input-photos-file"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || photos.length >= 10}
          className="gap-2"
          data-testid="button-upload-photos"
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          {isUploading ? "Uploaden..." : "Foto's toevoegen"}
        </Button>
      </div>

      {photos.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {photos.map((url, index) => (
            <div 
              key={url} 
              className="relative group aspect-square rounded-md overflow-hidden border"
              data-testid={`photo-item-${index}`}
            >
              <img src={url} alt={`Werk foto ${index + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" crossOrigin="anonymous" />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleDeletePhoto(url)}
                disabled={isDeleting === url}
                data-testid={`button-delete-photo-${index}`}
              >
                {isDeleting === url ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <X className="h-3 w-3" />
                )}
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div 
          className="border-2 border-dashed border-muted-foreground/25 rounded-md p-8 text-center"
          data-testid="photos-empty-state"
        >
          <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">Nog geen foto's geupload</p>
        </div>
      )}
    </div>
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
      offeredServices: [],
      specializations: [],
      mainCategories: [],
      officeStreet: "",
      officeNumber: "",
      officeTown: "",
      officePostcode: "",
    },
  });

  useEffect(() => {
    if (profile) {
      // Derive main categories from specializations
      const derivedMainCategories: string[] = [];
      if (profile.specializations?.some(s => specializationsByCategory.TUINONDERHOUD.includes(s))) {
        derivedMainCategories.push("TUINONDERHOUD");
      }
      if (profile.specializations?.some(s => specializationsByCategory.TUINAANLEG.includes(s))) {
        derivedMainCategories.push("TUINAANLEG");
      }
      
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
        offeredServices: profile.offeredServices || [],
        specializations: profile.specializations || [],
        mainCategories: derivedMainCategories,
        officeStreet: (profile as any).office?.street || "",
        officeNumber: (profile as any).office?.number || "",
        officeTown: (profile as any).office?.town || "",
        officePostcode: (profile as any).office?.postcode || "",
      });
    }
  }, [profile, form]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      return apiRequest("PUT", `/api/profiles/${id}`, {
        ...data,
        hasWebsite: !!data.website,
        isActive: data.isActive,
        hideAddress: data.hideAddress,
        offeredServices: data.offeredServices,
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
                            const description = key === "TUINONDERHOUD" 
                              ? "Onderhoud van bestaande tuinen: maaien, snoeien, hagen knippen, etc."
                              : "Aanleg van nieuwe tuinen: terrassen, paden, vijvers, gazon, etc.";
                            
                            return (
                              <div 
                                key={key} 
                                className={`relative rounded-lg border-2 p-4 cursor-pointer transition-colors ${
                                  isSelected 
                                    ? "border-primary bg-primary/5" 
                                    : "border-muted hover:border-muted-foreground/50"
                                }`}
                                onClick={() => {
                                  const current = field.value || [];
                                  if (isSelected) {
                                    field.onChange(current.filter((c) => c !== key));
                                    // Also remove specializations from this category
                                    const specs = form.getValues("specializations") || [];
                                    const categorySpecs = specializationsByCategory[key] || [];
                                    form.setValue("specializations", specs.filter(s => !categorySpecs.includes(s)));
                                  } else {
                                    field.onChange([...current, key]);
                                  }
                                }}
                                data-testid={`card-main-cat-${key.toLowerCase()}`}
                              >
                                <div className="flex items-start gap-3">
                                  <Checkbox
                                    id={`main-cat-${key}`}
                                    checked={isSelected}
                                    className="mt-1"
                                    data-testid={`checkbox-main-cat-${key.toLowerCase()}`}
                                  />
                                  <div className="flex-1">
                                    <label htmlFor={`main-cat-${key}`} className="text-base font-medium cursor-pointer">
                                      {label}
                                    </label>
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {description}
                                    </p>
                                  </div>
                                </div>
                              </div>
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
                    const selectedMainCategories = form.watch("mainCategories") || [];
                    
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
                              Selecteer eerst "Tuinonderhoud" en/of "Tuinaanleg" om je specialisaties te kiezen
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

                {/* ============================================ */}
                {/* SECTION 6: EXTRA DIENSTEN */}
                {/* ============================================ */}
                <div className="space-y-6">
                  <div className="border-b pb-2">
                    <h3 className="text-lg font-semibold">Extra diensten</h3>
                    <p className="text-sm text-muted-foreground">
                      Aanvullende diensten die je aanbiedt
                    </p>
                  </div>

                  <FormField
                    control={form.control}
                    name="offeredServices"
                    render={({ field }) => (
                      <FormItem>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {AVAILABLE_SERVICES.map((service) => (
                            <div key={service} className="flex items-center space-x-2">
                              <Checkbox
                                id={`service-${service}`}
                                checked={field.value?.includes(service) || false}
                                onCheckedChange={(checked) => {
                                  const current = field.value || [];
                                  if (checked) {
                                    field.onChange([...current, service]);
                                  } else {
                                    field.onChange(current.filter((s) => s !== service));
                                  }
                                }}
                                data-testid={`checkbox-service-${service.toLowerCase().replace(/\s/g, '-')}`}
                              />
                              <label
                                htmlFor={`service-${service}`}
                                className="text-sm cursor-pointer"
                              >
                                {service}
                              </label>
                            </div>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
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

        {/* Work Photos Upload */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Werk foto's</CardTitle>
            <CardDescription>
              Toon je beste werk aan potentiele klanten
            </CardDescription>
          </CardHeader>
          <CardContent>
            <WorkPhotosUpload 
              profileId={id!} 
              currentPhotos={profile?.imageUrls || []}
              onUploadSuccess={() => {
                queryClient.refetchQueries({ queryKey: ["/api/profiles/id", id] });
              }}
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
