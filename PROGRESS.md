# Voortgang hardloopmodule

Branch: `hardlopen`. Specificatie: `SPEC.md`.

## Ontwikkelen
Geen Node op de server. Ontwikkelen in een container met bouwgereedschap (better-sqlite3 wordt gecompileerd; `node:22-slim` heeft geen Python/make/g++, daarom faalde `npm ci`):

```sh
docker build -t fits-dev - <<'EOF'
FROM node:22-slim
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*
EOF
docker run --rm -u "$(id -u):$(id -g)" -e HOME=/tmp -v "$PWD":/app -w /app fits-dev sh -c 'npm ci && npm run build && npm test'
```

## Stand
- [x] `npm ci` werkt (oorzaak: geen bouwgereedschap in de container)
- [x] SPEC.md
- [x] Fase 1 — looparchief (2026-11-01)
  - `src/lib/spoor.js`: GPX/TCX lezen, afstand, bewegende tijd, vereenvoudigen, polyline, SVG-vorm, activities.csv (tests: `tests/spoor.test.js`)
  - migratie 5: tabel `sporen` (alleen toevoegend)
  - `src/lib/server/sporen.js`: importeren (upload, .gz, dubbel via hash, koppelen aan bestaande Strava-activiteit binnen 2 min), map importeren, verwijderen
  - `/hardlopen` (via Meer): uploaden, map importeren (beheerder), lijst met vorm, totalen; sporen in de export; weg bij account verwijderen
  - end-to-end getest in de gebouwde app (upload, dubbel, kapot bestand, .gz, map met activities.csv, FIT overgeslagen, verwijderen, export)
- [ ] FIT-bestanden lezen
- [x] Fase 2 — kaart (Leaflet + OSM-tegels, donker/licht): `/hardlopen/kaart`, loopje-detail `/hardlopen/[id]`
- [x] Fase 3 — straten die je kent: OSM via Overpass (cellen ~2 × 2 km, migratie 6), sporen op straten (`src/lib/hardlopen/netwerk.js`, `src/lib/server/straten.js`), dekking en nieuwe straten per loopje
- [x] Fase 4 — ontdekrondjes: eigen routering (A*) op het OSM-netwerk in plaats van BRouter, `/hardlopen/rondje`, GPX
- [~] Fase 5 — routes bewaren en als GPX downloaden: klaar. Nog niet: zien of je een bewaard rondje al gelopen hebt.
- Getest: unit (netwerk.test.js), echte Utrecht-data, end-to-end in de gebouwde app met echte Overpass, migratie op een kopie van de productiedatabase (4 → 6, data intact).

## Beslissingen (2026-11-01)
- **Geen BRouter**: Fits routeert zelf over het OSM-wegennet dat het toch al ophaalt voor de dekking. Geen extra service, docker-compose.yml blijft ongemoeid. BRouter kan later alsnog als het beter moet (hoogte, ondergrond).
- **nginx `client_max_body_size 2m`**: niet aangepast (buiten de repo); de browser pakt uploads in en stuurt ze in porties.
- **Overpass**: publieke servers zijn wisselend vol; Fits vraagt er twee tegelijk, met tijdslimieten onder de 60 s van nginx. Betrouwbaarder: eigen Overpass of een OSM-extract (Geofabrik) op de server.

## Wacht op
- Strava-export van Pieter: te groot om via de chat te sturen. Alleen `activities/` en `activities.csv` zijn nodig; naar de server kopiëren (scp/rsync) naar `~/repos/fits/data/strava-export/`, dan importeren met `FITS_SPOREN` op die map.
- Antwoorden op de open vragen in SPEC.md.
