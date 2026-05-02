import { useState, useMemo } from "react";
import { DashboardLayout } from "./DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import type { ContactRequest, Account } from "@shared/schema";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { 
  MessageSquare,
  Mail,
  Phone,
  Calendar,
  Eye,
  Archive,
  Reply,
  Search,
  SortAsc,
  Loader2,
  AlertCircle,
  X,
} from "lucide-react";

type SortOption = "date-desc" | "date-asc" | "name-asc" | "name-desc" | "subject-asc" | "subject-desc";

export default function DashboardContacts() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("date-desc");

  // Get account ID
  const { data: account } = useQuery<Account>({
    queryKey: ["/api/accounts/by-user", user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error("No user");
      return apiRequest("POST", "/api/accounts", {
        authUserId: user.id,
        email: user.email,
      });
    },
    enabled: !!user?.id,
  });

  // Fetch contact requests
  const { data: contacts = [], isLoading, isError } = useQuery<ContactRequest[]>({
    queryKey: ["/api/contact-requests", account?.id],
    queryFn: async () => {
      if (!account?.id) return [];
      return apiRequest("GET", `/api/contact-requests/${account.id}`);
    },
    enabled: !!account?.id,
  });

  // Filter and sort contacts
  const filteredContacts = useMemo(() => {
    let result = [...contacts];

    // Status filter removed - schema doesn't track status

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          (c.visitorName ?? "").toLowerCase().includes(query) ||
          (c.visitorEmail ?? "").toLowerCase().includes(query) ||
          (c.subject ?? "").toLowerCase().includes(query) ||
          (c.message ?? "").toLowerCase().includes(query)
      );
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case "date-desc":
          return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
        case "date-asc":
          return new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime();
        case "name-asc":
          return (a.visitorName ?? "").localeCompare(b.visitorName ?? "");
        case "name-desc":
          return (b.visitorName ?? "").localeCompare(a.visitorName ?? "");
        case "subject-asc":
          return (a.subject ?? "").localeCompare(b.subject ?? "");
        case "subject-desc":
          return (b.subject ?? "").localeCompare(a.subject ?? "");
        default:
          return 0;
      }
    });

    return result;
  }, [contacts, searchQuery, sortBy]);

  return (
    <DashboardLayout 
      title="Contactverzoeken" 
      description="Bekijk en beheer berichten van potentiële klanten."
    >
      <div className="space-y-6">
        {/* Filters */}
        <Card>
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Zoek op naam, email, onderwerp..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-contacts"
                />
              </div>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-sort">
                  <SortAsc className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Sorteren" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date-desc">Nieuwste eerst</SelectItem>
                  <SelectItem value="date-asc">Oudste eerst</SelectItem>
                  <SelectItem value="name-asc">Naam A-Z</SelectItem>
                  <SelectItem value="name-desc">Naam Z-A</SelectItem>
                  <SelectItem value="subject-asc">Onderwerp A-Z</SelectItem>
                  <SelectItem value="subject-desc">Onderwerp Z-A</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Results count */}
        {contacts.length > 0 && (
          <p className="text-sm text-muted-foreground">
            {filteredContacts.length} van {contacts.length} contactverzoeken
          </p>
        )}

        {/* Contact list */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : isError ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Fout bij laden</AlertTitle>
            <AlertDescription>
              Kon de contactverzoeken niet ophalen. Probeer het later opnieuw.
            </AlertDescription>
          </Alert>
        ) : filteredContacts.length > 0 ? (
          <div className="space-y-4">
            {filteredContacts.map((contact) => (
              <ContactCard key={contact.id} contact={contact} />
            ))}
          </div>
        ) : contacts.length > 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">Geen resultaten</h3>
              <p className="text-muted-foreground">
                Geen contactverzoeken gevonden met de huidige filters.
              </p>
            </CardContent>
          </Card>
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

function ContactCard({ contact }: { contact: ContactRequest }) {
  const [showDetails, setShowDetails] = useState(false);
  const { toast } = useToast();
  
  const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
    NEW: { label: "Nieuw", variant: "default" },
    READ: { label: "Gelezen", variant: "secondary" },
    REPLIED: { label: "Beantwoord", variant: "outline" },
    ARCHIVED: { label: "Gearchiveerd", variant: "outline" },
  };

  const status = statusConfig.NEW;
  const contactDate = new Date(contact.createdAt ?? Date.now());

  const handleReply = () => {
    const subject = encodeURIComponent(`Re: ${contact.subject}`);
    const body = encodeURIComponent(
      `\n\n---\nOrigineel bericht van ${contact.visitorName} op ${contactDate.toLocaleDateString("nl-BE")}:\n\n${contact.message}`
    );
    window.location.href = `mailto:${contact.visitorEmail}?subject=${subject}&body=${body}`;
  };

  const handleArchive = () => {
    toast({
      title: "Binnenkort beschikbaar",
      description: "De archiveringsfunctie wordt binnenkort toegevoegd.",
    });
  };

  return (
    <>
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
                  {contactDate.toLocaleDateString("nl-BE")}
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-1" 
                  onClick={() => setShowDetails(true)}
                  data-testid={`button-view-${contact.id}`}
                >
                  <Eye className="h-3.5 w-3.5" />
                  Bekijken
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-1" 
                  onClick={handleReply}
                  data-testid={`button-reply-${contact.id}`}
                >
                  <Reply className="h-3.5 w-3.5" />
                  Beantwoorden
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="gap-1"
                  onClick={handleArchive}
                  data-testid={`button-archive-${contact.id}`}
                >
                  <Archive className="h-3.5 w-3.5" />
                  Archiveren
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              {contact.subject}
            </DialogTitle>
            <DialogDescription>
              Van {contact.visitorName} op {contactDate.toLocaleDateString("nl-BE", { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex flex-wrap gap-4 text-sm">
              <a 
                href={`mailto:${contact.visitorEmail}`} 
                className="flex items-center gap-1.5 text-primary hover:underline"
              >
                <Mail className="h-4 w-4" />
                {contact.visitorEmail}
              </a>
              {contact.telnr && (
                <a 
                  href={`tel:${contact.telnr}`}
                  className="flex items-center gap-1.5 text-primary hover:underline"
                >
                  <Phone className="h-4 w-4" />
                  {contact.telnr}
                </a>
              )}
            </div>
            
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm whitespace-pre-wrap">{contact.message}</p>
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={handleReply} className="gap-1" data-testid="button-reply-modal">
                <Reply className="h-4 w-4" />
                Beantwoorden
              </Button>
              <Button variant="outline" onClick={() => setShowDetails(false)}>
                Sluiten
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
