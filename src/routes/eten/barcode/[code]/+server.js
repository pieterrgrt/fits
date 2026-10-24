import { json } from '@sveltejs/kit';
import { viaBarcode } from '#lib/server/eten.js';

export const GET = async ({ params, locals }) => {
	try {
		const p = await viaBarcode(locals.gebruiker.id, params.code);
		return p ? json(p) : json({ niet: true }, { status: 404 });
	} catch {
		return json({ fout: 'Open Food Facts is nu niet bereikbaar.' }, { status: 502 });
	}
};
