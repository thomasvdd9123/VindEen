import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "wouter";
import { z } from "zod";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { Leaf, Loader2, ArrowLeft, Mail, CheckCircle } from "lucide-react";
import { siteConfig } from "@/lib/theme.config";

const forgotPasswordSchema = z.object({
  email: z.string().email("Ongeldig email adres"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const { toast } = useToast();
  const { resetPassword } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [sentEmail, setSentEmail] = useState("");

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    try {
      const { error } = await resetPassword(data.email);
      
      if (error) {
        toast({
          title: "Er ging iets mis",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setSentEmail(data.email);
        setEmailSent(true);
      }
    } catch (error) {
      toast({
        title: "Er ging iets mis",
        description: "Kon geen reset email versturen. Probeer het later opnieuw.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <Layout>
        <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4">
          <Card className="w-full max-w-md text-center" data-testid="card-email-sent">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
                  <CheckCircle className="h-8 w-8 text-primary" />
                </div>
              </div>
              <CardTitle className="text-2xl">Email verzonden</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                We hebben een wachtwoord reset link gestuurd naar:
              </p>
              <p className="font-medium" data-testid="text-sent-email">{sentEmail}</p>
              <p className="text-sm text-muted-foreground">
                Klik op de link in de email om een nieuw wachtwoord in te stellen. De link is 1 uur geldig.
              </p>
              <div className="pt-4">
                <Link href="/login">
                  <Button variant="outline" className="gap-2" data-testid="button-back-login">
                    <ArrowLeft className="h-4 w-4" />
                    Terug naar inloggen
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
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4">
        <Card className="w-full max-w-md" data-testid="card-forgot-password">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary">
                <Leaf className="h-6 w-6 text-primary-foreground" />
              </div>
            </div>
            <CardTitle className="text-2xl">Wachtwoord vergeten?</CardTitle>
            <CardDescription>
              Vul je email adres in en we sturen je een link om je wachtwoord te resetten.
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
                          data-testid="input-forgot-email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full gap-2"
                  disabled={isLoading}
                  data-testid="button-reset-submit"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Bezig met versturen...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4" />
                      Verstuur reset link
                    </>
                  )}
                </Button>
              </form>
            </Form>

            <div className="mt-6 text-center">
              <Link href="/login" className="text-sm text-muted-foreground hover:text-primary">
                <ArrowLeft className="h-3 w-3 inline mr-1" />
                Terug naar inloggen
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
