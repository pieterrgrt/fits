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
- [ ] Fase 2 — kaart
- [ ] Fase 3 — straten die je kent
- [ ] Fase 4 — ontdekrondjes (BRouter)
- [ ] Fase 5 — routes leren

## Wacht op
- Strava-export van Pieter: te groot om via de chat te sturen. Alleen `activities/` en `activities.csv` zijn nodig; naar de server kopiëren (scp/rsync) naar `~/repos/fits/data/strava-export/`, dan importeren met `FITS_SPOREN` op die map.
- Antwoorden op de open vragen in SPEC.md.
