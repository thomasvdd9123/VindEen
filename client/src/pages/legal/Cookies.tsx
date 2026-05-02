import { LegalPageLayout } from "@/components/legal/LegalPageLayout";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { siteConfig } from "@/lib/theme.config";
import { clearConsent, openCookieSettings, useCookieConsent } from "@/lib/cookieConsent";

interface CookieRow {
  name: string;
  type: "Noodzakelijk" | "Analytisch" | "Marketing";
  purpose: string;
  retention: string;
  provider: string;
}

const cookies: CookieRow[] = [
  {
    name: "cookie-consent",
    type: "Noodzakelijk",
    purpose: "Onthoudt jouw cookievoorkeur.",
    retention: "12 maanden",
    provider: siteConfig.name,
  },
  {
    name: "session / auth",
    type: "Noodzakelijk",
    purpose: "Houdt je ingelogd en beveiligt je sessie.",
    retention: "Sessie tot 30 dagen",
    provider: siteConfig.name,
  },
  {
    name: "_ga, _ga_*",
    type: "Analytisch",
    purpose: "Anonieme bezoekersstatistieken (indien geactiveerd).",
    retention: "Tot 24 maanden",
    provider: "Google Analytics",
  },
];

export default function Cookies() {
  const { consent, acceptAll, acceptNecessary } = useCookieConsent();

  return (
    <LegalPageLayout
      title="Cookiebeleid"
      description={`Welke cookies gebruikt ${siteConfig.name}, waarvoor dienen ze en hoe beheer je je voorkeuren?`}
      canonical="/cookies"
    >
      <p>
        Een cookie is een klein bestandje dat een website op je toestel plaatst
        om informatie te onthouden — bijvoorbeeld of je ingelogd bent of welke
        cookievoorkeur je hebt gemaakt. Hieronder vind je per categorie welke
        cookies wij gebruiken en waarvoor.
      </p>

      <h2>1. Categorieën</h2>
      <ul>
        <li>
          <strong>Noodzakelijke cookies</strong> — strikt nodig om het platform
          te laten werken (login, beveiliging, taalkeuze, cookievoorkeur).
          Hiervoor is geen toestemming vereist.
        </li>
        <li>
          <strong>Analytische cookies</strong> — meten anoniem hoe bezoekers de
          site gebruiken zodat we hem kunnen verbeteren. Worden enkel geplaatst
          na jouw toestemming.
        </li>
        <li>
          <strong>Marketingcookies</strong> — voor gepersonaliseerde reclame en
          tracking. Worden enkel geplaatst na jouw toestemming. Op dit moment
          plaatsen wij standaard geen marketingcookies.
        </li>
      </ul>

      <h2>2. Overzicht</h2>
      <div className="not-prose my-6 overflow-x-auto rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cookie</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Doel</TableHead>
              <TableHead>Bewaartermijn</TableHead>
              <TableHead>Aanbieder</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cookies.map((c) => (
              <TableRow key={c.name} data-testid={`row-cookie-${c.name}`}>
                <TableCell className="font-mono text-xs">{c.name}</TableCell>
                <TableCell>{c.type}</TableCell>
                <TableCell>{c.purpose}</TableCell>
                <TableCell>{c.retention}</TableCell>
                <TableCell>{c.provider}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <h2>3. Jouw voorkeuren beheren</h2>
      <p>
        Je kan je toestemming op elk moment aanpassen of intrekken. Naast de
        knoppen hieronder kan je cookies ook altijd verwijderen via je browser.
      </p>
      <p data-testid="text-current-consent">
        <strong>Huidige status:</strong>{" "}
        {consent
          ? consent.choice === "all"
            ? "Alle cookies aanvaard"
            : "Alleen noodzakelijke cookies"
          : "Nog geen keuze gemaakt"}
        {consent && (
          <>
            {" "}
            (gemaakt op{" "}
            {new Date(consent.timestamp).toLocaleDateString("nl-BE")})
          </>
        )}
        .
      </p>
      <div className="not-prose my-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Button onClick={() => acceptAll()} data-testid="button-accept-all-cookies-page">
          Alles aanvaarden
        </Button>
        <Button
          variant="outline"
          onClick={() => acceptNecessary()}
          data-testid="button-accept-necessary-cookies-page"
        >
          Alleen noodzakelijke
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            clearConsent();
            openCookieSettings();
          }}
          data-testid="button-reset-cookies"
        >
          Voorkeur wissen / opnieuw kiezen
        </Button>
      </div>

      <h2>4. Browserinstellingen</h2>
      <p>
        Je kan in je browser ook handmatig cookies blokkeren of verwijderen. Let
        op: het uitschakelen van noodzakelijke cookies kan ervoor zorgen dat
        bepaalde delen van het platform niet meer werken.
      </p>

      <h2>5. Meer informatie</h2>
      <p>
        Lees ook ons <a href="/privacy">privacybeleid</a> voor een volledig
        overzicht van hoe wij persoonsgegevens verwerken.
      </p>
    </LegalPageLayout>
  );
}
