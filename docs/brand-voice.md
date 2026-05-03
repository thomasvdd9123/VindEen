# Brand voice & style guide — Zoek-een-tuinman.be

> Eén centrale schrijf- en stijlgids die de **"i-publicity / Vind-een-…"-toon** vastlegt.
> Verplicht naslagwerk voor élke woordkeuze in deze app: UI-microcopy, info-pagina's,
> e-mails, foutmeldingen, marketingteksten en AI-gegenereerde content.

---

## 1. Bron-analyse — citaten uit de referentiesites

De toon van dit platform is rechtstreeks afgeleid van de bestaande
i-publicity-portalen. Hieronder staan letterlijke citaten die de stem illustreren.

### i-publicity.be (moederbedrijf)
- *"De online match tussen patiënt en hulpverlener"* — homepage hero
- *"Online vindbaarheid voor zelfstandige hulpverleners."* — intro
- *"I-Publicity is het bedrijf achter de sites als VindeenTherapeut.be, Vind-een-Coach.be, Vind-een-Kinesist.be, Vind-een-Osteopaat.be"* — info
  Bron: <https://i-publicity.be/>

### vindeentherapeut.be
- *"Vind een therapeut"* — hero
- *"Ervaringen met therapie: Lees wat therapie reeds betekend heeft voor anderen"* — sociale bewijsvoering
- *"Jouw praktijk op VindeenTherapeut.be: Word écht vindbaar via het internet. Effectiever dan je eigen website."* — CTA
- *"Toon therapeuten"* — knop-microcopy
  Bron: <https://www.vindeentherapeut.be/>

### vind-een-kinesist.be
- *"Vind een kinesist"* — hero
- *"Ondersteuning bij (alle): Ademhalingsproblemen, Artrose, Bekkenbodemspieren…"* — zoek-info
- *"Toon kinesisten"* — knop
- *"In de provincie West-Vlaanderen, Oost-Vlaanderen, Antwerpen, Limburg…"* — footer
  Bron: <https://www.vind-een-kinesist.be/>

### vind-een-psycholoog.be
- *"Vind een psycholoog"* — hero
- *"Ontvang moeiteloos nieuwe cliënten. Alle voordelen op een rij."* — info-blok
- *"Vind-een-Psycholoog heeft me geholpen mijn eigen praktijk op te starten."* — testimonial
- *"Je praktijk aanmelden"* — CTA
- *"Op straal rond een gemeente"* — zoek-CTA
  Bron: <https://www.vind-een-psycholoog.be/>

### vind-een-osteopaat.be
- *"Vind een osteopaat"* — hero
- *"Toon osteopaten"* — knop
  Bron: <https://www.vind-een-osteopaat.be/>

### Specifieke referentie-pagina (info / hoe maak ik een goed profiel)
- *"Hoe maak ik een goed profiel?"* — H1, ook gebruikt als retorische vraag-kop
- *"Vind-een-Psycholoog.be helpt je om online vindbaar te worden en websitebezoekers naar je profiel te trekken."* — intro
- *"Maar de websitebezoekers dan overtuigen om voor JOU te kiezen?"* — retorische vraag, met **HOOFDLETTERS-nadruk** op "JOU"
- *"Met een **goed opgemaakt profiel** benut je het volle potentieel van jouw inschrijving op Vind-een-Psycholoog.be én **onderscheid jij je van je collega's**."* — bold op kernwoorden, niet op hele zin
- *"Onderschat nooit het belang van beelden. Een goede, sprekende foto helpt je om de aandacht van cliënten te grijpen."* — concrete tip, geen jargon
- *"Staat de therapievorm die je toepast of de klacht die je behandelt niet in de lijst? Neem dan zeker contact met ons op."* — open uitnodiging, geen formele drempel
  Bron: <https://www.vind-een-psycholoog.be/info/hoe-maak-ik-een-goed-profiel.html>

---

## 2. Typografie & kleuren

### Lettertype-stack
```
font-family: Ubuntu, Helvetica, Arial, sans-serif;
```
Ubuntu is de primaire huisfont (warm, rond, vriendelijk maar nog professioneel).
Helvetica/Arial vangen op als fallback.

### Tekstgroottes (referentie uit `vind-een-psycholoog.be`)

| Niveau | Grootte | Gewicht | Kleur |
|--------|---------|---------|-------|
| H1 (page heading) | 25.6 px | 700 | `#2A4D5F` |
| H2 | ±20 px | 700 | `#2A4D5F` |
| H3 | ±18 px | 600 | `#2A4D5F` |
| Body / paragraph | 16 px | 400 | `#2A4D5F` |
| Small / meta | 13–14 px | 400 | `#2A4D5F` of grijs |

