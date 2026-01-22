import { DashboardLayout } from "./DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MessageSquare,
  Mail,
  Phone,
  Calendar,
  Eye,
  Archive,
  Reply,
} from "lucide-react";

export default function DashboardContacts() {
  const contacts: any[] = [];

  return (
    <DashboardLayout 
      title="Contactverzoeken" 
      description="Bekijk en beheer berichten van potentiële klanten."
    >
      <div className="space-y-6">
        {contacts.length > 0 ? (
          <div className="space-y-4">
            {contacts.map((contact: any) => (
              <ContactCard key={contact.id} contact={contact} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">Nog geen contactverzoeken</h3>
              <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                Wanneer potentiële klanten contact opnemen via je profiel, verschijnen de berichten hier.
              </p>
              <p className="text-sm text-muted-foreground">
                Tip: Zorg dat je profiel volledig is ingevuld om meer contactverzoeken te ontvangen.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

function ContactCard({ contact }: { contact: any }) {
  const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
    NEW: { label: "Nieuw", variant: "default" },
    READ: { label: "Gelezen", variant: "secondary" },
    REPLIED: { label: "Beantwoord", variant: "outline" },
    ARCHIVED: { label: "Gearchiveerd", variant: "outline" },
  };

  const status = statusConfig[contact.status] || statusConfig.NEW;

  return (
    <Card data-testid={`card-contact-${contact.id}`}>
      <CardContent className="p-5">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <h3 className="font-semibold">{contact.visitorName}</h3>
                <p className="text-sm text-muted-foreground">{contact.subject}</p>
              </div>
              <Badge variant={status.variant}>{status.label}</Badge>
            </div>

            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {contact.message}
            </p>

            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
              <span className="flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" />
                {contact.visitorEmail}
              </span>
              {contact.telnr && (
                <span className="flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5" />
                  {contact.telnr}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {new Date(contact.date).toLocaleDateString("nl-BE")}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" className="gap-1">
                <Eye className="h-3.5 w-3.5" />
                Bekijken
              </Button>
              <Button variant="outline" size="sm" className="gap-1">
                <Reply className="h-3.5 w-3.5" />
                Beantwoorden
              </Button>
              <Button variant="ghost" size="sm" className="gap-1">
                <Archive className="h-3.5 w-3.5" />
                Archiveren
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
