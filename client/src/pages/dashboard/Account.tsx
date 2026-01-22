import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { DashboardLayout } from "./DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { Loader2, Save, Mail, Trash2, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from "@/lib/supabase";

const accountSchema = z.object({
  firstName: z.string().min(2, "Voornaam is verplicht"),
  lastName: z.string().min(2, "Achternaam is verplicht"),
  gender: z.string().optional(),
  birthYear: z.string().optional(),
  showBirthDate: z.string().optional(),
});

const invoiceSchema = z.object({
  invoiceName: z.string().min(2, "Naam is verplicht"),
  street: z.string().min(2, "Straat is verplicht"),
  municipality: z.string().min(2, "Gemeente is verplicht"),
  postcode: z.string().min(4, "Postcode is verplicht"),
  country: z.string().min(2, "Land is verplicht"),
  btwPlichtig: z.string(),
  btwNumber: z.string().optional(),
  kvkNumber: z.string().optional(),
});

type AccountFormData = z.infer<typeof accountSchema>;
type InvoiceFormData = z.infer<typeof invoiceSchema>;

export default function DashboardAccount() {
  const { user, getUserMetadata, updateUserMetadata } = useAuth();
  const { toast } = useToast();
  const [isLoadingAccount, setIsLoadingAccount] = useState(false);
  const [isLoadingInvoice, setIsLoadingInvoice] = useState(false);
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [newEmail, setNewEmail] = useState("");

  const metadata = getUserMetadata();

  const accountForm = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      firstName: metadata.firstName || "",
      lastName: metadata.lastName || "",
      gender: metadata.gender || "",
      birthYear: metadata.birthYear || "",
      showBirthDate: metadata.showBirthDate || "no",
    },
  });

  const invoiceForm = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      invoiceName: metadata.invoiceName || "",
      street: metadata.street || "",
      municipality: metadata.municipality || "",
      postcode: metadata.postcode || "",
      country: metadata.country || "België",
      btwPlichtig: metadata.btwPlichtig || "no",
      btwNumber: metadata.btwNumber || "",
      kvkNumber: metadata.kvkNumber || "",
    },
  });

  // Only load form values on initial mount, not on every metadata change
  const [hasLoadedAccount, setHasLoadedAccount] = useState(false);
  const [hasLoadedInvoice, setHasLoadedInvoice] = useState(false);

  useEffect(() => {
    if (!hasLoadedAccount && metadata.firstName) {
      accountForm.reset({
        firstName: metadata.firstName || "",
        lastName: metadata.lastName || "",
        gender: metadata.gender || "",
        birthYear: metadata.birthYear || "",
        showBirthDate: metadata.showBirthDate || "no",
      });
      setHasLoadedAccount(true);
    }
  }, [metadata.firstName, hasLoadedAccount]);

  useEffect(() => {
    if (!hasLoadedInvoice && metadata.invoiceName) {
      invoiceForm.reset({
        invoiceName: metadata.invoiceName || "",
        street: metadata.street || "",
        municipality: metadata.municipality || "",
        postcode: metadata.postcode || "",
        country: metadata.country || "België",
        btwPlichtig: metadata.btwPlichtig || "no",
        btwNumber: metadata.btwNumber || "",
        kvkNumber: metadata.kvkNumber || "",
      });
      setHasLoadedInvoice(true);
    }
  }, [metadata.invoiceName, hasLoadedInvoice]);

  const onSubmitAccount = async (data: AccountFormData) => {
    setIsLoadingAccount(true);
    try {
      const { error } = await updateUserMetadata({
        firstName: data.firstName,
        lastName: data.lastName,
        gender: data.gender,
        birthYear: data.birthYear,
        showBirthDate: data.showBirthDate,
      });
      
      if (error) {
        toast({
          title: "Er ging iets mis",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Gegevens opgeslagen",
          description: "Je persoonlijke gegevens zijn bijgewerkt.",
        });
      }
    } catch (error) {
      toast({
        title: "Er ging iets mis",
        description: "Kon gegevens niet opslaan.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingAccount(false);
    }
  };

  const onSubmitInvoice = async (data: InvoiceFormData) => {
    setIsLoadingInvoice(true);
    try {
      const { error } = await updateUserMetadata({
        invoiceName: data.invoiceName,
        street: data.street,
        municipality: data.municipality,
        postcode: data.postcode,
        country: data.country,
        btwPlichtig: data.btwPlichtig,
        btwNumber: data.btwNumber,
        kvkNumber: data.kvkNumber,
      });
      
      if (error) {
        toast({
          title: "Er ging iets mis",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Factuurgegevens opgeslagen",
          description: "Je factuurgegevens zijn bijgewerkt.",
        });
      }
    } catch (error) {
      toast({
        title: "Er ging iets mis",
        description: "Kon factuurgegevens niet opslaan.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingInvoice(false);
    }
  };

  const handleEmailChange = async () => {
    if (!newEmail || !newEmail.includes("@")) {
      toast({
        title: "Ongeldig email adres",
        description: "Vul een geldig email adres in.",
        variant: "destructive",
      });
      return;
    }

    setIsChangingEmail(true);
    try {
      const { error } = await supabase.auth.updateUser({
        email: newEmail,
      });
      
      if (error) {
        toast({
          title: "Er ging iets mis",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Bevestigingsmail verzonden",
          description: "Controleer je inbox om je nieuwe email adres te bevestigen.",
        });
        setNewEmail("");
      }
    } catch {
      toast({
        title: "Er ging iets mis",
        description: "Kon email niet wijzigen.",
        variant: "destructive",
      });
    } finally {
      setIsChangingEmail(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);
    try {
      // Call API to delete account and all associated data
      const response = await fetch("/api/account/delete", {
        method: "DELETE",
        credentials: "include",
      });
      
      if (response.ok) {
        await supabase.auth.signOut();
        window.location.href = "/";
      } else {
        const data = await response.json();
        toast({
          title: "Er ging iets mis",
          description: data.error || "Kon account niet verwijderen.",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Er ging iets mis",
        description: "Kon account niet verwijderen.",
        variant: "destructive",
      });
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return (
    <DashboardLayout 
      title="Account & facturatie" 
      description="Vul hieronder je persoonlijke en facturatiegegevens in."
    >
      <div className="max-w-3xl space-y-8">
        {/* Personal details */}
        <Card>
          <CardHeader>
            <CardTitle>Persoonlijke details</CardTitle>
            <CardDescription>
              Deze gegevens worden gebruikt voor je account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...accountForm}>
              <form onSubmit={accountForm.handleSubmit(onSubmitAccount)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={accountForm.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Voornaam <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="Voornaam" {...field} data-testid="input-firstname" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={accountForm.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Achternaam <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="Achternaam" {...field} data-testid="input-lastname" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={accountForm.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Geslacht <span className="text-destructive">*</span></FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-gender">
                              <SelectValue placeholder="Selecteer" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="man">Man</SelectItem>
                            <SelectItem value="vrouw">Vrouw</SelectItem>
                            <SelectItem value="anders">Anders</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={accountForm.control}
                    name="birthYear"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Geboortejaar</FormLabel>
                        <FormControl>
                          <Input placeholder="Jaar" {...field} data-testid="input-birthyear" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={accountForm.control}
                  name="showBirthDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Toon geboortedatum op profiel(en)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-showbirthdate">
                            <SelectValue placeholder="Selecteer" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="yes">Toon mijn leeftijd op mijn profiel</SelectItem>
                          <SelectItem value="no">Toon mijn leeftijd NIET op mijn profiel</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="pt-4">
                  <Button type="submit" disabled={isLoadingAccount} className="gap-2" data-testid="button-save-account">
                    {isLoadingAccount ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Opslaan
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Invoice details */}
        <Card>
          <CardHeader>
            <CardTitle>Factuur details</CardTitle>
            <CardDescription>
              Vul hieronder je facturatiegegevens in. Betalen kan steeds vrijblijvend na de aanmaak van je profiel. 
              Na betaling wordt je voldane factuur toegezonden.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...invoiceForm}>
              <form onSubmit={invoiceForm.handleSubmit(onSubmitInvoice)} className="space-y-4">
                <FormField
                  control={invoiceForm.control}
                  name="invoiceName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Factuur op naam van <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="Bedrijfsnaam of naam" {...field} data-testid="input-invoicename" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={invoiceForm.control}
                    name="street"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Straatnaam en huisnummer factuur <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="Straat + nummer" {...field} data-testid="input-street" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={invoiceForm.control}
                    name="municipality"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gemeente facturatieadres <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="Gemeente" {...field} data-testid="input-municipality" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={invoiceForm.control}
                    name="postcode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Postcode factuur <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="Postcode" {...field} data-testid="input-postcode" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={invoiceForm.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Land factuur <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="Land" {...field} data-testid="input-country" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={invoiceForm.control}
                    name="btwPlichtig"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>BTW-plicht <span className="text-destructive">*</span></FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-btw">
                              <SelectValue placeholder="Selecteer" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="yes">Ja, ik ben btw plichtig</SelectItem>
                            <SelectItem value="no">Nee, ik ben niet btw plichtig</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={invoiceForm.control}
                    name="btwNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Btw-nummer</FormLabel>
                        <FormControl>
                          <Input placeholder="BE0123456789" {...field} disabled={invoiceForm.watch("btwPlichtig") === "no"} data-testid="input-btwnumber" />
                        </FormControl>
                        <FormDescription className={invoiceForm.watch("btwPlichtig") === "no" ? "text-muted-foreground italic" : "hidden"}>
                          Niet BTW-plichtig
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={invoiceForm.control}
                  name="kvkNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ondernemingsnummer / KVK-nummer</FormLabel>
                      <FormControl>
                        <Input placeholder="Ondernemingsnummer" {...field} data-testid="input-kvk" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <p className="text-sm text-muted-foreground">
                  Gegevens tussentijds opslaan
                </p>

                <div className="pt-4">
                  <Button type="submit" disabled={isLoadingInvoice} className="gap-2" data-testid="button-save-invoice">
                    {isLoadingInvoice ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Opslaan en volgende
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Email Change */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email wijzigen
            </CardTitle>
            <CardDescription>
              Wijzig het email adres waarmee je inlogt.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Huidig email: <span className="font-medium text-foreground">{user?.email}</span>
                </p>
              </div>
              <div className="flex gap-4">
                <Input
                  type="email"
                  placeholder="Nieuw email adres"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="max-w-sm"
                  data-testid="input-new-email"
                />
                <Button 
                  onClick={handleEmailChange} 
                  disabled={isChangingEmail || !newEmail}
                  data-testid="button-change-email"
                >
                  {isChangingEmail ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Wijzigen"
                  )}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Je ontvangt een bevestigingsmail op je nieuwe adres.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Account Deletion */}
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Account verwijderen
            </CardTitle>
            <CardDescription>
              Verwijder je account en alle bijbehorende gegevens permanent.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Let op!</AlertTitle>
              <AlertDescription>
                Deze actie kan niet ongedaan worden gemaakt. Al je profielen, contactaanvragen en gegevens worden permanent verwijderd.
              </AlertDescription>
            </Alert>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" data-testid="button-delete-account">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Account permanent verwijderen
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Weet je het zeker?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Deze actie verwijdert je account en alle bijbehorende gegevens permanent. 
                    Dit kan niet ongedaan worden gemaakt.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuleren</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDeleteAccount}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    disabled={isDeletingAccount}
                  >
                    {isDeletingAccount ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Ja, verwijder mijn account"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
