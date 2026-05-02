import { LegalPageLayout } from "@/components/legal/LegalPageLayout";
import { siteConfig, legalValue, legalAddress } from "@/lib/theme.config";

export default function Terms() {
  const { legal } = siteConfig;
  const companyName = legalValue(legal.companyName) ?? siteConfig.name;
  const address = legalAddress();
  const vat = legalValue(legal.vat);
  const kbo = legalValue(legal.companyNumber);
  const rpr = legalValue(legal.rpr);
  const court = legalValue(legal.competentCourt);
  const contactEmail = legalValue(legal.contactEmail) ?? siteConfig.email;

  return (
    <LegalPageLayout
      title="Algemene voorwaarden"
      description={`Algemene voorwaarden voor het gebruik van ${siteConfig.name} door professionele tuinprofessionals (B2B).`}
      canonical="/algemene-voorwaarden"
    >
      <p>
        Deze algemene voorwaarden ("Voorwaarden") zijn van toepassing op elk
        gebruik van het platform <strong>{siteConfig.name}</strong>,
        uitgebaat door {companyName}
        {address && <> , met zetel te {address}</>}
        {(kbo || vat) && (
          <>
            {" "}
            (
            {kbo && <>ondernemingsnummer {kbo}</>}
            {kbo && vat && <>, </>}
            {vat && <>BTW {vat}</>}
            )
          </>
        )}
        {rpr && <>, ingeschreven bij de {rpr}</>}
         ("wij", "ons").
      </p>

      <h2>1. Toepassingsgebied</h2>
      <p>
        Deze Voorwaarden gelden voor elke professionele gebruiker (hierna
        "Gebruiker") die zich registreert om als tuinprofessional zichtbaar
        te zijn op het platform. Door aanmaak van een account of betaling
        van een abonnement aanvaardt de Gebruiker uitdrukkelijk deze
        Voorwaarden. Eigen algemene voorwaarden van de Gebruiker zijn niet
        van toepassing.
      </p>

      <h2>2. Diensten</h2>
      <p>
        Wij bieden een online vindplaats waar tuinprofessionals een profiel
        kunnen publiceren met bedrijfsinformatie, specialisaties en
        contactmogelijkheden. Wij zijn een louter technisch platform: we
        treden niet op als tussenpersoon, makelaar of vertegenwoordiger en
        zijn geen partij bij overeenkomsten tussen Gebruikers en hun
        klanten.
      </p>

      <h2>3. Abonnement, looptijd en opzegging</h2>
      <ul>
        <li>
          Abonnementen worden aangegaan voor de op de bestelpagina vermelde
          periode (maandelijks of jaarlijks) en worden stilzwijgend verlengd
          voor eenzelfde periode tenzij ten minste 30 dagen vóór de
          vervaldatum schriftelijk wordt opgezegd via{" "}
          <a href={`mailto:${contactEmail}`}>{contactEmail}</a> of via het
          dashboard.
        </li>
        <li>
          Reeds betaalde bedragen voor de lopende periode worden niet
          terugbetaald bij opzegging.
        </li>
      </ul>

      <h2>4. Prijzen en betaling</h2>
      <ul>
        <li>Prijzen worden vermeld exclusief BTW, tenzij anders aangegeven.</li>
        <li>
          Betaling gebeurt via onze betaalprovider Mollie. De Gebruiker geeft
          uitdrukkelijk toestemming voor recurrente afschrijving voor de
          gekozen abonnementsperiode.
        </li>
        <li>
          Bij niet-betaling op de vervaldag is van rechtswege en zonder
          ingebrekestelling een verwijlinterest verschuldigd conform de Wet
          van 2 augustus 2002 op de bestrijding van betalingsachterstand bij
          handelstransacties, vermeerderd met een forfaitaire
          schadevergoeding van 10% met een minimum van € 40.
        </li>
        <li>
          Bij wanbetaling kunnen wij het profiel zonder voorafgaande
          verwittiging deactiveren.
        </li>
      </ul>

      <h2>5. Herroepingsrecht</h2>
      <p>
        Deze overeenkomst wordt afgesloten met een onderneming of
        zelfstandige in het kader van zijn beroepsactiviteit (B2B). Het
        herroepingsrecht uit Boek VI van het Wetboek Economisch Recht geldt
        enkel voor consumenten en is bijgevolg{" "}
        <strong>niet van toepassing</strong>.
      </p>

      <h2>6. Verplichtingen van de Gebruiker</h2>
      <ul>
        <li>
          De Gebruiker garandeert dat alle door hem aangeleverde gegevens en
          beelden juist en up-to-date zijn en dat hij beschikt over de nodige
          rechten op alle inhoud die hij plaatst.
        </li>
        <li>
          De Gebruiker beschikt over de wettelijk vereiste vergunningen,
          verzekeringen en kwalificaties om zijn diensten aan te bieden.
        </li>
        <li>
          Misleidende, onjuiste, beledigende, illegale of inbreukmakende
          inhoud is verboden en kan leiden tot onmiddellijke schorsing van
          het account zonder terugbetaling.
        </li>
      </ul>

      <h2>7. Aansprakelijkheid</h2>
      <ul>
        <li>
          Wij leveren een inspanningsverbintenis voor een ononderbroken
          beschikbaarheid van het platform, maar geen resultaatsverbintenis.
          Wij zijn niet aansprakelijk voor tijdelijke onbeschikbaarheid,
          verlies van gegevens door technische incidenten of overmacht.
        </li>
        <li>
          Wij zijn nooit aansprakelijk voor de uitvoering, kwaliteit of
          betaalgeschillen tussen Gebruiker en zijn klanten.
        </li>
        <li>
          Onze totale aansprakelijkheid is in elk geval beperkt tot het bedrag
          dat de Gebruiker in de 12 maanden voorafgaand aan het schadegeval
          aan ons heeft betaald, en uitsluitend voor directe schade.
          Indirecte schade (winstderving, verlies van klanten,
          reputatieschade…) is uitgesloten.
        </li>
      </ul>

      <h2>8. Intellectuele eigendom</h2>
      <p>
        Alle rechten op het platform, de software, het ontwerp, het logo en
        de databank blijven exclusief eigendom van {companyName}. De
        Gebruiker behoudt de rechten op zijn eigen inhoud, maar verleent ons
        een wereldwijde, royaltyvrije licentie om die inhoud te tonen, te
        reproduceren en te indexeren in het kader van de werking en promotie
        van het platform.
      </p>

      <h2>9. Persoonsgegevens</h2>
      <p>
        De verwerking van persoonsgegevens is geregeld in ons{" "}
        <a href="/privacy">privacybeleid</a>.
      </p>

      <h2>10. Wijzigingen</h2>
      <p>
        Wij kunnen deze Voorwaarden eenzijdig aanpassen. Substantiële
        wijzigingen worden minstens 30 dagen vooraf per e-mail aangekondigd.
        Bij verderzetting van het gebruik wordt de Gebruiker geacht de
        nieuwe versie te aanvaarden.
      </p>

      <h2>11. Toepasselijk recht en bevoegde rechtbank</h2>
      <p>
        Deze Voorwaarden worden beheerst door {legal.governingLaw}.
        {court ? (
          <> Elk geschil valt onder de uitsluitende bevoegdheid van {court}.</>
        ) : (
          <>
            {" "}
            Elk geschil valt onder de uitsluitende bevoegdheid van de
            Belgische rechtbanken die territoriaal bevoegd zijn op basis van
            de maatschappelijke zetel van {companyName}.
          </>
        )}
      </p>

      <h2>12. Contact</h2>
      <p>
        Voor alle vragen:{" "}
        <a href={`mailto:${contactEmail}`}>{contactEmail}</a>.
      </p>
    </LegalPageLayout>
  );
}
