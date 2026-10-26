# Designsysteem: IJzer

Fits valt onder alduslab.eu, maar heeft een eigen merk. Aldus is een leessite: wit papier, blauw, een serif. Fits is een app die je met bezwete handen tussen twee sets gebruikt. Daarom een ander systeem: donker, groot, één felle kleur.

> Donker als een sportschool om zes uur 's ochtends. Eén felle kleur voor alles wat vooruitgang is.

Het hele systeem staat ook als pagina in de app: **`/ontwerp`** (open zonder inloggen), met een schakelaar voor donker en licht.

## Merk

- **Beeldmerk:** een kleine *f* waarvan de dwarsbalk een geladen halterstang is (twee schijven per kant), 8° schuin voor beweging, op een volt vierkant met afgeronde hoeken. Bestanden in `static/merk/`; als component `src/lib/Beeldmerk.svelte`.
- **Woordmerk:** "fits" in Archivo Black, breed (112%), kleine letters, zelfde helling. `src/lib/Woordmerk.svelte`.
- **Regels:** vrije ruimte rondom minstens een kwart van de breedte; niet kleiner dan 16 px; alleen in volt, inkt (`#0c0d10`) of wit; niet draaien of uitrekken.
- **App-iconen:** `icoon-192.png`, `icoon-512.png`, `icoon-maskable-512.png` (Android). Voor de iPhone (`apple-touch-icon.png`, uit `fits-ios.svg`) is het omgekeerd: een donkere tegel (`#0c0d10`) met een volt *f*. iOS maakt in de donkere modus de achtergrond van een web-app-icoon zwart en kan geen apart donker icoon krijgen; zo blijft de *f* in beide modi zichtbaar. `fits-beeldmerk-donker.svg` is dezelfde variant met afgeronde hoeken. Opnieuw maken uit de SVG's kan met elke SVG-naar-PNG-tool.

## Kleur

Vier pijlers, elk een eigen kleur. Groei = gym + eten + slaap; cardio is extra.

| Pijler | Token | Waarde | Gebruik |
| --- | --- | --- | --- |
| Volt | `--volt` | `#d7ff3a` | gym, voortgang, primaire knop, werkende spieren in figuren |
| Amber | `--amber` | `#ffc24a` | eten: eiwit, calorieën |
| Lila | `--lila` | `#a99bff` | slaap en herstel |
| Koraal | `--koraal` | `#ff6b4a` | cardio, Strava |

Daarnaast `--water` (`#5ab4ff`) voor water in het eetdagboek.

Basis: ijzergrijzen (`--ijzer-0` t/m `5`) en krijtwit (`--krijt-1` t/m `3`). Componenten gebruiken alleen **rollen**: `--achtergrond`, `--vlak`, `--vlak-hoog`, `--lijn`, `--lijn-sterk`, `--tekst`, `--tekst-rustig`, `--tekst-gedempt`, `--accent`, `--op-accent`. Zo werkt licht en donker vanzelf.

- Donker is de standaard; licht volgt de systeeminstelling (of `data-thema="licht"` op `<html>`).
- In licht wordt volt als *tekstkleur* olijfgroen (`--volt-tekst: #4a6600`) en in figuren, ringen en grafieken iets dieper (`--grafiek: #93c400`); volle volt-vlakken (knoppen) houden donkere tekst.

## Letter

- **Display: Archivo** (variabel, zelf gehost via `@fontsource-variable/archivo`). Koppen: 800, smal (`font-stretch: 72%`), hoofdletters. Cijfers (gewichten, timer, stats): 800, breed (118%), tabular.
- **Tekst: Inter** (variabel). 16 px, regelafstand 1,5. Labels 12 px, hoofdletters, spatiëring 0,08 em.
- Schaal: `--maat-xs` 12 · `s` 14 · `m` 16 · `l` 20 · `xl` 28 · `2xl` 40 · `3xl` 60 · `4xl` 88.

## Ruimte, vorm, beweging

