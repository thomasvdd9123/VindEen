import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isValidBelgianVAT, formatBelgianVAT } from "@/lib/utils";
import { siteConfig } from "@/lib/theme.config";
import type { Account } from "@shared/schema";
import {
  CheckCircle2, ChevronRight, ChevronLeft, X, Leaf,
  Loader2, Eye, Rocket, Clock, Building2, User2, FileText, Tags,
} from "lucide-react";
import { ProfileContactSection } from "@/components/profile/ProfileContactSection";
import { ProfileAddressSection } from "@/components/profile/ProfileAddressSection";
import { ProfileAboutSection } from "@/components/profile/ProfileAboutSection";
import { ProfileServicesSection } from "@/components/profile/ProfileServicesSection";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PersonalData { firstName: string; lastName: string; }
interface BillingData { companyName: string; vatNumber: string; btwPlichtig: string; street: string; houseNumber: string; municipality: string; postcode: string; }
interface ProfileData { name: string; email: string; telnr: string; website: string; locationId: string; officeStreet: string; officeNumber: string; officeTown: string; officePostcode: string; hideAddress: boolean; }
interface AboutData { introduction: string; description: string; }
interface ServicesData { mainCategories: string[]; specializations: string[]; }

const TOTAL_STEPS = 6;

// ─── Field helpers ────────────────────────────────────────────────────────────

