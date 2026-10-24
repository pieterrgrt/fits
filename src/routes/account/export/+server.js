import { een, alle } from '#lib/server/db.js';
import { vandaag } from '#lib/datum.js';

// Al je gegevens als één JSON-bestand. Wachtwoord en Strava-sleutels gaan niet mee.
export const GET = ({ locals }) => {
	const g = locals.gebruiker.id;
	const inhoud = {
		gemaakt: new Date().toISOString(),
		gebruiker: een('SELECT naam, email, gewicht, onderhoud, gemaakt FROM gebruikers WHERE id = ?', g),
		schema: alle('SELECT * FROM dagen WHERE gebruiker_id = ?', g).map((d) => ({ ...d, items: alle('SELECT * FROM items WHERE dag_id = ? ORDER BY positie', d.id) })),
		trainingen: alle('SELECT * FROM trainingen WHERE gebruiker_id = ? ORDER BY datum', g).map((t) => ({ ...t, sets: alle('SELECT slug, nr, gewicht, eenheid, per_stuk, reps, rir FROM sets WHERE training_id = ? ORDER BY id', t.id) })),
		wijzigingen: alle('SELECT w.* FROM wijzigingen w JOIN items i ON i.id = w.item_id JOIN dagen d ON d.id = i.dag_id WHERE d.gebruiker_id = ?', g),
		dagregels: alle('SELECT datum, slaap, slaap_bron, slaap_fasen, eiwit, kcal, gewicht, water FROM dagregels WHERE gebruiker_id = ? ORDER BY datum', g),
		eetdagboek: alle('SELECT datum, maaltijd, product_id, naam, hoeveelheid, portie, kcal, eiwit, koolh, vet, vezels, suiker FROM eetregels WHERE gebruiker_id = ? ORDER BY datum, id', g),
		eigenProducten: alle('SELECT * FROM producten WHERE gebruiker_id = ?', g),
		maaltijden: alle('SELECT naam, porties, items FROM maaltijden WHERE gebruiker_id = ?', g),
		vasten: alle('SELECT begin, eind, doel_uren FROM vasten WHERE gebruiker_id = ? ORDER BY begin', g),
		weekregels: alle('SELECT week, slaap, energie, gewicht, gemist, notitie FROM weekregels WHERE gebruiker_id = ? ORDER BY week', g),
		doelen: alle('SELECT soort, slug, gewicht, reps, aantal, tekst, start, deadline, behaald FROM doelen WHERE gebruiker_id = ?', g),
		activiteiten: alle('SELECT id, soort, naam, datum, begin, duur, afstand, hartslag, hoogte FROM activiteiten WHERE gebruiker_id = ? ORDER BY begin', g)
	};
	return new Response(JSON.stringify(inhoud, null, 2), {
		headers: { 'content-type': 'application/json', 'content-disposition': `attachment; filename="fits-${vandaag()}.json"` }
	});
};
