import { useState } from "react";
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
import { Loader2, Save } from "lucide-react";

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
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoadingAccount, setIsLoadingAccount] = useState(false);
  const [isLoadingInvoice, setIsLoadingInvoice] = useState(false);

  const accountForm = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      gender: "",
      birthYear: "",
      showBirthDate: "no",
    },
  });

  const invoiceForm = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      invoiceName: "",
      street: "",
      municipality: "",
      postcode: "",
      country: "België",
      btwPlichtig: "no",
      btwNumber: "",
      kvkNumber: "",
    },
  });

  const onSubmitAccount = async (data: AccountFormData) => {
    setIsLoadingAccount(true);
    try {
      toast({
        title: "Gegevens opgeslagen",
        description: "Je persoonlijke gegevens zijn bijgewerkt.",
      });
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
      toast({
        title: "Factuurgegevens opgeslagen",
        description: "Je factuurgegevens zijn bijgewerkt.",
      });
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
      </div>
    </DashboardLayout>
  );
}
