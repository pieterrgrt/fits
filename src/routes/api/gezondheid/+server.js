import { json } from '@sveltejs/kit';
import { doe, een } from '#lib/server/db.js';
import { gebruikerBijSleutel } from '#lib/server/sleutels.js';
import { leesRegels, nacht } from '#lib/slaap.js';
import { teVeel, telPoging } from '#lib/server/auth.js';

/*
  Ontvangt gegevens uit Apple Gezondheid, verstuurd door een opdracht (Shortcut) op je iPhone.
  Header:  Authorization: Bearer fits_…   (maak de sleutel in Fits: Meer → Apple Gezondheid)
  JSON:    { "slaap": "<start>|<eind>|<waarde>\n…" }        slaapmetingen, één per regel
           { "slaap_uren": 7.5, "datum": "2026-10-24" }      of gewoon het totaal
           { "gewicht": 76.4 }                              optioneel, in kg
*/
export const POST = async ({ request, getClientAddress }) => {
	const ip = getClientAddress();
	if (teVeel(`api|${ip}`, 30)) return json({ fout: 'Te veel verzoeken.' }, { status: 429 });
	const sleutel = (request.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '').trim();
	const gebruikerId = gebruikerBijSleutel(sleutel);
	if (!gebruikerId) {
		telPoging(`api|${ip}`);
		return json({ fout: 'Onbekende sleutel. Maak er een in Fits: Meer → Apple Gezondheid.' }, { status: 401 });
	}

	let body;
	try {
		body = await request.json();
	} catch {
		return json({ fout: 'Stuur JSON (in de opdracht: Verzoeklichaam → JSON).' }, { status: 400 });
	}

	const uit = { ok: true };
	let n = null;
	if (typeof body.slaap === 'string' || Array.isArray(body.slaap)) {
		const tekst = Array.isArray(body.slaap) ? body.slaap.join('\n') : body.slaap;
		n = nacht(leesRegels(tekst.slice(0, 200_000)));
		if (!n) return json({ fout: 'Geen slaap gevonden in de metingen. Staat de datumnotatie op ISO 8601?' }, { status: 422 });
	} else if (body.slaap_uren != null) {
		const uren = Number(String(body.slaap_uren).replace(',', '.'));
		const datum = /^\d{4}-\d{2}-\d{2}$/.test(body.datum ?? '') ? body.datum : null;
		if (!(uren > 0 && uren < 20) || !datum) return json({ fout: 'slaap_uren (0–20) en datum (JJJJ-MM-DD) zijn nodig.' }, { status: 400 });
		n = { datum, minuten: Math.round(uren * 60), fasen: {} };
	}

	if (n) {
		const uren = Math.round((n.minuten / 60) * 10) / 10;
		doe(
			`INSERT INTO dagregels (gebruiker_id, datum, slaap, slaap_bron, slaap_fasen) VALUES (?, ?, ?, 'gezondheid', ?)
			 ON CONFLICT (gebruiker_id, datum) DO UPDATE SET slaap = excluded.slaap, slaap_bron = excluded.slaap_bron, slaap_fasen = excluded.slaap_fasen`,
			gebruikerId, n.datum, uren, JSON.stringify(n.fasen)
		);
		uit.slaap = { datum: n.datum, uren, fasen: n.fasen };
	}

	if (body.gewicht != null) {
		const kg = Number(String(body.gewicht).replace(',', '.'));
		if (kg > 25 && kg < 300) {
			const datum = /^\d{4}-\d{2}-\d{2}$/.test(body.datum ?? '') ? body.datum : n?.datum ?? new Date().toISOString().slice(0, 10);
			doe(
				`INSERT INTO dagregels (gebruiker_id, datum, gewicht) VALUES (?, ?, ?)
				 ON CONFLICT (gebruiker_id, datum) DO UPDATE SET gewicht = excluded.gewicht`,
				gebruikerId, datum, Math.round(kg * 10) / 10
			);
			uit.gewicht = Math.round(kg * 10) / 10;
		}
	}

	if (!uit.slaap && !uit.gewicht) return json({ fout: 'Niets ontvangen. Verwacht: slaap, slaap_uren of gewicht.' }, { status: 400 });
	uit.bericht = uit.slaap ? `Fits: ${String(uit.slaap.uren).replace('.', ',')} uur slaap op ${uit.slaap.datum}` : `Fits: gewicht ${uit.gewicht} kg`;
	return json(uit);
};
