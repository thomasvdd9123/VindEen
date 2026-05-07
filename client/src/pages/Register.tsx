import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useLocation } from "wouter";
import { z } from "zod";
import { Layout } from "@/components/layout/Layout";
import { SEO } from "@/components/SEO";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { Leaf, Loader2, ArrowRight, CheckCircle, Mail } from "lucide-react";
import { siteConfig, fillCopy } from "@/lib/theme.config";

const registerSchema = z.object({
  email: z.string().email("Ongeldig email adres"),
  password: z.string().min(8, "Wachtwoord moet minimaal 8 karakters bevatten"),
  confirmPassword: z.string(),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: "Je moet akkoord gaan met de algemene voorwaarden",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Wachtwoorden komen niet overeen",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { signUp } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      const { error, needsConfirmation } = await signUp(data.email, data.password);
      
      if (error) {
        toast({
          title: "Registratie mislukt",
          description: error.message,
          variant: "destructive",
        });
      } else if (needsConfirmation) {
        setRegisteredEmail(data.email);
        setShowConfirmation(true);
      } else {
        toast({
          title: "Account aangemaakt!",
          description: "Je account is succesvol aangemaakt.",
        });
        setLocation("/dashboard");
      }
    } catch (error) {
      toast({
        title: "Er ging iets mis",
        description: "Kon niet registreren. Probeer het later opnieuw.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const benefits = siteConfig.pages.register.benefits;

  if (showConfirmation) {
    return (
      <Layout>
        <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4">
          <Card className="w-full max-w-md text-center" data-testid="card-confirmation">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
                  <Mail className="h-8 w-8 text-primary" />
                </div>
              </div>
              <CardTitle className="text-2xl">Controleer je email</CardTitle>
              <CardDescription className="text-base">
                We hebben een bevestigingslink gestuurd naar:
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="font-medium text-lg" data-testid="text-email">{registeredEmail}</p>
              <p className="text-muted-foreground">
                Klik op de link in de email om je account te bevestigen en door te gaan met het aanmaken van je profiel.
              </p>
              <div className="flex items-start gap-2 rounded-md bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
                <span className="mt-0.5 shrink-0">⚠️</span>
                <span>
                  Geen email ontvangen? Controleer ook je <strong>spam- of ongewenste e-mailmap</strong>. Markeer de email als "Geen spam" zodat je toekomstige emails van ons ontvangt.
                </span>
              </div>
              <div className="pt-2">
                <Link href="/login">
                  <Button variant="outline" className="gap-2" data-testid="button-back-login">
                    Terug naar inloggen
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <SEO
        title={fillCopy(siteConfig.pages.register.seoTitle)}
        description={fillCopy(siteConfig.pages.register.seoDescription)}
        noindex={true}
      />
      <div className="min-h-[calc(100vh-200px)] py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div className="hidden lg:block">
              <div className="sticky top-24">
                <div className="flex items-center gap-2 mb-6">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary">
                    <Leaf className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <span className="font-semibold text-lg">{siteConfig.name}</span>
                </div>

                <h1 className="text-3xl font-bold mb-4">
                  {fillCopy(siteConfig.pages.register.heroTitle)}
                </h1>
                <p className="text-muted-foreground mb-8">
                  {fillCopy(siteConfig.pages.register.heroBody)}
                </p>

                <ul className="space-y-4">
                  {benefits.map((benefit, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10">
                        <CheckCircle className="h-4 w-4 text-primary" />
                      </div>
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <Card data-testid="card-register">
              <CardHeader>
                <CardTitle className="text-2xl">Account aanmaken</CardTitle>
                <CardDescription>
                  Maak een account aan en zet je praktijk online
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input 
                              type="email" 
                              placeholder="je@email.be" 
                              {...field} 
                              data-testid="input-register-email"
                            />
                          </FormControl>
                          <FormDescription>
                            Dit wordt je login email
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Wachtwoord</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="••••••••" 
                              {...field} 
                              data-testid="input-register-password"
                            />
                          </FormControl>
                          <FormDescription>
                            Minimaal 8 karakters
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bevestig wachtwoord</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="••••••••" 
                              {...field} 
                              data-testid="input-register-confirm-password"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="acceptTerms"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 pt-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-terms"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="font-normal">
                              Ik ga akkoord met de{" "}
                              <Link href="/voorwaarden" className="text-primary hover:underline">
                                algemene voorwaarden
                              </Link>{" "}
                              en het{" "}
                              <Link href="/privacy" className="text-primary hover:underline">
                                privacybeleid
                              </Link>
                            </FormLabel>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit" 
                      className="w-full gap-2"
                      disabled={isLoading}
                      data-testid="button-register-submit"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Bezig met registreren...
                        </>
                      ) : (
                        <>
                          Account aanmaken
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </form>
                </Form>

                <div className="mt-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Heb je al een account?{" "}
                    <Link href="/login" className="text-primary font-medium hover:underline" data-testid="link-login">
                      Log in
                    </Link>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
