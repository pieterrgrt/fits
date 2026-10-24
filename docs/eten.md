# Eten

Het eetdagboek doet wat Lifesum doet, met de doelen uit je schema: eiwit 1,8–2 g per kg, +300–500 kcal boven onderhoud.

| Wat | Waar |
| --- | --- |
| Dagboek per maaltijd (ontbijt, lunch, avondeten, tussendoor), dag vooruit/terug | `/eten` |
| Calorie-ring ("nog 1.240 kcal"), eiwit, koolhydraten, vet | `/eten` |
| Zoeken, barcode scannen, recent, favorieten, eigen producten, snel toevoegen | `+` bij een maaltijd |
| Portie kiezen (gram, of de portie van het product: snee, stuk, schaaltje…) | productpagina |
| Vaste maaltijden ("Bewaar als maaltijd") en recepten met porties | `/eten/maaltijden` |
| Zelfde als gisteren | knop bij een lege maaltijd |
| Water (glazen van 250 ml) en vasten (12:12, 14:10, 16:8) | `/eten` |
| Doelen: gewicht, onderhoud, eigen caloriedoel, vetpercentage, water | `/eten/doelen` |
| Weekoverzicht, gewichtsverloop, slaap per nacht | `/voeding` |

## Waar de producten vandaan komen

1. **Basislijst** (`src/lib/server/basisvoeding.js`): ±130 gewone producten (brood, zuivel, vlees, vis, groente, fruit, noten, sportvoeding…) met richtwaarden per 100 g. Werkt altijd, ook offline. Aanvullen = een regel toevoegen; bij de volgende start staat hij in de database.
2. **Open Food Facts** (<https://nl.openfoodfacts.org>): een open database met merkproducten en barcodes, gevuld door vrijwilligers. Geen account of sleutel nodig. Fits zoekt pas online als je op *Zoek in merkproducten* tikt (zij staan ongeveer 10 zoekopdrachten per minuut toe) en bewaart wat het vindt, zodat je het daarna meteen lokaal vindt. Barcodes worden 30 dagen onthouden.
3. **Eigen producten**: zelf invoeren van het etiket. Met barcode herkent de scanner hem daarna.

Het dagboek bewaart de voedingswaarden op het moment dat je iets toevoegt. Verandert een product later, dan blijft je dagboek kloppen.

## Barcode scannen

De camera gebruikt de ingebouwde barcodelezer van de browser waar die er is (Android). Op de iPhone neemt [ZXing](https://github.com/zxing-cpp/zxing-cpp) het over, als WebAssembly die met Fits wordt meegeleverd: er wordt niets van een andere site geladen. Lukt de camera niet, dan kun je de cijfers onder de barcode intypen.

## Instellingen op de server

Niets nodig. Wil je een andere Open Food Facts-server (bijvoorbeeld de wereldwijde), zet dan `OFF_URL=https://world.openfoodfacts.org` in `.env`.