- Ruimte in stappen van 4 px: `--r-1` (4) t/m `--r-8` (64).
- Hoeken: `--hoek-s` 6, `-m` 12, `-l` 20 (kaarten), `-rond` (knoppen, chips).
- Aanraakvlakken minstens 44 px; de reps-stepper en de set-knop zijn 46 px hoog.
- Beweging: 120 / 200 / 360 ms, curve `--veer`. Bij *liever geen beweging* staat alles stil en tonen figuren begin- en eindstand tegelijk.
- Pagina-overgangen via de View Transitions API (`src/routes/+layout.svelte`, stijl onderin `fits.css`): dieper of een tab naar rechts schuift de nieuwe pagina van rechts in, terug van links, een andere dag in Eten ook. Bovenbalk en tabbalk blijven staan; het pilletje in de tabbalk schuift naar de gekozen tab. Duurt het laden even, dan loopt bovenin een volt laadbalk.
- Binnen een pagina: `src/lib/beweging.js` (`glijd`, `verschijn`, `vervaag`, `paneel`) voor uitklappen, panelen en lijstregels; meldingen, balken en ringen bewegen vanzelf in.
- Formulieren die doorverwijzen gebruiken `use:verzend` (`src/lib/verzend.js`): geen herlaadflits, een draaiertje in de knop, en `bevestig` vraagt eerst. Gebruik geen `onsubmit` met `preventDefault` naast `use:enhance`: enhance verstuurt dan toch.

## Onderdelen

Alle klassen staan in `src/lib/design/fits.css`:

| Klasse | Wat |
| --- | --- |
| `.kaart` (`.hoog`, `.vol`) | vlak met rand en schaduw; `.vol` = volt |
| `.knop` (`.primair`, `.omlijnd`, `.stil`, `.gevaar`, `.groot`, `.klein`, `.vierkant`, `.vol-breed`) | knoppen |
| `.chip` (`.volt`, `.amber`, `.lila`, `.koraal`, `.omlijnd`) | label of filter; `aria-pressed="true"` = gekozen |
| `.veld`, `.invoer`, `.vinkje` | formulieren |
| `.stepper` | − getal + voor reps |
| `.stat` (`.waarde`) | groot cijfer met label |
| `.balk` (`--waarde`, `--balk-kleur`) | voortgangsbalk |
| `.melding` (`.amber`, `.lila`, `.fout`) | korte boodschap |
| `.tabbalk` | navigatie onderin |
| `.label`, `.rustig`, `.gedempt`, `.klein`, `.tnum`, `.display`, `.groot-cijfer` | tekststijlen |
| `.stapel`, `.rij`, `.raster` (`.twee`, `.drie`, `.vier`) | indeling |

Svelte-componenten: `Icoon` (eigen set van 24 iconen), `Ring` (pijlerring), `Beeldmerk`, `Woordmerk`, `Spierkaart`, `Verloop` (grafiek), `Figuur`.

## Bewegende figuren

Elke oefening wordt voorgedaan door een pictogram-figuur in plaats van een video of foto. Eén stijl, licht van gewicht, werkt in donker en licht.

- Een animatie is twee houdingen (`a` en `b`) plus apparatuur (`props`), in `src/lib/oefeningen.js`.
- Een houding geeft de heup, de hoek van de romp en per arm/been hoeken, of een **doelpunt** voor hand of enkel (een handvat, een plateau). De engine (`src/lib/figuur/figuur.js`) rekent dan zelf elleboog en knie uit (inverse kinematica).
- Aanzicht `zij` (achterste ledematen lichter) of `voor` (gespiegeld).
- `accent` kleurt de delen die werken volt. Het balkje onder de figuur volgt de fase (bv. *zakken* → *drukken*) in het tempo van de oefening.
- Nieuwe oefening? Kopieer een vergelijkbare animatie, pas de doelpunten aan en kijk op `/oefeningen/<slug>`.

## Toon

Kort, direct, je-vorm, zoals een goede trainer. Concreet ("Volgende keer 52,5 kg"), en zeg wat normaal is ("Reps zakken terug naar 8. Dat is de bedoeling."). Geen uitroeptekens, geen badges of confetti, geen schuldgevoel. Oefeningnamen blijven zoals ze in de gym heten.
