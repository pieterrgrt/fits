import crypto from 'node:crypto';
import { een, alle, doe } from './db.js';

// Persoonlijke sleutels voor koppelingen zonder inloggen, zoals de Opdrachten-app op je iPhone.
const sha = (t) => crypto.createHash('sha256').update(t).digest('hex');

export function maakSleutel(gebruikerId, naam) {
	const sleutel = `fits_${crypto.randomBytes(24).toString('base64url')}`;
	doe('INSERT INTO sleutels (gebruiker_id, naam, hash, begin) VALUES (?, ?, ?, ?)', gebruikerId, naam, sha(sleutel), sleutel.slice(0, 9));
	return sleutel;
}

export const sleutelsVan = (gebruikerId) => alle('SELECT id, naam, begin, gemaakt, laatst FROM sleutels WHERE gebruiker_id = ? ORDER BY id DESC', gebruikerId);
export const trekIn = (gebruikerId, id) => doe('DELETE FROM sleutels WHERE id = ? AND gebruiker_id = ?', id, gebruikerId);

export function gebruikerBijSleutel(sleutel) {
	if (!sleutel?.startsWith('fits_')) return null;
	const s = een('SELECT id, gebruiker_id FROM sleutels WHERE hash = ?', sha(sleutel));
	if (!s) return null;
	doe("UPDATE sleutels SET laatst = datetime('now') WHERE id = ?", s.id);
	return s.gebruiker_id;
}
