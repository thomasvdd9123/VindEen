import { Link } from "wouter";
import { DashboardLayout } from "./DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  User, 
  UserCircle, 
  MessageSquare, 
  BarChart3, 
  ArrowRight,
  PlusCircle,
  Eye,
  Mail,
} from "lucide-react";
import { useAuth } from "@/lib/auth";

export default function Dashboard() {
  const { user } = useAuth();

  const quickLinks = [
    {
      title: "Account & facturatie",
      description: "Beheer je persoonlijke gegevens en facturatiedetails",
      href: "/dashboard/account",
      icon: User,
    },
    {
      title: "Jouw praktijkprofielen",
      description: "Bekijk en bewerk je bedrijfsprofielen",
      href: "/dashboard/profielen",
      icon: UserCircle,
    },
    {
      title: "Contactverzoeken",
      description: "Bekijk berichten van potentiële klanten",
      href: "/dashboard/contacten",
      icon: MessageSquare,
    },
    {
      title: "Statistieken",
      description: "Bekijk bezoekersstatistieken van je profielen",
      href: "/dashboard/statistieken",
      icon: BarChart3,
    },
  ];

  const stats = [
    { label: "Profielweergaven", value: "0", icon: Eye },
    { label: "Contactverzoeken", value: "0", icon: Mail },
    { label: "Actieve profielen", value: "0", icon: UserCircle },
  ];

  return (
    <DashboardLayout 
      title="Dashboard" 
      description={`Welkom terug${user?.email ? `, ${user.email.split("@")[0]}` : ""}!`}
    >
      {/* Stats overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Create profile CTA */}
      <Card className="mb-8 border-primary/20 bg-primary/5">
        <CardContent className="py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-lg mb-1">Maak je eerste profiel aan</h3>
              <p className="text-muted-foreground">
                Word zichtbaar voor potentiële klanten door een bedrijfsprofiel aan te maken.
              </p>
            </div>
            <Link href="/dashboard/profielen/nieuw">
              <Button className="gap-2" data-testid="button-create-profile">
                <PlusCircle className="h-4 w-4" />
                Profiel aanmaken
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Quick links grid */}
      <h2 className="text-lg font-semibold mb-4">Snelle navigatie</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {quickLinks.map((link, index) => {
          const Icon = link.icon;
          return (
            <Link key={index} href={link.href}>
              <Card className="hover-elevate cursor-pointer h-full" data-testid={`card-${link.href.split('/').pop()}`}>
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary/10 shrink-0">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium mb-1 flex items-center gap-2">
                        {link.title}
                        <ArrowRight className="h-4 w-4 text-primary" />
                      </h3>
                      <p className="text-sm text-muted-foreground">{link.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </DashboardLayout>
  );
}
