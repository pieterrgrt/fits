# Hardlopen

Op **Meer → Hardlopen** staan je loopjes als sporen (GPS). Plan en fasen: `SPEC.md`; stand: `PROGRESS.md`.

## Loopjes importeren

- **Uploaden:** kies een of meer GPX- of TCX-bestanden (ook `.gpx.gz` / `.tcx.gz`). Hetzelfde bestand twee keer importeren doet niets. Startte er binnen 2 minuten al een Strava-activiteit, dan hoort het spoor daarbij; anders maakt Fits een cardio-activiteit, zodat het loopje ook op Cardio meetelt.
- **Map importeren (beheerder):** leest alles in `FITS_SPOREN` (standaard `<FITS_DATA>/sporen`) in je eigen account in, behalve `uploads/`. Een uitgepakte Strava-export werkt zoals hij is: naam en soort komen uit `activities.csv`.
- FIT-bestanden (`.fit.gz`, van horloges) slaat Fits nog over.

## Strava-export

1. Strava → Instellingen → Mijn account → *Je account downloaden* → je krijgt een zip per mail.
2. Je hebt alleen `activities/` en `activities.csv` nodig; de rest (foto's, media) mag weg. Dat scheelt meestal het meeste.
3. Zet die twee in de map `FITS_SPOREN` op de server en klik **Map importeren**.

Geüploade bestanden bewaart Fits (uitgepakt) in `FITS_SPOREN/uploads/<gebruiker>/`, zodat ze later opnieuw verwerkt kunnen worden.