### Kleurpalet

| Rol | Kleur | Hex |
|-----|-------|-----|
| Primair tekst- en koppen-blauw | donker tealblauw | `#2A4D5F` |
| Accent / CTA / link-hover | warm oranje | `#E8A33D` *(richtwaarde, ±)* |
| Highlight-band achter koppen | zacht blauw vlak | `#CFE0EA` *(ongeveer)* |
| Highlight-band onder titel | zachte oranje streep | `#F8D8A6` *(ongeveer)* |
| Achtergrond pagina | crèmewit | `#FFFFFF` / `#F7F5F1` |
| Footer-band | warm oranje | `#E0A24A` |
| Tekst op donkere footer | wit | `#FFFFFF` |
| Lijn / divider | lichtgrijs | `#E5E7EB` |

### Witruimte & layout
- Royale **regelafstand** in lopende tekst (line-height ±1.5–1.6).
- Marges tussen alinea's: minstens 16 px verticaal.
- Eén kolom lopende tekst, **max-width ±640–720 px** voor leesbaarheid.
- Veel **lucht** rond koppen (16 px boven, 8 px onder).

### Vet, cursief, hoofdletters

- **Vet (bold)**: alléén op de **2 tot 5 kernwoorden** van een alinea — nooit op een hele zin of alinea.
  - ✅ "Met een **goed opgemaakt profiel** benut je het volle potentieel."
  - ❌ "**Met een goed opgemaakt profiel benut je het volle potentieel.**"
- *Cursief*: zelden gebruikt, alleen voor titels (boeken, externe sites) of subtiele nadruk.
- HOOFDLETTERS: alléén op losse woorden voor emotionele nadruk, max. 1 woord per alinea.
  - ✅ "Overtuig websitebezoekers om voor **JOU** te kiezen."
  - ❌ "OVERTUIG WEBSITEBEZOEKERS OM VOOR JOU TE KIEZEN."
- Onderstrepen: enkel voor links — nooit als nadruk.

---

## 3. Schrijfstijl-regels (do's & don'ts)

### Aanspreking
Direct, persoonlijk, **"je / jij / jouw"** — nooit "u".
- ✅ "Maak je profiel compleet en klanten vinden je sneller."
- ❌ "Maak uw profiel compleet en klanten zullen u sneller vinden."

### Wij-vorm voor het platform
Het platform spreekt in de **eerste persoon meervoud** ("wij / we / ons"), als een team dat aan jouw kant staat.
- ✅ "Wij helpen je om gevonden te worden door de juiste klanten."
- ❌ "Het platform stelt u in staat om gevonden te worden."

### Retorische vragen als koppen
Koppen zijn vaak **vragen** die de lezer in zijn eigen hoofd hoort denken.
- ✅ "Hoe maak ik een goed profiel?" / "Wat kost een tuinman?"
- ❌ "Profiel-optimalisatie" / "Tarief-overzicht"

### Korte, concrete zinnen — geen jargon
Schrijf zoals een vriendelijke buur die het je uitlegt aan de keukentafel.
- ✅ "Een goede foto trekt meer klanten aan dan tien zinnen tekst."
- ❌ "Visuele assets faciliteren significante conversie-uplift in lead-generatie."

### Geen marketing-superlatieven
Geen "beste", "grootste", "#1", "revolutionair". Wél concrete cijfers en getuigenissen.
- ✅ "Meer dan 1.200 tuinmannen al ingeschreven."
- ❌ "Het allerbeste platform van België — revolutionaire matching!"

### Empathisch & transparant — leg het *waarom* uit
Eerst het probleem benoemen, dan de oplossing, dan het resultaat.
- ✅ "Een eigen website kost veel tijd en geld. Wij brengen klanten direct bij jou — zo kan jij je focussen op wat je echt graag doet: tuinieren."
- ❌ "Schrijf je in op het platform."

### Opsommingen met vetgedrukt trefwoord
- ✅
  - **Snel gevonden** — je profiel staat binnen 24 uur online.
  - **Eerlijke prijs** — één tarief, geen verborgen kosten.
  - **Geen contract** — opzeggen kan altijd.
- ❌
  - Je profiel staat snel online.
  - Het tarief is eerlijk.
  - Je kan altijd opzeggen.

### Belgisch-Nederlands
Gebruik **Belgische termen**; vermijd Hollandse woorden.

