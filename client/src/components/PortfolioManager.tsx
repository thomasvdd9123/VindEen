import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { supabase } from "@/lib/supabase";
import {
  Plus,
  Pencil,
  Trash2,
  Upload,
  X,
  Loader2,
  Image as ImageIcon,
  FolderOpen,
  Calendar,
  Euro,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { PortfolioProject } from "@shared/schema";

const MAX_PHOTOS = 8;
const MAX_MB = 5;

// ─── Project Form ─────────────────────────────────────────────────────────────

interface ProjectFormData {
  title: string;
  description: string;
  durationDays: string;
  priceEur: string;
  workDetails: string;
  completedAt: string;
}

const EMPTY_FORM: ProjectFormData = {
  title: "",
  description: "",
  durationDays: "",
  priceEur: "",
  workDetails: "",
  completedAt: "",
};

function projectToForm(p: PortfolioProject): ProjectFormData {
  return {
    title: p.title || "",
    description: p.description || "",
    durationDays: p.durationDays != null ? String(p.durationDays) : "",
    priceEur: p.priceEur != null ? String(p.priceEur) : "",
    workDetails: p.workDetails || "",
    completedAt: p.completedAt || "",
  };
}

function formToPayload(f: ProjectFormData) {
  return {
    title: f.title.trim(),
    description: f.description.trim() || null,
    durationDays: f.durationDays !== "" ? parseInt(f.durationDays, 10) : null,
    priceEur: f.priceEur !== "" ? parseInt(f.priceEur, 10) : null,
    workDetails: f.workDetails.trim() || null,
    completedAt: f.completedAt || null,
  };
}

// ─── Photo grid inside a project card ────────────────────────────────────────

function ProjectPhotoGrid({
  project,
  editable,
  onPhotosChange,
}: {
  project: PortfolioProject;
  editable: boolean;
  onPhotosChange?: () => void;
}) {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [photos, setPhotos] = useState<string[]>(project.imageUrls || []);
  const qc = useQueryClient();

  const syncPhotos = async (urls: string[]) => {
    await apiRequest("PATCH", `/api/portfolio/${project.id}`, { imageUrls: urls });
    qc.invalidateQueries({ queryKey: ["/api/profiles", project.profileId, "portfolio"] });
    onPhotosChange?.();
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter((f) => {
      if (!f.type.startsWith("image/")) { toast({ title: "Overgeslagen", description: `${f.name} is geen afbeelding`, variant: "destructive" }); return false; }
      if (f.size > MAX_MB * 1024 * 1024) { toast({ title: "Overgeslagen", description: `${f.name} te groot (max ${MAX_MB}MB)`, variant: "destructive" }); return false; }
      return true;
    });
    if (!files.length || photos.length >= MAX_PHOTOS) return;
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of files.slice(0, MAX_PHOTOS - photos.length)) {
        const ext = file.name.split(".").pop() || "jpg";
        const key = `portfolio/${project.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from("uploads").upload(key, file);
        if (error) throw error;
        const { data: pub } = supabase.storage.from("uploads").getPublicUrl(key);
        urls.push(pub.publicUrl);
      }
      const all = [...photos, ...urls];
      await syncPhotos(all);
      setPhotos(all);
      toast({ title: "Gelukt", description: `${urls.length} foto('s) toegevoegd` });
    } catch (err) {
      toast({ title: "Fout", description: err instanceof Error ? err.message : "Upload mislukt", variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleDelete = async (url: string) => {
    setDeleting(url);
    try {
      const urlPath = url.split("/uploads/")[1];
      if (urlPath) await supabase.storage.from("uploads").remove([urlPath]);
      const remaining = photos.filter((p) => p !== url);
      await syncPhotos(remaining);
      setPhotos(remaining);
      toast({ title: "Foto verwijderd" });
    } catch (err) {
      toast({ title: "Fout", description: "Kon foto niet verwijderen", variant: "destructive" });
    } finally {
      setDeleting(null);
    }
  };

  if (!editable && !photos.length) return null;

  return (
    <div className="mt-3">
      {photos.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-2">
          {photos.map((url, i) => (
            <div key={url} className="relative group aspect-square rounded-md overflow-hidden border border-border bg-muted" data-testid={`portfolio-photo-${project.id}-${i}`}>
              <img src={url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" crossOrigin="anonymous" />
              {editable && (
                <button
                  type="button"
                  onClick={() => handleDelete(url)}
                  disabled={!!deleting}
                  className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  data-testid={`btn-delete-portfolio-photo-${i}`}
                >
                  {deleting === url ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {editable && photos.length < MAX_PHOTOS && (
        <>
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} data-testid={`input-portfolio-photos-${project.id}`} />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground border border-dashed border-muted-foreground/40 hover:border-primary/50 rounded-md px-3 py-2 w-full justify-center transition-colors"
            data-testid={`btn-upload-portfolio-photos-${project.id}`}
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {uploading ? "Uploaden..." : photos.length === 0 ? "Foto's toevoegen" : `Meer foto's (${photos.length}/${MAX_PHOTOS})`}
          </button>
        </>
      )}
    </div>
  );
}

// ─── Project dialog (create / edit) ──────────────────────────────────────────

function ProjectDialog({
  profileId,
  project,
  open,
  onClose,
}: {
  profileId: string;
  project?: PortfolioProject;
  open: boolean;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [form, setForm] = useState<ProjectFormData>(project ? projectToForm(project) : EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm(project ? projectToForm(project) : EMPTY_FORM);
  }, [open, project]);

  const set = (k: keyof ProjectFormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSave = async () => {
    if (!form.title.trim()) { toast({ title: "Titel is verplicht", variant: "destructive" }); return; }
    setSaving(true);
    try {
      if (project) {
        await apiRequest("PATCH", `/api/portfolio/${project.id}`, formToPayload(form));
        toast({ title: "Project bijgewerkt" });
      } else {
        await apiRequest("POST", `/api/profiles/${profileId}/portfolio`, formToPayload(form));
        toast({ title: "Project aangemaakt" });
      }
      qc.invalidateQueries({ queryKey: ["/api/profiles", profileId, "portfolio"] });
      onClose();
    } catch (err) {
      toast({ title: "Fout", description: err instanceof Error ? err.message : "Opslaan mislukt", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{project ? "Project bewerken" : "Nieuw project"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label htmlFor="proj-title">Projectnaam *</Label>
            <Input id="proj-title" placeholder="bv. Tuinaanleg achtertuin Gent" value={form.title} onChange={set("title")} className="mt-1" data-testid="input-project-title" />
          </div>

          <div>
            <Label htmlFor="proj-desc">Beschrijving</Label>
            <Textarea id="proj-desc" placeholder="Wat heb je gedaan? Welke planten, materialen, stijl?" value={form.description} onChange={set("description")} className="mt-1 min-h-[90px]" data-testid="input-project-description" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="proj-price">Prijs (€)</Label>
              <Input id="proj-price" type="number" min={0} placeholder="bv. 2500" value={form.priceEur} onChange={set("priceEur")} className="mt-1" data-testid="input-project-price" />
            </div>
            <div>
              <Label htmlFor="proj-days">Duur (werkdagen)</Label>
              <Input id="proj-days" type="number" min={1} placeholder="bv. 3" value={form.durationDays} onChange={set("durationDays")} className="mt-1" data-testid="input-project-duration" />
            </div>
          </div>

          <div>
            <Label htmlFor="proj-date">Datum afgewerkt</Label>
            <Input id="proj-date" type="date" value={form.completedAt} onChange={set("completedAt")} className="mt-1" data-testid="input-project-date" />
          </div>

          <div>
            <Label htmlFor="proj-details">Extra details</Label>
            <Textarea id="proj-details" placeholder="bv. gebruikte materialen, teamgrootte, bijzonderheden..." value={form.workDetails} onChange={set("workDetails")} className="mt-1 min-h-[70px]" data-testid="input-project-details" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Annuleren</Button>
          <Button onClick={handleSave} disabled={saving} data-testid="btn-save-project">
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {project ? "Opslaan" : "Aanmaken"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Single project card (editable) ──────────────────────────────────────────

function ProjectCard({
  project,
  profileId,
  onEdit,
  onDelete,
}: {
  project: PortfolioProject;
  profileId: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasDetails = project.description || project.workDetails || project.durationDays || project.priceEur || project.completedAt;

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-white" data-testid={`portfolio-card-${project.id}`}>
      {/* Preview photo strip */}
      {project.imageUrls && project.imageUrls.length > 0 && (
        <div className="flex gap-1 h-28 overflow-hidden bg-muted">
          {project.imageUrls.slice(0, 4).map((url, i) => (
            <div key={url} className={`relative overflow-hidden flex-1 ${i === 0 && project.imageUrls.length === 1 ? "w-full" : ""}`}>
              <img src={url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" crossOrigin="anonymous" />
              {i === 3 && project.imageUrls.length > 4 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-sm font-semibold">
                  +{project.imageUrls.length - 4}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-base leading-snug">{project.title}</h3>
          <div className="flex gap-1 shrink-0">
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onEdit} data-testid={`btn-edit-project-${project.id}`}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={onDelete} data-testid={`btn-delete-project-${project.id}`}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
          {project.priceEur != null && (
            <span className="flex items-center gap-1"><Euro className="h-3 w-3" /> € {project.priceEur.toLocaleString("nl-BE")}</span>
          )}
          {project.durationDays != null && (
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {project.durationDays} {project.durationDays === 1 ? "dag" : "dagen"}</span>
          )}
          {project.completedAt && (
            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(project.completedAt).toLocaleDateString("nl-BE", { month: "long", year: "numeric" })}</span>
          )}
        </div>

        {hasDetails && (
          <button type="button" onClick={() => setExpanded((v) => !v)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-2 transition-colors">
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {expanded ? "Minder" : "Details"}
          </button>
        )}

        {expanded && (
          <div className="mt-3 space-y-2 text-sm text-muted-foreground border-t border-border pt-3">
            {project.description && <p className="leading-relaxed">{project.description}</p>}
            {project.workDetails && (
              <div>
                <p className="font-medium text-foreground text-xs mb-0.5">Extra details</p>
                <p>{project.workDetails}</p>
              </div>
            )}
          </div>
        )}

        {/* Photo management */}
        <ProjectPhotoGrid project={project} editable={true} />
      </div>
    </div>
  );
}

// ─── Main PortfolioManager ────────────────────────────────────────────────────

export function PortfolioManager({ profileId }: { profileId: string }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editProject, setEditProject] = useState<PortfolioProject | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<PortfolioProject | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { data: projects = [], isLoading } = useQuery<PortfolioProject[]>({
    queryKey: ["/api/profiles", profileId, "portfolio"],
    queryFn: async () => {
      const res = await fetch(`/api/profiles/${profileId}/portfolio`);
      if (!res.ok) throw new Error("Kon portfolio niet laden");
      return res.json();
    },
    enabled: !!profileId,
  });

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiRequest("DELETE", `/api/portfolio/${deleteTarget.id}`, undefined);
      qc.invalidateQueries({ queryKey: ["/api/profiles", profileId, "portfolio"] });
      toast({ title: "Project verwijderd" });
    } catch {
      toast({ title: "Fout bij verwijderen", variant: "destructive" });
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Toon je mooiste projecten — met foto's, prijs en uitleg.
        </p>
        <Button
          type="button"
          size="sm"
          onClick={() => { setEditProject(undefined); setDialogOpen(true); }}
          className="gap-2 shrink-0"
          data-testid="btn-add-project"
        >
          <Plus className="h-4 w-4" />
          Project toevoegen
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
          <Loader2 className="h-4 w-4 animate-spin mr-2" /> Laden…
        </div>
      ) : projects.length === 0 ? (
        <div className="border-2 border-dashed border-muted-foreground/25 rounded-xl p-8 text-center" data-testid="portfolio-empty-state">
          <FolderOpen className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm font-medium mb-1">Nog geen projecten</p>
          <p className="text-xs text-muted-foreground mb-4">Voeg je eerste project toe om potentiële klanten te inspireren.</p>
          <Button type="button" size="sm" onClick={() => { setEditProject(undefined); setDialogOpen(true); }} data-testid="btn-add-first-project">
            <Plus className="h-4 w-4 mr-2" />
            Eerste project toevoegen
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {projects.map((p) => (
            <ProjectCard
              key={p.id}
              project={p}
              profileId={profileId}
              onEdit={() => { setEditProject(p); setDialogOpen(true); }}
              onDelete={() => setDeleteTarget(p)}
            />
          ))}
        </div>
      )}

      {/* Create / edit dialog */}
      <ProjectDialog
        profileId={profileId}
        project={editProject}
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditProject(undefined); }}
      />

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Project verwijderen?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteTarget?.title}" en alle bijbehorende foto's worden permanent verwijderd.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Annuleren</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" data-testid="btn-confirm-delete-project">
              {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Verwijderen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
