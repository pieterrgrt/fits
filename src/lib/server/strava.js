/*
  Strava-koppeling (OAuth 2). Fits leest je activiteiten (hardlopen, zwemmen, fietsen) voor
  de cardio-teller en kan een gymsessie als "Weight Training" op Strava zetten.
  Instellen: docs/strava.md.
*/
import { STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET } from '$app/env/private';
import { een, doe, transactie } from './db.js';
import { vandaag, plusDagen } from '#lib/datum.js';

const API = 'https://www.strava.com/api/v3';
export const stravaAan = () => Boolean(STRAVA_CLIENT_ID && STRAVA_CLIENT_SECRET);
export const stravaVan = (gebruikerId) => een('SELECT * FROM strava WHERE gebruiker_id = ?', gebruikerId);

export function autorisatieUrl(terugUrl, state, schrijven) {
	const scope = ['read', 'activity:read_all', ...(schrijven ? ['activity:write'] : [])].join(',');
	const p = new URLSearchParams({ client_id: STRAVA_CLIENT_ID, redirect_uri: terugUrl, response_type: 'code', approval_prompt: 'auto', scope, state });
	return `https://www.strava.com/oauth/authorize?${p}`;
}

async function tokenAanvraag(body) {
	const r = await fetch('https://www.strava.com/oauth/token', {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({ client_id: STRAVA_CLIENT_ID, client_secret: STRAVA_CLIENT_SECRET, ...body })
	});
	if (!r.ok) throw new Error(`Strava weigerde de koppeling (${r.status}).`);
	return r.json();
}

export async function koppel(gebruikerId, code, scope) {
	const t = await tokenAanvraag({ code, grant_type: 'authorization_code' });
	const naam = [t.athlete?.firstname, t.athlete?.lastname].filter(Boolean).join(' ');
	doe(
		`INSERT INTO strava (gebruiker_id, atleet_id, naam, access_token, refresh_token, verloopt, scope) VALUES (?, ?, ?, ?, ?, ?, ?)
		 ON CONFLICT (gebruiker_id) DO UPDATE SET atleet_id = excluded.atleet_id, naam = excluded.naam, access_token = excluded.access_token,
		 refresh_token = excluded.refresh_token, verloopt = excluded.verloopt, scope = excluded.scope`,
		gebruikerId, String(t.athlete?.id ?? ''), naam, t.access_token, t.refresh_token, t.expires_at, scope ?? ''
	);
}

async function token(gebruikerId) {
	const s = stravaVan(gebruikerId);
	if (!s) throw new Error('Strava is niet gekoppeld.');
	if (s.verloopt - 120 > Date.now() / 1000) return s.access_token;
	const t = await tokenAanvraag({ grant_type: 'refresh_token', refresh_token: s.refresh_token });
	doe('UPDATE strava SET access_token = ?, refresh_token = ?, verloopt = ? WHERE gebruiker_id = ?', t.access_token, t.refresh_token, t.expires_at, gebruikerId);
	return t.access_token;
}

async function api(gebruikerId, pad, opties = {}) {
	const r = await fetch(API + pad, { ...opties, headers: { authorization: `Bearer ${await token(gebruikerId)}`, ...(opties.headers ?? {}) } });
	if (r.status === 429) throw new Error('Strava vraagt even rustig aan te doen (te veel verzoeken). Probeer het over een kwartier.');
	if (r.status === 401) throw new Error('Strava geeft geen toegang meer. Koppel opnieuw via Account.');
	if (!r.ok) throw new Error(`Strava gaf een fout (${r.status}).`);
	return r.json();
}

/** Haalt activiteiten van de afgelopen weken op. Standaard alleen wat er sinds de vorige keer bij kwam. */
export async function sync(gebruikerId, { dagen = 56 } = {}) {
	const s = stravaVan(gebruikerId);
	const vanaf = s?.laatst_gesynct ? plusDagen(s.laatst_gesynct.slice(0, 10), -3) : plusDagen(vandaag(), -dagen);
	const na = Math.floor(new Date(vanaf + 'T00:00:00Z').getTime() / 1000);
	let pagina = 1;
	let aantal = 0;
	for (;;) {
		const lijst = await api(gebruikerId, `/athlete/activities?after=${na}&per_page=100&page=${pagina}`);
		transactie(() => {
			for (const a of lijst) {
				// Onze eigen geplaatste gymsessies niet als cardio meetellen.
				if (een('SELECT 1 FROM trainingen WHERE strava_id = ?', String(a.id))) continue;
				doe(
					`INSERT INTO activiteiten (id, gebruiker_id, soort, naam, datum, begin, duur, afstand, hartslag, hoogte) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
					 ON CONFLICT (id) DO UPDATE SET soort = excluded.soort, naam = excluded.naam, duur = excluded.duur, afstand = excluded.afstand, hartslag = excluded.hartslag, hoogte = excluded.hoogte`,
					String(a.id), gebruikerId, a.sport_type ?? a.type, a.name, a.start_date_local.slice(0, 10), a.start_date_local,
					a.moving_time ?? null, a.distance ?? null, a.average_heartrate ?? null, a.total_elevation_gain ?? null
				);
				aantal++;
			}
		});
		if (lijst.length < 100 || pagina >= 5) break;
		pagina++;
	}
	doe("UPDATE strava SET laatst_gesynct = datetime('now') WHERE gebruiker_id = ?", gebruikerId);
	return aantal;
}

/** Zet een afgeronde gymsessie op Strava als handmatige activiteit. Geeft het Strava-id terug. */
export async function zetOpStrava(gebruikerId, training, beschrijving) {
	const s = stravaVan(gebruikerId);
	if (!(s?.scope ?? '').includes('activity:write')) throw new Error('Geef Fits eerst toestemming om activiteiten te plaatsen.');
	const begin = new Date(training.begin.replace(' ', 'T') + 'Z');
	const eind = training.eind ? new Date(training.eind.replace(' ', 'T') + 'Z') : new Date();
	const lokaal = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Amsterdam', dateStyle: 'short', timeStyle: 'medium' }).format(begin).replace(' ', 'T');
	const body = new URLSearchParams({
		name: `Fits · ${training.titel}`,
		sport_type: 'WeightTraining',
		type: 'WeightTraining',
		start_date_local: lokaal,
		elapsed_time: String(Math.max(60, Math.round((eind - begin) / 1000))),
		description: beschrijving
	});
	const a = await api(gebruikerId, '/activities', { method: 'POST', body, headers: { 'content-type': 'application/x-www-form-urlencoded' } });
	return a.id;
}

export async function ontkoppel(gebruikerId) {
	const s = stravaVan(gebruikerId);
	if (s) {
		try {
			await fetch('https://www.strava.com/oauth/deauthorize', { method: 'POST', body: new URLSearchParams({ access_token: s.access_token }) });
		} catch {}
	}
	transactie(() => {
		doe('DELETE FROM strava WHERE gebruiker_id = ?', gebruikerId);
		doe('DELETE FROM activiteiten WHERE gebruiker_id = ?', gebruikerId);
	});
}
