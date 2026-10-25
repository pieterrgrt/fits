import { json } from '@sveltejs/kit';
import * as data from '#lib/server/data.js';
import * as eten from '#lib/server/eten.js';
import { doelenVan } from '#lib/server/etendoelen.js';
import { gebruikerBijSleutel } from '#lib/server/sleutels.js';
import { teVeel, telPoging } from '#lib/server/auth.js';
import { vandaag, weekdag, plusDagen } from '#lib/datum.js';
import { widget } from '#lib/widget.js';

/*
  Klein overzicht voor de widget op je iPhone (Scriptable).
  Header:  Authorization: Bearer fits_…   (dezelfde soort sleutel als voor Apple Gezondheid: Meer → Apple Gezondheid)
*/
export const GET = ({ request, getClientAddress }) => {
	const ip = getClientAddress();
	if (teVeel(`api|${ip}`, 30)) return json({ fout: 'Te veel verzoeken.' }, { status: 429 });
	const sleutel = (request.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '').trim();
	const id = gebruikerBijSleutel(sleutel);
	if (!id) {
		telPoging(`api|${ip}`);
		return json({ fout: 'Onbekende sleutel.' }, { status: 401 });
	}
	const d = vandaag();
	const uit = widget({
		datum: d,
		dag: data.dag(id, weekdag(d)),
		morgen: data.dag(id, weekdag(plusDagen(d, 1))),
		weekschema: data.dagen(id),
		week: data.week(id, d),
		open: data.openTraining(id),
		dagregel: data.dagregel(id, d),
		eten: eten.dag(id, d).totaal,
		doelen: doelenVan(id)
	});
	return json(uit, { headers: { 'Cache-Control': 'no-store' } });
};
