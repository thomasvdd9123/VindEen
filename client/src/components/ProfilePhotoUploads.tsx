import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, X, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { apiRequest } from "@/lib/queryClient";

// ─── Logo Upload ─────────────────────────────────────────────────────────────

export function LogoUpload({
  profileId,
  currentLogoUrl,
  onUploadSuccess,
}: {
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
      const fileExt = file.name.split(".").pop();
      const fileName = `profiles/${profileId}/profile/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("uploads")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from("uploads").getPublicUrl(fileName);

      await apiRequest("PATCH", `/api/profiles/${profileId}`, { logoUrl: publicUrl });
      setPreviewUrl(publicUrl);
      toast({ title: "Gelukt", description: "Logo is geupload" });
      onUploadSuccess();
    } catch (error) {
      toast({ title: "Fout", description: error instanceof Error ? error.message : "Kon logo niet uploaden", variant: "destructive" });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
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
            {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {isUploading ? "Uploaden..." : "Logo uploaden"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Work Photos Upload ───────────────────────────────────────────────────────

export function WorkPhotosUpload({
  profileId,
  currentPhotos,
  onUploadSuccess,
}: {
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

    const validFiles = Array.from(files).filter((file) => {
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
        const fileExt = file.name.split(".").pop();
        const fileName = `profiles/${profileId}/extra/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage.from("uploads").upload(fileName, file);
        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage.from("uploads").getPublicUrl(fileName);
        uploadedUrls.push(publicUrl);
      }

      const allUrls = [...photos, ...uploadedUrls];
      await apiRequest("PATCH", `/api/profiles/${profileId}`, { imageUrls: allUrls });
      setPhotos(allUrls);
      toast({ title: "Gelukt", description: `${uploadedUrls.length} foto('s) geupload` });
      onUploadSuccess();
    } catch (error) {
      toast({ title: "Fout", description: error instanceof Error ? error.message : "Kon foto's niet uploaden", variant: "destructive" });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeletePhoto = async (url: string) => {
    setIsDeleting(url);
    try {
      const urlPath = url.split("/uploads/")[1];
      if (urlPath) await supabase.storage.from("uploads").remove([urlPath]);

      const remainingUrls = photos.filter((p) => p !== url);
      await apiRequest("PATCH", `/api/profiles/${profileId}`, { imageUrls: remainingUrls });
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
          {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {isUploading ? "Uploaden..." : "Foto's toevoegen"}
        </Button>
      </div>

      {photos.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
                {isDeleting === url ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div
          className="border-2 border-dashed border-muted-foreground/25 rounded-md p-6 text-center"
          data-testid="photos-empty-state"
        >
          <ImageIcon className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">Nog geen foto's geupload</p>
        </div>
      )}
    </div>
  );
}
