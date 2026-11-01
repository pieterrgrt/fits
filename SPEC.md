# Hardlopen in Fits — specificatie

Status: concept, nog niet door Pieter goedgekeurd. Pieter gaf toestemming om alvast te bouwen ("bouw alvast alle andere dingen").

## Doel

Veel verschillende hardlooproutes leren en vinden. De kern is een **ontdekmodus**: Fits stelt rondjes voor vanaf een startpunt die zoveel mogelijk over straten gaan waar je nog niet hebt gelopen. Je oude loopjes (ook uit de Strava-export) vormen het geheugen van wat je al kent. Strava zelf is bijzaak.

## Uitgangspunten

- **Eigen server, eigen data.** Sporen staan in de SQLite-database van Fits. Ruwe bestanden (GPX/TCX/FIT, Strava-export) staan in een instelbare map: `FITS_SPOREN`, standaard `<FITS_DATA>/sporen`.
- **Routing: eigen A* over het OSM-wegennet** (gewijzigd op 2026-11-01; eerst was het plan BRouter). Fits haalt voor de dekking toch al het wegennet op; daarover routeren is snel genoeg (< 1 s voor een rondje in een stad) en vraagt geen extra service. Fits kiest tussenpunten op een cirkel en routeert ertussen. BRouter blijft een optie als hoogte of ondergrond belangrijk worden.
- **docker-compose.yml en Dockerfile blijven ongemoeid** (CLAUDE.md). BRouter draaien als extra compose-service is een voorstel voor Pieter; tot hij dat vraagt beschrijft `docs/hardlopen.md` hoe je BRouter los start.
- **Migraties alleen toevoegend** (nieuwe tabellen en kolommen), zodat een oudere versie van de app met de nieuwe database blijft werken.
- **Werk op branch `hardlopen`.** Niets op `main`: een push naar main zet de app live.
- **Geen zware afhankelijkheden waar het niet hoeft.** GPX/TCX lezen, afstanden, vereenvoudigen en polylines zijn klein genoeg om zelf te doen (en te testen). Voor de kaart komt er wél een bibliotheek (fase 2).

## Fasen

### Fase 1 — Looparchief
Sporen in Fits krijgen.
- GPX en TCX lezen (ook `.gz`, zoals in de Strava-export).
- Opslaan per spoor: begin, afstand, duur, aantal punten, vereenvoudigde lijn (polyline, ~5 m nauwkeurig), grenzen (bbox). Elk spoor krijgt een cardio-activiteit (soort Run, enz.), zodat het meetelt op Cardio. Hetzelfde bestand twee keer importeren doet niets (hash); een spoor dat samenvalt met een Strava-activiteit (zelfde begintijd) koppelt aan die activiteit in plaats van een dubbele te maken.
- Pagina **Hardlopen** (`/hardlopen`): bestanden uploaden, lijst met loopjes en een kleine vorm van elk spoor, totalen.
- Map importeren: alles in `FITS_SPOREN` inlezen, inclusief de indeling van een Strava-export (`activities/`, `activities.csv` voor naam en soort). Alleen voor de beheerder (de map is van de hele server).
- Sporen in de export van je account; weg bij het verwijderen van je account (cascade).

### Fase 2 — Kaart
- Kaart met al je loopjes over elkaar (warmtekaart-achtig), OSM-tegels met bronvermelding.
- Spoordetail: één loopje op de kaart.
- Keuze kaartbibliotheek: Leaflet (klein, rasterkaart) tenzij er een reden is voor MapLibre.

### Fase 3 — Straten die je kent
- Straatnetwerk voor je gebied ophalen uit OpenStreetMap (Overpass), in de database cachen.
- Sporen op straten leggen (map matching, eenvoudig: punten binnen ~20 m van een straatstuk, met richting).
- Dekking: welk deel van de straten in je buurt je al hebt gelopen; nieuwe straten per loopje.

### Fase 4 — Ontdekrondjes
- Invoer: startpunt (thuis of locatie), afstand (bv. 8 km), eventueel voorkeur (verhard, rustig).
- Fits kiest tussenpunten richting ongelopen straten en laat BRouter routeren (profiel voor hardlopen/voetganger); probeert een paar varianten en kiest die met de meeste nieuwe meters en de afstand het dichtst bij het doel.
- Resultaat: route op de kaart, % nieuw, GPX downloaden (voor horloge of telefoon).

### Fase 5 — Routes leren
- Routes bewaren met een naam; zien welke je al hebt gelopen (een spoor dat de route volgt).
- Routebibliotheek: favorieten, vaak gelopen, nog nooit gelopen.

## Open vragen voor Pieter
1. ~~BRouter~~ — niet nodig gebleken (zie Uitgangspunten).
2. Startpunt: vaste thuislocatie in je account bewaren, of elke keer kiezen?
3. FIT-bestanden (horloges) ook lezen? Strava-exports bevatten vaak `.fit.gz`. Gepland na fase 1.
4. Mag de kaart OSM-tegels van openstreetmap.org gebruiken (prima voor persoonlijk gebruik), of liever een eigen tegelbron?
