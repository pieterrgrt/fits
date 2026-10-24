import crypto from 'node:crypto';
import { promisify } from 'node:util';
import { een, alle, doe } from './db.js';

const scrypt = promisify(crypto.scrypt);
const SCRYPT = { N: 2 ** 15, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

export const COOKIE = 'fits_sessie';
const LOOPTIJD = 1000 * 60 * 60 * 24 * 60; // 60 dagen, verlengd bij gebruik

/* ---------- Wachtwoorden ---------- */

export async function hash(wachtwoord) {
	const zout = crypto.randomBytes(16);
	const sleutel = await scrypt(wachtwoord.normalize('NFKC'), zout, 64, SCRYPT);
	return `scrypt$${SCRYPT.N}$${zout.toString('base64')}$${sleutel.toString('base64')}`;
}

export async function klopt(wachtwoord, opgeslagen) {
	const [soort, n, zout, sleutel] = (opgeslagen ?? '').split('$');
	if (soort !== 'scrypt') return false;
	const verwacht = Buffer.from(sleutel, 'base64');
	const echt = await scrypt(wachtwoord.normalize('NFKC'), Buffer.from(zout, 'base64'), verwacht.length, { ...SCRYPT, N: Number(n) });
	return crypto.timingSafeEqual(verwacht, echt);
}

export function wachtwoordProbleem(w) {
	if (typeof w !== 'string' || w.length < 10) return 'Kies een wachtwoord van minstens 10 tekens.';
	if (w.length > 200) return 'Dat wachtwoord is te lang.';
	return null;
}

// Om tijdsverschil tussen "bestaat niet" en "fout wachtwoord" te verbergen.
let NEP_HASH;
export async function nepControle(w) {
	NEP_HASH ??= await hash('niet-bestaand-account');
	await klopt(w, NEP_HASH);
	return false;
}

/* ---------- Sessies ---------- */

const sha = (t) => crypto.createHash('sha256').update(t).digest('hex');

export function maakSessie(gebruikerId, apparaat) {
	const token = crypto.randomBytes(32).toString('base64url');
	doe('INSERT INTO sessies (id, gebruiker_id, verloopt, apparaat) VALUES (?, ?, ?, ?)', sha(token), gebruikerId, Date.now() + LOOPTIJD, (apparaat ?? '').slice(0, 200));
	return token;
}

export function leesSessie(token) {
	if (!token) return null;
	const id = sha(token);
	const rij = een(
		`SELECT s.id AS sessie_id, s.verloopt, g.id, g.email, g.naam, g.rol, g.gewicht, g.onderhoud, g.stang
		 FROM sessies s JOIN gebruikers g ON g.id = s.gebruiker_id WHERE s.id = ?`,
		id
	);
	if (!rij) return null;
	if (rij.verloopt < Date.now()) {
		doe('DELETE FROM sessies WHERE id = ?', id);
		return null;
	}
	// Verlengen, maar niet bij elk verzoek naar de database schrijven.
	if (rij.verloopt - Date.now() < LOOPTIJD - 1000 * 60 * 60) {
		doe("UPDATE sessies SET verloopt = ?, laatst = datetime('now') WHERE id = ?", Date.now() + LOOPTIJD, id);
	}
	const { verloopt, ...gebruiker } = rij;
	return gebruiker;
}

export const stopSessie = (token) => token && doe('DELETE FROM sessies WHERE id = ?', sha(token));
export const sessiesVan = (gebruikerId) =>
	alle('SELECT id, apparaat, gemaakt, laatst FROM sessies WHERE gebruiker_id = ? ORDER BY laatst DESC', gebruikerId);

export const cookieOpties = (veilig) => ({
	path: '/',
	httpOnly: true,
	sameSite: 'lax',
	secure: veilig,
	maxAge: LOOPTIJD / 1000
});

/* ---------- Te veel pogingen ---------- */

const pogingen = new Map();
export function teVeel(sleutel, max = 8, venster = 15 * 60 * 1000) {
	const nu = Date.now();
	const lijst = (pogingen.get(sleutel) ?? []).filter((t) => nu - t < venster);
	pogingen.set(sleutel, lijst);
	return lijst.length >= max;
}
export const telPoging = (sleutel) => pogingen.set(sleutel, [...(pogingen.get(sleutel) ?? []), Date.now()]);
export const wisPogingen = (sleutel) => pogingen.delete(sleutel);

/* ---------- Uitnodigingen ---------- */

export function maakUitnodiging(doorId, dagen = 14) {
	const code = crypto.randomBytes(6).toString('base64url').toUpperCase().replace(/[^A-Z0-9]/g, 'X').slice(0, 8);
	doe("INSERT INTO uitnodigingen (code, gemaakt_door, verloopt) VALUES (?, ?, datetime('now', ?))", code, doorId, `+${dagen} days`);
	return code;
}
