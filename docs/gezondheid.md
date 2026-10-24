# Slaap uit Apple Gezondheid

Apple Gezondheid heeft geen koppeling voor websites; alleen apps op de iPhone kunnen erbij. Daarom stuurt een **opdracht** (app *Opdrachten*, Engels *Shortcuts*) elke ochtend je slaap naar Fits. De volledige stappen, met jouw adres en een kopieerknop, staan in de app: **Meer → Apple Gezondheid** (`/gezondheid`).

In het kort:

1. Maak in Fits een persoonlijke sleutel. Die kan alleen slaap en gewicht doorgeven.
2. Maak in Opdrachten: *Zoek gezondheidsvoorbeelden* (Slaapanalyse, einddatum in de afgelopen 18 uur) → *Herhaal met elk* → *Tekst* `Startdatum|Einddatum|Waarde` (datums als ISO 8601) → *Combineer tekst* (nieuwe regel) → *Haal inhoud van URL op* (POST naar `/api/gezondheid`, header `Authorization: Bearer <sleutel>`, JSON-veld `slaap`).
3. Automatisering: elke ochtend (of als de wekker uitgaat), *Voer direct uit*.

## Wat Fits ermee doet

- Alleen echte slaap telt (kern, diep, REM, of "slapend" op oudere apparaten); *in bed* en *wakker* niet.
- Metingen die elkaar overlappen (iPhone én Watch) tellen één keer.
- Stukken met minder dan 2 uur ertussen horen bij dezelfde nacht; de laatste nacht telt. De datum is de dag waarop je wakker werd, en komt in de dagregel als "slaap vannacht".
- Per nacht bewaart Fits ook de fasen (diep, kern, REM, wakker). Zie Overzicht eten en slaap.
- Pas je de slaap in de dagregel zelf aan, dan is die waarde van jou.

## Het adres

`POST /api/gezondheid`, header `Authorization: Bearer fits_…`, JSON:

| Veld | Wat |
| --- | --- |
| `slaap` | slaapmetingen, één per regel: `start|eind|waarde` (ISO 8601) |
| `slaap_uren` + `datum` | of alleen het totaal, bv. `7.5` en `2026-10-24` |
| `gewicht` | optioneel, in kg |

Antwoord: `{ ok, slaap: { datum, uren, fasen }, gewicht, bericht }`. `bericht` is handig voor een melding op je iPhone.
