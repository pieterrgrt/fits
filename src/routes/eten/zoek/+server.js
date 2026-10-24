import { json } from '@sveltejs/kit';
import { zoekLokaal, zoekOnline } from '#lib/server/eten.js';

// Zoeken voor de toevoegpagina. ?online=1 vraagt ook Open Food Facts (zuinig gebruiken).
export const GET = async ({ url, locals }) => {
	const q = (url.searchParams.get('q') ?? '').trim().slice(0, 80);
	if (q.length < 2) return json({ lokaal: [], online: [] });
	const lokaal = zoekLokaal(locals.gebruiker.id, q);
	if (!url.searchParams.has('online')) return json({ lokaal, online: null });
	try {
		const bekend = new Set(lokaal.map((p) => p.id));
		const online = (await zoekOnline(q)).filter((p) => !bekend.has(p.id));
		return json({ lokaal, online });
	} catch (e) {
		return json({ lokaal, online: [], fout: e.name === 'TimeoutError' ? 'Open Food Facts reageert niet. Probeer het zo nog eens.' : e.message });
	}
};
