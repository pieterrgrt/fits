# Strava koppelen (optioneel)

Fits werkt ook zonder Strava: op **Cardio** voer je hardlopen, zwemmen of fietsen zelf in, en dat telt net zo mee. Laat je de sleutels hieronder leeg, dan staat Strava uit en zie je het nergens in de app.

Wil je toch koppelen: daarvoor heb je een (gratis) Strava-account nodig; een betaald abonnement is niet nodig.

Fits leest je activiteiten (hardlopen, zwemmen, fietsen) om je cardio per week te tellen en te waarschuwen bij cardio op de dag voor of na legs. Het kan ook een afgeronde gymsessie als *Weight Training* op Strava zetten, met je sets in de beschrijving.

## Eenmalig: een Strava API-applicatie

1. Ga naar <https://www.strava.com/settings/api> (ingelogd met je eigen Strava-account).
2. Vul in:
   - **Application Name:** Fits
   - **Category:** Training
   - **Website:** `https://fits.alduslab.eu`
   - **Authorization Callback Domain:** `fits.alduslab.eu` (lokaal testen: `localhost`)
3. Upload eventueel `static/merk/icoon-512.png` als icoon.
4. Je krijgt een **Client ID** en een **Client Secret**.

## Sleutels invullen

Op de server, in `~/fits/.env`:

```
STRAVA_CLIENT_ID=12345
STRAVA_CLIENT_SECRET=…
```

Daarna `docker compose up -d` (de container leest `.env` opnieuw). Lokaal: dezelfde regels in `.env` en `npm run dev` opnieuw starten.

## Koppelen

In de app: **Meer → Cardio → Verbinden met Strava** (of via Account). Strava vraagt toestemming om je activiteiten te lezen en (als je dat aanvinkt) te plaatsen. Ontkoppelen kan via Account; Fits trekt dan ook de toestemming bij Strava in en wist de opgehaalde activiteiten.

## Hoe het werkt

- Koppelen gaat via OAuth (`/strava/koppel` → Strava → `/strava/terug`). De tokens staan in de database en worden vanzelf vernieuwd.
- Bij het openen van Cardio haalt Fits hooguit één keer per uur nieuwe activiteiten op (de eerste keer 8 weken terug). Met *Bijwerken* kan het meteen.
- Strava staat 100 verzoeken per kwartier toe per app; voor één of een paar gebruikers is dat ruim genoeg.
- Gymsessies die Fits zelf op Strava zette, tellen niet mee als cardio.
