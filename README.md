# Fits

Persoonlijke sportapp: gym is de hoofdzaak, cardio is extra, groei komt uit gym + eten + slaap. Draait op **fits.alduslab.eu**, een project onder [Aldus](https://alduslab.eu), met een eigen merk en designsysteem.

- **Vandaag:** de sessie van de dag, starten met één tik, pijlers (gym, eiwit, slaap, cardio) en de dagregel.
- **Training:** per oefening je vorige sessie en het doel van vandaag (+1 rep per set), sets loggen met een reps-stepper, "hoeveel had je nog over" (RIR), rusttimer (90–120 of 60 sec), uitleg met bewegende figuur, wisselslot kiezen, twee-uursoptie.
- **Zonder bereik:** sets die je zonder verbinding logt, bewaart Fits op je telefoon en verstuurt ze vanzelf zodra er bereik is. De trainingspagina opent ook offline (service worker). Tijdens een training blijft het scherm aan; de rusttimer loopt door als je de app wegzet. Vergeten trainingen sluit Fits na 4 uur zelf af.
- **Zondag-check:** dubbele progressie als regels. Fits stelt voor wat zwaarder mag, waar een set af moet, wat na 4 weken stilstand vervangen kan, laat je het wisselslot kiezen, toont sets per spiergroep (doel 10–20 per week) en laat je de weekregel invullen.
- **Groei:** krachtverloop per hoofdoefening (geschat 1RM) met records, ook live tijdens je training; lichte week (deload) als voorstel na 6 weken, bij weinig energie of als je vastloopt; gewichtstrend over 3 weken met advies voor je calorieën; eiwit verspreid over de dag (momenten van 30 g+); slaap naast je prestaties; waarschuwing als je een spiergroep binnen 48 uur opnieuw zwaar traint; wisselslot-opties die spiergroepen onder de 10 sets aanvullen; schijven per kant voor elke halterstang-oefening.
- **Fotoverloop:** elke 4 weken voor/zij/achter, alleen op je eigen server (`<FITS_DATA>/fotos`), naast elkaar te vergelijken. Niet in de export.
- **Schema:** Push/Pull/Legs uit het oorspronkelijke document, met "sinds"-datums. Alles aan te passen.
- **Oefeningen:** 51 oefeningen met animatie, spierkaart, uitvoering, aandachtspunten en je eigen verloop.
- **Eten (zoals Lifesum):** dagboek per maaltijd, calorie-ring en macro's (eiwit, koolhydraten, vet) op je doelen uit het schema, zoeken in een basislijst en in Open Food Facts (merkproducten), barcode scannen, porties, favorieten, recent, eigen producten, vaste maaltijden en recepten, "zelfde als gisteren", snel calorieën toevoegen, water en vasten. Zie `docs/eten.md`.
- **Slaap uit Apple Gezondheid:** een opdracht op je iPhone stuurt elke ochtend je slaap (met fasen) en eventueel je gewicht. Zie `docs/gezondheid.md`.
- **Logboek, doelen, overzicht eten en slaap, cardio.** Cardio voer je zelf in; Strava koppelen kan, maar hoeft niet.
- **Accounts:** inloggen, uitnodigingen, apparaten beheren, wachtwoord wijzigen, export, account verwijderen.

## Op je laptop draaien

Nodig: Node.js 22.

```sh
npm install
cp .env.example .env   # optioneel: Strava-sleutels
npm run dev            # http://localhost:5173
npm test               # de progressieregels
npm run build          # productieversie naar build/
```

Het eerste account dat je aanmaakt wordt beheerder. Daarna kan alleen iemand met een uitnodigingscode (via **Meer → Beheer**) een account maken. De database is één SQLite-bestand in `data/`.

## Online

Een Docker-container op de Hetzner-server, achter de nginx van de server, op poort 8005. Een push naar `main` bouwt en test de app en zet hem (als de geheimen zijn ingesteld) online. Stappen, beheer en back-ups: `docs/online-zetten.md`. Strava is optioneel: `docs/strava.md`.

## Indeling

```
src/
  lib/design/            designsysteem: tokens.css (kleur, letter, maat) en fits.css (onderdelen)
  lib/figuur/            de engine voor de bewegende oefenfiguren
  lib/oefeningen.js      alle oefeningen: uitleg, spieren, rust, stappen, animatie
  lib/progressie.js      dubbele progressie als regels (getest in tests/)
  lib/server/            database, inloggen, startschema, Strava
  routes/                de pagina's (Vandaag, training, schema, zondag, …)
  routes/ontwerp/        het designsysteem als pagina (ook zonder inloggen)
static/merk/             beeldmerk en app-iconen
design/tokens.json       alle designtokens als data
docs/                    online zetten, Strava, designsysteem
```

## Designsysteem

"IJzer": donker, één felle kleur (Volt) voor vooruitgang, vier pijlerkleuren, Archivo + Inter. Zie `docs/designsysteem.md` of `/ontwerp` in de app.
