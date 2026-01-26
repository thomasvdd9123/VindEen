import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Send, Loader2, CheckCircle } from "lucide-react";
import { contactFormSchema, type ContactFormData } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

// Extend window type for reCAPTCHA
declare global {
  interface Window {
    grecaptcha?: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

interface ContactFormProps {
  profileId: string;
  profileName: string;
}

export function ContactForm({ profileId, profileName }: ContactFormProps) {
  const { toast } = useToast();

  // Fetch reCAPTCHA site key from backend
  const { data: recaptchaConfig } = useQuery<{ siteKey: string }>({
    queryKey: ["/api/config/recaptcha"],
  });

  // Load reCAPTCHA script when site key is available
  useEffect(() => {
    if (!recaptchaConfig?.siteKey) return;
    
    // Check if already loaded
    if (document.querySelector('script[src*="recaptcha"]')) return;
    
    const script = document.createElement("script");
    script.src = `https://www.google.com/recaptcha/api.js?render=${recaptchaConfig.siteKey}`;
    script.async = true;
    document.head.appendChild(script);
  }, [recaptchaConfig?.siteKey]);

  // Get reCAPTCHA token
  const getRecaptchaToken = useCallback(async (): Promise<string | null> => {
    if (!recaptchaConfig?.siteKey || !window.grecaptcha) return null;
    
    return new Promise((resolve) => {
      window.grecaptcha!.ready(async () => {
        try {
          const token = await window.grecaptcha!.execute(recaptchaConfig.siteKey, { action: "contact_form" });
          resolve(token);
        } catch (error) {
          console.error("reCAPTCHA error:", error);
          resolve(null);
        }
      });
    });
  }, [recaptchaConfig?.siteKey]);

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      visitorName: "",
      visitorEmail: "",
      telnr: "",
      subject: "",
      message: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: ContactFormData) => {
      const recaptchaToken = await getRecaptchaToken();
      // If reCAPTCHA is configured but token couldn't be obtained, show error
      if (recaptchaConfig?.siteKey && !recaptchaToken) {
        throw new Error("reCAPTCHA kon niet worden geladen. Herlaad de pagina en probeer opnieuw.");
      }
      return apiRequest("POST", `/api/contact/${profileId}`, { ...data, recaptchaToken });
    },
    onSuccess: () => {
      toast({
        title: "Bericht verzonden!",
        description: `Je bericht is succesvol verzonden naar ${profileName}. Ze nemen zo snel mogelijk contact met je op.`,
      });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Er ging iets mis",
        description: error.message || "Je bericht kon niet worden verzonden. Probeer het later opnieuw.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ContactFormData) => {
    mutation.mutate(data);
  };

  return (
    <Card data-testid="card-contact-form">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5 text-primary" />
          Neem contact op
        </CardTitle>
        <CardDescription>
          Stuur een bericht naar {profileName}. Zij nemen zo snel mogelijk contact met je op.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="visitorName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Naam *</FormLabel>
                    <FormControl>
                      <Input placeholder="Je volledige naam" {...field} data-testid="input-contact-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="visitorEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="je@email.be" {...field} data-testid="input-contact-email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="telnr"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefoonnummer</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="+32 XXX XX XX XX" {...field} data-testid="input-contact-phone" />
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
                  <FormLabel>Onderwerp *</FormLabel>
                  <FormControl>
                    <Input placeholder="Waar kan ik je mee helpen?" {...field} data-testid="input-contact-subject" />
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
                  <FormLabel>Bericht *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Beschrijf je vraag of project zo gedetailleerd mogelijk..."
                      className="min-h-[120px] resize-none"
                      {...field}
                      data-testid="textarea-contact-message"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              className="w-full gap-2"
              disabled={mutation.isPending}
              data-testid="button-submit-contact"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verzenden...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Verstuur bericht
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
