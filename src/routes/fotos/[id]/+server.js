import fs from 'node:fs';
import { error } from '@sveltejs/kit';
import { pad } from '#lib/server/fotos.js';

// Een foto, alleen voor de eigenaar. Bestandsnamen veranderen bij een nieuwe foto, dus lang bewaren mag.
export function GET({ locals, params }) {
	const f = locals.gebruiker && pad(locals.gebruiker.id, Number(params.id));
	if (!f || !fs.existsSync(f.pad)) error(404, 'Foto niet gevonden.');
	return new Response(fs.readFileSync(f.pad), {
		headers: { 'content-type': f.type, 'cache-control': 'private, max-age=31536000, immutable' }
	});
}