function Field({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-base font-medium">
        {label}{required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
      {children}
    </div>
  );
}

// ─── Step components ──────────────────────────────────────────────────────────

function StepWelcome({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-8 gap-6">
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
        <Leaf className="h-10 w-10 text-primary" />
      </div>
      <div>
        <h2 className="text-2xl font-bold mb-2">Welkom bij {siteConfig.name}!</h2>
        <p className="text-muted-foreground text-lg max-w-md mx-auto">
          We helpen u stap voor stap uw profiel aanmaken. Dit duurt ongeveer 5 minuten.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-lg text-left">
        {[
          { icon: User2, title: "Uw gegevens", desc: "Persoonlijke & factuurgegevens" },
          { icon: Building2, title: "Uw profiel", desc: "Contactinfo & beschrijving" },
          { icon: Tags, title: "Uw diensten", desc: "Categorieën & specialisaties" },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="flex items-start gap-3 bg-muted/40 rounded-lg p-3">
            <Icon className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-sm">{title}</p>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
          </div>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">
        U kunt de wizard altijd sluiten — uw voortgang wordt tussentijds opgeslagen.
      </p>
      <Button size="lg" onClick={onNext} className="gap-2 text-base px-8" data-testid="btn-onboarding-start">
        Aan de slag!
        <ChevronRight className="h-5 w-5" />
      </Button>
    </div>
  );
}

function StepPersonalBilling({
  personal, setPersonal, billing, setBilling,
}: {
  personal: PersonalData; setPersonal: (d: PersonalData) => void;
  billing: BillingData; setBilling: (d: BillingData) => void;
}) {
  return (
    <div className="space-y-8">
      {/* Personal */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b pb-2">
          <User2 className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Uw persoonlijke gegevens</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Voornaam" required>
            <Input
              placeholder="Jan"
              value={personal.firstName}
              onChange={e => setPersonal({ ...personal, firstName: e.target.value })}
              className="text-base h-11"
              data-testid="input-onboarding-firstname"
            />
          </Field>
          <Field label="Achternaam" required>
            <Input
              placeholder="Janssen"
              value={personal.lastName}
              onChange={e => setPersonal({ ...personal, lastName: e.target.value })}
              className="text-base h-11"
              data-testid="input-onboarding-lastname"
            />
          </Field>
        </div>
      </div>

      {/* Billing */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b pb-2">
          <FileText className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Factuurgegevens</h3>
        </div>
        <p className="text-sm text-muted-foreground">Deze gegevens worden gebruikt op uw facturen. U kunt ze later altijd aanpassen.</p>

        <Field label="Bedrijfs- of factuurnaam" required hint="De naam die op uw facturen verschijnt">
          <Input
            placeholder="Bv. Tuinbedrijf Janssen BV"
            value={billing.companyName}
            onChange={e => setBilling({ ...billing, companyName: e.target.value })}
            className="text-base h-11"
            data-testid="input-onboarding-companyname"
          />
        </Field>

        <Field label="BTW-plichtig?">
          <div className="flex gap-4 mt-1">
            {["yes", "no"].map(v => (
              <label key={v} className="flex items-center gap-2 cursor-pointer text-base">
                <input
                  type="radio"
                  name="btwPlichtig"
                  value={v}
                  checked={billing.btwPlichtig === v}
                  onChange={() => setBilling({ ...billing, btwPlichtig: v })}
                  className="h-4 w-4"
                />
                {v === "yes" ? "Ja" : "Nee / particulier"}
              </label>
            ))}
          </div>
        </Field>

        {billing.btwPlichtig === "yes" && (
          <Field label="BTW-nummer" hint="Formaat: BE0123456789">
            <Input
              placeholder="BE0123456789"
              value={billing.vatNumber}
              onChange={e => setBilling({ ...billing, vatNumber: e.target.value })}
              className="text-base h-11"
              data-testid="input-onboarding-vat"
            />
          </Field>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <Field label="Straat" required>
              <Input
                placeholder="Kerkstraat"
                value={billing.street}
                onChange={e => setBilling({ ...billing, street: e.target.value })}
                className="text-base h-11"
                data-testid="input-onboarding-street"
              />
            </Field>
          </div>
          <Field label="Huisnr." required>
            <Input
              placeholder="12A"
              value={billing.houseNumber}
              onChange={e => setBilling({ ...billing, houseNumber: e.target.value })}
              className="text-base h-11"
              data-testid="input-onboarding-housenumber"
            />
          </Field>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Postcode" required>
            <Input
              placeholder="3000"
              value={billing.postcode}
              onChange={e => setBilling({ ...billing, postcode: e.target.value })}
              className="text-base h-11"
              data-testid="input-onboarding-postcode"
            />
          </Field>
          <Field label="Gemeente" required>
            <Input
              placeholder="Leuven"
              value={billing.municipality}
              onChange={e => setBilling({ ...billing, municipality: e.target.value })}
              className="text-base h-11"
              data-testid="input-onboarding-municipality"
            />
          </Field>
        </div>
      </div>
    </div>
  );
}


function StepDone({
  profileSlug, profileId, onActivate, onLater,
}: {
  profileSlug: string; profileId: string; onActivate: () => void; onLater: () => void;
}) {
  return (
    <div className="flex flex-col items-center text-center gap-6 py-4">
      <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
        <CheckCircle2 className="h-10 w-10 text-emerald-600" />
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-2">Uw profiel is aangemaakt!</h2>
        <p className="text-muted-foreground text-lg max-w-md mx-auto">
          Alle gegevens zijn opgeslagen. Uw profiel wordt beoordeeld door ons team.
        </p>
      </div>

      {/* Preview link */}
      <a
        href={`/bedrijf/${profileSlug}?preview=${profileId}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 text-primary hover:underline font-medium text-base"
        data-testid="btn-onboarding-preview"
      >
        <Eye className="h-5 w-5" />
        Uw profiel bekijken (preview)
      </a>

      <div className="w-full max-w-md space-y-3">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-left">
          <div className="flex items-start gap-3">
            <Rocket className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-emerald-800 mb-1">Maak uw profiel zichtbaar</p>
              <p className="text-sm text-emerald-700">
                Activeer een lidmaatschap om uw profiel online te zetten en gevonden te worden door klanten.
              </p>
            </div>
          </div>
        </div>

        <Button
          size="lg"
          className="w-full gap-2 text-base"
          onClick={onActivate}
          data-testid="btn-onboarding-activate"
        >
          <Rocket className="h-5 w-5" />
          Lidmaatschap activeren
        </Button>

        <Button
          variant="outline"
          size="lg"
          className="w-full gap-2 text-base"
          onClick={onLater}
          data-testid="btn-onboarding-later"
        >
          <Clock className="h-5 w-5" />
          Later doen
        </Button>
      </div>
    </div>
  );
}

// ─── Main wizard ──────────────────────────────────────────────────────────────

interface OnboardingWizardProps {
  accountId: string;
  onComplete: () => void;
}

export function OnboardingWizard({ accountId, onComplete }: OnboardingWizardProps) {
  const { user, updateUserMetadata } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [profileSlug, setProfileSlug] = useState<string>("");

  const { data: accountData } = useQuery<Account>({
    queryKey: ["/api/accounts/by-auth", user?.id],
    enabled: !!user?.id,
  });

  const [personal, setPersonal] = useState<PersonalData>({ firstName: "", lastName: "" });
  const [billing, setBilling] = useState<BillingData>({
    companyName: "", vatNumber: "", btwPlichtig: "no",
    street: "", houseNumber: "", municipality: "", postcode: "",
  });
  const [profileData, setProfileData] = useState<ProfileData>({
    name: "", email: user?.email || "", telnr: "", website: "",
    locationId: "", officeStreet: "", officeNumber: "", officeTown: "", officePostcode: "", hideAddress: false,
  });
  const [about, setAbout] = useState<AboutData>({ introduction: "", description: "" });
  const [services, setServices] = useState<ServicesData>({ mainCategories: [], specializations: [] });

  useEffect(() => {
    if (user?.email) setProfileData(d => ({ ...d, email: d.email || user.email || "" }));
  }, [user?.email]);

  useEffect(() => {
    if (accountData) {
      setBilling(b => ({
        ...b,
        companyName: accountData.companyName || b.companyName,
        street: accountData.billingStreet || b.street,
        houseNumber: accountData.billingNumber || b.houseNumber,
        municipality: accountData.billingCity || b.municipality,
        postcode: accountData.billingPostcode || b.postcode,
        btwPlichtig: accountData.vatNumber ? "yes" : b.btwPlichtig,
        vatNumber: accountData.vatNumber || b.vatNumber,
      }));
    }
  }, [accountData]);

  const savePersonalBilling = useCallback(async () => {
    const ops: Promise<any>[] = [];
    if (personal.firstName || personal.lastName) {
      ops.push(updateUserMetadata({ firstName: personal.firstName, lastName: personal.lastName }));
    }
    if (billing.companyName || billing.street) {
      ops.push(apiRequest("PATCH", `/api/accounts/${accountId}`, {
        companyName: billing.companyName || null,
        billingStreet: billing.street || null,
        billingNumber: billing.houseNumber || null,
        billingCity: billing.municipality || null,
        billingPostcode: billing.postcode || null,
        vatNumber: billing.btwPlichtig === "yes" && billing.vatNumber
          ? formatBelgianVAT(billing.vatNumber)
          : null,
      }));
    }
    await Promise.all(ops);
    queryClient.invalidateQueries({ queryKey: ["/api/accounts/by-auth", user?.id] });
  }, [personal, billing, accountId, user?.id, updateUserMetadata]);

  const saveProfileBasics = useCallback(async () => {
    if (!profileData.name || !profileData.email || !profileData.locationId) return;
    if (profileId) {
      await apiRequest("PUT", `/api/profiles/${profileId}`, {
        name: profileData.name,
        email: profileData.email,
        telnr: profileData.telnr,
        website: profileData.website,
        locationId: profileData.locationId,
        hasWebsite: !!profileData.website,
        hideAddress: profileData.hideAddress,
        office: {
          street: profileData.officeStreet,
          number: profileData.officeNumber,
          town: profileData.officeTown,
          postcode: profileData.officePostcode,
        },
      });
    } else {
      const created: any = await apiRequest("POST", "/api/profiles", {
        name: profileData.name,
        email: profileData.email,
        telnr: profileData.telnr,
        website: profileData.website,
        locationId: profileData.locationId,
        hasWebsite: !!profileData.website,
        isActive: true,
        hideAddress: profileData.hideAddress,
        office: {
          street: profileData.officeStreet,
          number: profileData.officeNumber,
          town: profileData.officeTown,
          postcode: profileData.officePostcode,
        },
      });
      if (created?.id) {
        setProfileId(created.id);
        setProfileSlug(created.slug || created.id);
      }
    }
    queryClient.invalidateQueries({ queryKey: ["/api/my-profiles"] });
  }, [profileData, profileId, accountId]);

  const saveAbout = useCallback(async () => {
    if (!profileId) return;
    await apiRequest("PUT", `/api/profiles/${profileId}`, {
      introduction: about.introduction,
      description: about.description,
    });
  }, [profileId, about]);

  const saveServices = useCallback(async () => {
    if (!profileId) return;
    await apiRequest("PUT", `/api/profiles/${profileId}`, {
      specializations: services.specializations,
      mainCategories: services.mainCategories,
    });
    queryClient.invalidateQueries({ queryKey: ["/api/my-profiles"] });
  }, [profileId, services]);

  const saveCurrentStep = useCallback(async () => {
    if (step === 1) await savePersonalBilling();
    if (step === 2) await saveProfileBasics();
    if (step === 3) await saveAbout();
    if (step === 4) await saveServices();
  }, [step, savePersonalBilling, saveProfileBasics, saveAbout, saveServices]);

  const validateStep = (): string | null => {
    if (step === 1) {
      if (!personal.firstName.trim()) return "Vul uw voornaam in";
      if (!personal.lastName.trim()) return "Vul uw achternaam in";
      if (!billing.companyName.trim()) return "Vul uw bedrijfs- of factuurnaam in";
      if (!billing.street.trim() || !billing.houseNumber.trim()) return "Vul uw factuuradres in";
      if (!billing.postcode.trim() || !billing.municipality.trim()) return "Vul uw postcode en gemeente in";
      if (billing.btwPlichtig === "yes" && billing.vatNumber && !isValidBelgianVAT(billing.vatNumber)) {
        return "Ongeldig BTW-nummer (formaat: BE0123456789)";
      }
    }
    if (step === 2) {
      if (!profileData.name.trim()) return "Vul uw bedrijfsnaam in";
      if (!profileData.email.trim()) return "Vul een contactmailadres in";
      if (!profileData.locationId) return "Selecteer uw hoofdregio";
    }
    return null;
  };

  const handleNext = async () => {
    const err = validateStep();
    if (err) {
      toast({ title: err, variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await saveCurrentStep();
      setStep(s => s + 1);
    } catch (e: any) {
      toast({ title: "Opslaan mislukt", description: e?.message || "Probeer opnieuw", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => setStep(s => Math.max(0, s - 1));

  const handleCloseRequest = () => {
    if (step === 0 || step === 5) { markDone(); return; }
    setShowCloseConfirm(true);
  };

  const handleSaveAndClose = async () => {
    setSaving(true);
    try { await saveCurrentStep(); } catch { /* silent */ } finally { setSaving(false); }
    markDone();
  };

  const markDone = () => {
    if (user?.id) localStorage.setItem(`onboarding_done_${user.id}`, "1");
    onComplete();
  };

  const handleActivate = async () => {
    await saveServices();
    markDone();
    if (profileId) setLocation(`/dashboard/profielen/${profileId}/betalen`);
  };

  const handleLater = () => markDone();

  const stepLabels = ["Welkom", "Uw gegevens", "Profiel aanmaken", "Beschrijving", "Diensten", "Gelukt!"];
  const progressPct = (step / (TOTAL_STEPS - 1)) * 100;

  return (
    <>
      <Dialog open modal>
        <DialogContent
          className="max-w-2xl w-full max-h-[92vh] overflow-y-auto p-0 gap-0"
          onInteractOutside={e => { e.preventDefault(); handleCloseRequest(); }}
          onEscapeKeyDown={e => { e.preventDefault(); handleCloseRequest(); }}
          hideCloseButton
        >
          {/* Header */}
          <div className="sticky top-0 bg-background border-b z-10 px-6 py-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                  Stap {Math.max(1, step)} van {TOTAL_STEPS - 1} — {stepLabels[step]}
                </p>
              </div>
              <button
                onClick={handleCloseRequest}
                className="rounded-full p-1.5 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                aria-label="Sluiten"
                data-testid="btn-onboarding-close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <Progress value={progressPct} className="h-2" />
          </div>

          {/* Body */}
          <div className="px-6 py-6">
            {step === 0 && <StepWelcome onNext={() => setStep(1)} />}
            {step === 1 && (
              <StepPersonalBilling
                personal={personal} setPersonal={setPersonal}
                billing={billing} setBilling={setBilling}
              />
            )}
            {step === 2 && (
              <div className="space-y-8">
                <ProfileContactSection
                  value={{
                    name: profileData.name,
                    email: profileData.email,
                    telnr: profileData.telnr,
                    website: profileData.website,
                    locationId: profileData.locationId,
                  }}
                  onChange={(key, val) => setProfileData(d => ({ ...d, [key]: val }))}
                />
                <ProfileAddressSection
                  value={{
                    officeStreet: profileData.officeStreet,
                    officeNumber: profileData.officeNumber,
                    officeTown: profileData.officeTown,
                    officePostcode: profileData.officePostcode,
                    hideAddress: profileData.hideAddress,
                  }}
                  onChange={(key, val) => setProfileData(d => ({ ...d, [key]: val }))}
                />
              </div>
            )}
            {step === 3 && (
              <ProfileAboutSection
                value={about}
                onChange={(key, val) => setAbout(d => ({ ...d, [key]: val }))}
                websiteUrl={profileData.website}
                companyName={profileData.name}
              />
            )}
            {step === 4 && (
              <ProfileServicesSection
                value={services}
                onChange={(cats, specs) => setServices({ mainCategories: cats, specializations: specs })}
              />
            )}
            {step === 5 && (
              <StepDone
                profileSlug={profileSlug}
                profileId={profileId || ""}
                onActivate={handleActivate}
                onLater={handleLater}
              />
            )}
          </div>

          {/* Footer nav — only on steps 1-4 */}
          {step >= 1 && step <= 4 && (
            <div className="sticky bottom-0 bg-background border-t px-6 py-4 flex items-center justify-between gap-3">
              <Button
                variant="ghost"
                size="lg"
                onClick={handleBack}
                className="gap-2 text-base"
                data-testid="btn-onboarding-back"
              >
                <ChevronLeft className="h-5 w-5" />
                Vorige
              </Button>

              <div className="flex items-center gap-2">
                {step < 4 && (
                  <Button
                    variant="ghost"
                    size="lg"
                    onClick={handleSaveAndClose}
                    className="text-muted-foreground text-sm"
                    disabled={saving}
                    data-testid="btn-onboarding-skip"
                  >
                    Sla op & sluit
                  </Button>
                )}
                <Button
                  size="lg"
                  onClick={handleNext}
                  disabled={saving}
                  className="gap-2 text-base"
                  data-testid="btn-onboarding-next"
                >
                  {saving && <Loader2 className="h-5 w-5 animate-spin" />}
                  {step === 4 ? "Afronden" : "Volgende"}
                  {!saving && <ChevronRight className="h-5 w-5" />}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Close confirmation */}
      <AlertDialog open={showCloseConfirm} onOpenChange={setShowCloseConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Wilt u de wizard sluiten?</AlertDialogTitle>
            <AlertDialogDescription>
              Uw voortgang tot nu toe is al opgeslagen. U kunt de wizard later verder invullen via uw dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel data-testid="btn-onboarding-closecancel">Verder gaan</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSaveAndClose}
              disabled={saving}
              data-testid="btn-onboarding-saveclose"
            >
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Sla op & sluit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
