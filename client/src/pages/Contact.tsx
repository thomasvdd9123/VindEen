import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SEO } from "@/components/SEO";
import { siteConfig } from "@/lib/theme.config";
import { useToast } from "@/hooks/use-toast";
import { Mail, Phone, MapPin, Send, Loader2 } from "lucide-react";

const contactSchema = z.object({
  name: z.string().min(2, "Naam is verplicht"),
  email: z.string().email("Ongeldig email adres"),
  subject: z.string().min(3, "Onderwerp is verplicht"),
  message: z.string().min(10, "Bericht moet minimaal 10 karakters bevatten"),
});

type ContactFormData = z.infer<typeof contactSchema>;

export default function Contact() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
    },
  });

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/contact-owner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast({
          title: "Bericht verzonden",
          description: "Bedankt voor je bericht. We nemen zo snel mogelijk contact met je op.",
        });
        form.reset();
      } else {
        throw new Error("Verzenden mislukt");
      }
    } catch {
      toast({
        title: "Er ging iets mis",
        description: "Het bericht kon niet worden verzonden. Probeer het later opnieuw.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title="Contact"
        description="Neem contact op met Zoek-een-tuinman.be. Heb je vragen of feedback? We helpen je graag verder."
        canonical="/contact"
      />
      <Header />
      <main className="flex-1">
        <div className="bg-primary/5 border-b">
          <div className="container mx-auto px-4 py-12">
            <h1 className="text-3xl font-bold text-foreground" data-testid="text-contact-title">
              Contact
            </h1>
            <p className="text-muted-foreground mt-2">
              Heb je een vraag of opmerking? Neem gerust contact met ons op.
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Stuur ons een bericht</CardTitle>
                  <CardDescription>
                    Vul het formulier in en we nemen zo snel mogelijk contact met je op.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Naam</FormLabel>
                            <FormControl>
                              <Input placeholder="Je naam" {...field} data-testid="input-contact-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="je@email.be" {...field} data-testid="input-contact-email" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="subject"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Onderwerp</FormLabel>
                            <FormControl>
                              <Input placeholder="Waar gaat je vraag over?" {...field} data-testid="input-contact-subject" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="message"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bericht</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Typ hier je bericht..." 
                                className="min-h-[120px]"
                                {...field} 
                                data-testid="input-contact-message"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button type="submit" disabled={isSubmitting} className="w-full gap-2" data-testid="button-contact-submit">
                        {isSubmitting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                        Verstuur bericht
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Contactgegevens</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Email</p>
                      <a href={`mailto:${siteConfig.email}`} className="text-muted-foreground hover:text-primary">
                        {siteConfig.email}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Locatie</p>
                      <p className="text-muted-foreground">België</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Veelgestelde vragen</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Misschien staat het antwoord op je vraag al in onze FAQ.
                  </p>
                  <Button variant="outline" asChild>
                    <a href="/faq">Bekijk FAQ</a>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
