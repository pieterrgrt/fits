# Hardlopen

Op **Meer → Hardlopen** staan je loopjes als sporen (GPS). Plan en fasen: `SPEC.md`; stand: `PROGRESS.md`.

## Loopjes importeren

- **Uploaden:** kies een of meer GPX- of TCX-bestanden (ook `.gpx.gz` / `.tcx.gz`). De browser pakt ze in en stuurt ze in porties van hooguit 1,5 MB (nginx laat 2 MB per verzoek door). Hetzelfde bestand twee keer importeren doet niets. Startte er binnen 2 minuten al een Strava-activiteit, dan hoort het spoor daarbij; anders maakt Fits een cardio-activiteit, zodat het loopje ook op Cardio meetelt.
- **Map importeren (beheerder):** leest alles in `FITS_SPOREN` (standaard `<FITS_DATA>/sporen`) in je eigen account in, behalve `uploads/`. Een uitgepakte Strava-export werkt zoals hij is: naam en soort komen uit `activities.csv`.
- FIT-bestanden (`.fit.gz`, van horloges) slaat Fits nog over.

## Strava-export

1. Strava → Instellingen → Mijn account → *Je account downloaden* → je krijgt een zip per mail.
2. Je hebt alleen `activities/` en `activities.csv` nodig; de rest (foto's, media) mag weg. Dat scheelt meestal het meeste.
3. Zet die twee in de map `FITS_SPOREN` op de server en klik **Map importeren**.

Geüploade bestanden bewaart Fits (uitgepakt) in `FITS_SPOREN/uploads/<gebruiker>/`, zodat ze later opnieuw verwerkt kunnen worden.

## Kaart

**Hardlopen → Kaart van je loopjes**: al je loopjes over elkaar op OpenStreetMap. Tik op een loopje in de lijst voor de kaart, tijd, tempo en de straten die je toen voor het eerst liep.

## Straten die je kent

Fits haalt het wegennet (straten en paden waar je mag lopen) uit OpenStreetMap via Overpass, in vakken van ~2 × 2 km, en bewaart het in de database. Een stuk straat (tussen twee kruispunten of knopen) telt als gelopen als minstens 70% ervan binnen 20 m van een loopje ligt.

- **Dekking**: hoeveel meter straat je kent in de vakken waar je liep, en hoeveel straatnamen. Stoepen, oversteekplaatsen, trappen, fietspaden en parkeerweggetjes tellen niet mee als straat (je kunt er wel over lopen).
- Na importeren legt Fits nieuwe loopjes vanzelf op straten; met **Bijwerken** gaat het verder. Elke ronde duurt hooguit ~40 seconden; de pagina gaat vanzelf door tot alles klaar is.
- Overpass is een gratis, publieke dienst en soms vol. Fits vraagt overpass-api.de en een mirror tegelijk en neemt het eerste antwoord; lukt het niet, dan later opnieuw. Eigen Overpass-server: `OVERPASS_URL` in `.env`.

## Ontdekrondje

**Hardlopen → Ontdekrondje**: kies een startpunt (tik op de kaart of *Mijn locatie*; standaard waar je meestal begint) en een afstand (2–21 km). Fits geeft drie rondjes in verschillende richtingen, met de nieuwe stukken in je accentkleur. Bewaar een rondje of download het als GPX voor je horloge of telefoon.

Hoe: Fits rekent zelf over het opgehaalde wegennet (geen BRouter nodig). Het legt drie tussenpunten op een cirkel door je startpunt, zoekt de route ertussen (A*) waarbij stukken die je al kent duurder zijn en stukken die al in het rondje zitten nog veel duurder (geen heen-en-terug), en stelt de cirkel bij tot de lengte klopt. Van acht richtingen kiest het de rondjes met de meeste nieuwe meters. De eerste keer in een nieuw gebied haalt Fits eerst het wegennet op; dat kan een paar minuten duren en de pagina laat zien hoe ver het is.
