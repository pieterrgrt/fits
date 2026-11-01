import { error } from '@sveltejs/kit';
import { een } from '#lib/server/db.js';
import { decodeer, schrijfGpx } from '#lib/spoor.js';

// GET /hardlopen/routes/<id>: een bewaard rondje als GPX, voor je horloge of een navigatie-app.
export const GET = ({ locals, params }) => {
	const r = een('SELECT naam, lijn FROM routes WHERE id = ? AND gebruiker_id = ?', Number(params.id), locals.gebruiker.id);
	if (!r) error(404, 'Onbekend rondje');
	const bestand = r.naam.replace(/[^\p{L}\p{N} _-]/gu, '').trim().replace(/\s+/g, '-') || 'rondje';
	const ascii = bestand.normalize('NFKD').replace(/[^\x20-\x7e]/g, '') || 'rondje';
	return new Response(schrijfGpx(r.naam, decodeer(r.lijn)), {
		headers: { 'content-type': 'application/gpx+xml', 'content-disposition': `attachment; filename="${ascii}.gpx"; filename*=UTF-8''${encodeURIComponent(bestand)}.gpx` }
	});
};