| ✅ Belgisch | ❌ Hollands |
|-------------|-------------|
| gsm | mobieltje |
| factuur | rekening |
| btw | omzetbelasting |
| gemeente | dorp |
| tof / leuk | gezellig |
| zaakvoerder | ondernemer (in juridische zin) |
| u kan | u kunt |
| niet… meer | niet meer… |

---

## 4. Toon per context

### 4.1 Homepage / hero
- Eén korte, krachtige hoofdzin: **"Vind een [beroep]"** (max. 4 woorden).
- Eronder één zin die het *waarom* uitlegt voor de bezoeker.
- Eén primaire CTA in de stem van de bezoeker ("Toon tuinmannen", niet "Verzenden").

✅
> # Vind een tuinman
> In je eigen gemeente, met de juiste specialisatie, en zonder gedoe.
> **[Toon tuinmannen]**

❌
> # Welkom op het platform
> Wij bieden u een uitgebreide gids van geverifieerde tuinmannen.
> **[Submit]**

### 4.2 Info- en uitleg-pagina's
- Koppen als retorische vragen.
- Korte alinea's (max. 3–4 zinnen).
- Eerste alinea = volledige samenvatting in normaal Nederlands.
- Bold-trefwoorden helpen scannen.
- Sluit altijd af met een **uitnodiging** ("Vragen? Neem contact op." / "Klaar? Maak je profiel aan.").

### 4.3 Formulier-labels & help-teksten
- Labels zijn **kort en concreet** (1–3 woorden), zonder dubbele punt.
- Help-tekst eronder begint met een werkwoord en legt uit *waarom* de info nodig is.

✅
> **Telefoonnummer**
> *Zo kunnen klanten je rechtstreeks bellen — wordt niet doorgegeven aan derden.*

❌
> **Telefoonnummer (verplicht):**
> *Vul hier uw telefoonnummer in.*

### 4.4 Knop-microcopy (CTA's)
- Werkwoord + concreet object. Geen "OK", "Verzenden", "Submit".
- Spreek vanuit de actie van de gebruiker.

| ✅ | ❌ |
|-----|------|
| Toon tuinmannen | Zoeken |
| Maak je profiel aan | Registreren |
| Stuur mijn vraag door | Versturen |
| Bewaar wijzigingen | OK |
| Annuleren | Cancel |

### 4.5 Succes-, waarschuwings- en foutmeldingen

**Succes** — kort, warm, bevestigend.
- ✅ "Klaar! Je bericht is verstuurd. We laten je snel iets weten."
- ❌ "Operatie geslaagd."

**Waarschuwing** — leg uit wat te doen.
- ✅ "Je profiel staat nog op privé. **Zet het online** zodat klanten je kunnen vinden."
- ❌ "Profiel is niet zichtbaar."

**Fout** — geen schuld leggen, wél oplossing aanbieden.
- ✅ "Dit e-mailadres herkennen we niet. Probeer het opnieuw of **maak een profiel aan**."
- ❌ "Ongeldige invoer. Foutcode E_AUTH_404."

### 4.6 Lege staten
Erken de situatie en stel een volgende stap voor.
- ✅ "Geen tuinmannen gevonden in 9000 Gent voor *snoeien*. **Probeer een nabije gemeente** of bekijk **alle tuinmannen** in heel België."
- ❌ "Geen resultaten."

### 4.7 Transactionele e-mails
- Onderwerpregel: **concreet en menselijk**, geen "[NOREPLY]"-stijl.
  - ✅ "Welkom! Je profiel staat online 🌱"
  - ❌ "Account confirmation #4823"
- Aanhef: "Hallo {voornaam}," (één komma, geen "Geachte heer/mevrouw").
- Body: 1 alinea wat er gebeurd is, 1 alinea wat de volgende stap is, 1 CTA-knop.
- Afsluiting: "Tot binnenkort, het team van Zoek-een-tuinman.be".
- Footer: praktisch (afmeldlink, contact, BTW).

### 4.8 GDPR / juridische teksten
- Toon blijft **menselijk** — juridisch correct, maar leesbaar voor een 16-jarige.
- Vermijd "in dit kader", "betreffende", "alsmede".
- Splits lange zinnen op. Gebruik bullets.
- ✅ "We bewaren je gegevens zo lang je profiel actief is. Verwijder je je profiel? Dan wissen we alles binnen 30 dagen."
- ❌ "Persoonsgegevens worden bewaard gedurende de looptijd van de overeenkomst, alsmede gedurende de wettelijk voorgeschreven bewaartermijnen."

---

## 5. Woordenlijst — voorkeurstermen

