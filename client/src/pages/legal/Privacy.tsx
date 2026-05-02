import { LegalPageLayout } from "@/components/legal/LegalPageLayout";
import { siteConfig, legalValue, legalAddress } from "@/lib/theme.config";

export default function Privacy() {
  const { legal } = siteConfig;
  const companyName = legalValue(legal.companyName) ?? siteConfig.name;
  const address = legalAddress();
  const vat = legalValue(legal.vat);
  const kbo = legalValue(legal.companyNumber);
  const dpoEmail = legalValue(legal.dpoEmail) ?? siteConfig.email;
  const contactEmail = legalValue(legal.contactEmail) ?? siteConfig.email;

  return (
    <LegalPageLayout
      title="Privacybeleid"
      description={`Privacybeleid van ${siteConfig.name} — welke persoonsgegevens we verwerken, waarom, hoe lang en welke rechten je hebt onder de GDPR.`}
      canonical="/privacy"
    >
      <p>
        {companyName}
        {address && <> , met maatschappelijke zetel te {address}</>}
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
        , is verantwoordelijk voor de verwerking van persoonsgegevens via{" "}
        <strong>{siteConfig.name}</strong> (hierna "het platform"). In dit
        privacybeleid leggen we uit welke gegevens we verzamelen, waarom, hoe
        lang we ze bewaren en welke rechten je hebt onder de Algemene
        Verordening Gegevensbescherming (GDPR / AVG).
      </p>

      <h2>1. Welke gegevens verzamelen we?</h2>
      <ul>
        <li>
          <strong>Accountgegevens:</strong> naam, e-mailadres, wachtwoord
          (gehasht), telefoonnummer.
        </li>
        <li>
          <strong>Bedrijfs- en profielgegevens:</strong> bedrijfsnaam,
          ondernemingsnummer, BTW-nummer, adresgegevens, beschrijving,
          specialisaties, foto's, werkgebied.
        </li>
        <li>
          <strong>Betaalgegevens:</strong> facturatiegegevens en
          transactie-IDs. Kaart- en rekeninggegevens worden uitsluitend
          verwerkt door onze betaalprovider Mollie en komen niet op onze
          servers terecht.
        </li>
        <li>
          <strong>Communicatiegegevens:</strong> berichten via het
          contactformulier en e-mails verstuurd via Resend.
        </li>
        <li>
          <strong>Technische gegevens:</strong> IP-adres, browser- en
          apparaatinfo, loggegevens, en — indien je daarvoor toestemming
          geeft — cookies voor statistieken.
        </li>
      </ul>

      <h2>2. Waarvoor en op welke grondslag?</h2>
      <ul>
        <li>
          <strong>Uitvoering van de overeenkomst</strong> (art. 6.1.b GDPR):
          aanmaken en beheren van je account en profielen, betalingen
          verwerken, facturen en bevestigingsmails versturen.
        </li>
        <li>
          <strong>Wettelijke verplichting</strong> (art. 6.1.c GDPR):
          boekhoudkundige bewaring van facturen, fiscale verplichtingen.
        </li>
        <li>
          <strong>Gerechtvaardigd belang</strong> (art. 6.1.f GDPR):
          beveiliging van het platform, fraudepreventie, verbetering van de
          dienstverlening.
        </li>
        <li>
          <strong>Toestemming</strong> (art. 6.1.a GDPR): niet-essentiële
          cookies en eventuele commerciële nieuwsbrieven.
        </li>
      </ul>

      <h2>3. Met wie delen we je gegevens?</h2>
      <p>
        We verkopen je gegevens nooit. We delen ze enkel met verwerkers die
        voor ons werken op basis van een verwerkersovereenkomst:
      </p>
      <ul>
        <li>
          <strong>Mollie</strong> (betaalverwerking) — Mollie B.V., Nederland.
        </li>
        <li>
          <strong>Resend</strong> (transactionele e-mails) — Resend Inc., VS,
          onder passende waarborgen (SCC's).
        </li>
        <li>
          <strong>Hostingprovider</strong> voor opslag binnen de EER.
        </li>
      </ul>
      <p>
        Daarnaast worden contactaanvragen die je via het platform verstuurt
        naar een tuinprofessional aan die professional bezorgd — dat is
        immers het doel van de aanvraag.
      </p>

      <h2>4. Hoe lang bewaren we je gegevens?</h2>
      <ul>
        <li>
          Accountgegevens: zolang je account actief is, en tot 12 maanden na
          sluiting.
        </li>
        <li>
          Facturen en boekhoudkundige stukken: 7 jaar (wettelijke
          verplichting).
        </li>
        <li>Contactaanvragen: maximaal 24 maanden.</li>
        <li>Logs: maximaal 12 maanden.</li>
      </ul>

      <h2>5. Beveiliging</h2>
      <p>
        We nemen passende technische en organisatorische maatregelen:
        versleutelde verbindingen (HTTPS), gehashte wachtwoorden,
        toegangsbeheer, back-ups en periodieke audits.
      </p>

      <h2>6. Jouw rechten</h2>
      <p>Je hebt op elk moment het recht op:</p>
      <ul>
        <li><strong>Inzage</strong> in je persoonsgegevens.</li>
        <li><strong>Rectificatie</strong> van onjuiste of onvolledige gegevens.</li>
        <li><strong>Wissing</strong> ("recht op vergetelheid"), binnen de wettelijke grenzen.</li>
        <li><strong>Beperking</strong> van de verwerking.</li>
        <li><strong>Bezwaar</strong> tegen verwerkingen op basis van gerechtvaardigd belang.</li>
        <li><strong>Overdraagbaarheid</strong> van je gegevens in een gestructureerd formaat.</li>
        <li><strong>Intrekking van toestemming</strong>, zonder dat dit afbreuk doet aan eerdere verwerkingen.</li>
      </ul>
      <p>
        Je kan deze rechten uitoefenen door een e-mail te sturen naar{" "}
        <a href={`mailto:${dpoEmail}`}>{dpoEmail}</a>. We antwoorden binnen
        30 dagen.
      </p>

      <h2>7. Klacht indienen</h2>
      <p>
        Heb je een klacht over hoe wij met je gegevens omgaan, dan kan je
        terecht bij de {legal.dpa.name}, {legal.dpa.address} —{" "}
        <a href={legal.dpa.url} target="_blank" rel="noopener noreferrer">
          {legal.dpa.url}
        </a>
        .
      </p>

      <h2>8. Contact</h2>
      <p>
        Voor alle vragen rond privacy:{" "}
        <a href={`mailto:${dpoEmail}`}>{dpoEmail}</a>. Algemene
        contactvragen: <a href={`mailto:${contactEmail}`}>{contactEmail}</a>.
      </p>

      <h2>9. Wijzigingen</h2>
      <p>
        We kunnen dit privacybeleid aanpassen. De laatste versie staat steeds
        op deze pagina, met vermelding van de datum van laatste wijziging.
      </p>
    </LegalPageLayout>
  );
}