| ✅ Gebruik | ❌ Vermijd | Waarom |
|-----------|-----------|--------|
| profiel | account | "Profiel" voelt persoonlijk, "account" voelt administratief |
| inschrijven | registreren | Korter, warmer, Belgisch |
| aanmelden | inloggen | Past bij de stem van het platform |
| klant / bezoeker | gebruiker / lead | Mensentaal i.p.v. marketingtaal |
| gemeente | stad / dorp | Belgische standaardterm |
| tuinman / professional | service provider / vendor | Echte beroep, geen jargon |
| bericht | inquiry / message | Nederlands, geen Engels |
| factuur | invoice / rekening | Belgisch standaard |
| tarief / prijs | fee / kosten | Concreet |
| bewaren | opslaan | Iets warmer |
| verwijderen | wissen / deleten | Standaard NL |
| online zetten | publiceren / activeren | Spreektaal |
| Toon tuinmannen | Zoek / Submit | Concrete actie |
| Vragen? | Need help? | Belgisch-NL, vraagvorm |
| btw-nummer | VAT number | Belgische standaard |
| jij / je / jouw | u / uw | Informele stem |
| we / wij | het platform | Mens i.p.v. systeem |

---

## 6. AI-prompt-snippet

> Kopieer onderstaand blok in elke AI-prompt (system message) waarmee je tekst voor
> deze app laat genereren — UI-copy, e-mails, info-pagina's, antwoorden op klanten,
> productbeschrijvingen, marketingteksten. Vul `{vertical}` in (bv. "tuinman",
> "kapper", "loodgieter") en `{site}` (bv. "Zoek-een-tuinman.be").

```text
Je schrijft Nederlandstalige teksten voor {site}, een Belgisch online-platform dat
klanten matcht met een lokale {vertical}. Je houdt je strikt aan de "i-publicity /
Vind-een-…"-stem.

TOON
- Spreek de lezer aan met "je / jij / jouw" — nooit met "u".
- Spreek namens het platform met "wij / we / ons".
- Warm, empathisch, concreet, transparant. Leg altijd het *waarom* uit.
- Belgisch-Nederlands (gemeente, factuur, btw, gsm) — geen Hollandse uitdrukkingen.
- Korte zinnen (gemiddeld 12–18 woorden). Korte alinea's (max. 3–4 zinnen).
- Geen jargon. Geen marketing-superlatieven ("beste", "#1", "revolutionair").
- Geen Engels (geen "submit", "lead", "vendor", "inquiry").

STRUCTUUR
- Koppen zijn vaak retorische vragen ("Hoe maak ik een goed profiel?").
- Eerste alinea = volledige samenvatting in normaal Nederlands.
- Opsommingen beginnen met een **vetgedrukt trefwoord** + uitleg.
- Sluit altijd af met een uitnodiging of concrete volgende stap.

NADRUK
- **Vet (bold)**: alleen op de 2–5 kernwoorden van een alinea — nooit hele zinnen.
- HOOFDLETTERS: alleen op één los woord voor emotionele nadruk ("voor JOU").
- Cursief: zelden, alleen voor titels van externe werken.
- Onderstrepen: alleen voor hyperlinks.

WOORDKEUZE (verplicht)
- profiel (niet account) · inschrijven (niet registreren) · aanmelden (niet inloggen)
- klant / bezoeker (niet gebruiker / lead) · gemeente (niet dorp / stad)
- bericht (niet message) · factuur (niet invoice) · tarief / prijs (niet fee)
- bewaren (niet opslaan) · online zetten (niet publiceren) · btw-nummer (niet VAT)

CTA-MICROCOPY
- Altijd werkwoord + concreet object: "Toon {vertical}en", "Maak je profiel aan",
  "Stuur mijn vraag door", "Bewaar wijzigingen".
- Nooit: "OK", "Verzenden", "Submit", "Cancel".

FOUTMELDINGEN
- Geen schuld bij de gebruiker. Bied altijd een oplossing of volgende stap aan.
- ✅ "Dit e-mailadres herkennen we niet. Probeer het opnieuw of maak een profiel aan."
- ❌ "Ongeldige invoer."

E-MAILS
- Onderwerpregel: concreet en menselijk, geen "[NOREPLY]"-stijl.
- Aanhef: "Hallo {voornaam},"
- Afsluiting: "Tot binnenkort, het team van {site}".

JURIDISCHE/GDPR-TEKSTEN
- Juridisch correct, maar leesbaar voor een 16-jarige. Korte zinnen, bullets,
  geen "alsmede", "in dit kader", "betreffende".

Schrijf nooit langer dan strikt nodig. Liever één rake zin dan drie vage.
```
