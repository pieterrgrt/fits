/*
  Voortgangsfoto's. Ze staan alleen op je eigen server: <FITS_DATA>/fotos/<gebruiker>/<willekeurige naam>.jpg.
  De database weet welke foto bij welke datum en kant hoort; de bestanden zijn alleen te zien als je bent ingelogd
  (src/routes/fotos/[id]/+server.js).
*/
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { map, een, alle, doe } from './db.js';

export const KANTEN = ['voor', 'zij', 'achter'];
export const MAX_GROOTTE = 8 * 1024 * 1024;

const mapVan = (gebruikerId) => path.join(map, 'fotos', String(gebruikerId));

/** Alleen JPEG, PNG of WebP (op de inhoud gecontroleerd, niet op de naam). */
function soort(buf) {
	if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg';
	if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
	if (buf.subarray(0, 4).toString() === 'RIFF' && buf.subarray(8, 12).toString() === 'WEBP') return 'webp';
	return null;
}

export const TYPES = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };

export function bewaar(gebruikerId, datum, kant, buf) {
	const ext = soort(buf);
	if (!ext) return { fout: 'Dit is geen foto (JPEG, PNG of WebP).' };
	if (buf.length > MAX_GROOTTE) return { fout: 'Deze foto is te groot.' };
	const dir = mapVan(gebruikerId);
	fs.mkdirSync(dir, { recursive: true });
	const bestand = `${crypto.randomBytes(16).toString('hex')}.${ext}`;
	fs.writeFileSync(path.join(dir, bestand), buf);
	// Eén foto per datum en kant: een nieuwe vervangt de oude.
	const oud = een('SELECT id FROM fotos WHERE gebruiker_id = ? AND datum = ? AND kant = ?', gebruikerId, datum, kant);
	if (oud) verwijder(gebruikerId, oud.id);
	doe('INSERT INTO fotos (gebruiker_id, datum, kant, bestand) VALUES (?, ?, ?, ?)', gebruikerId, datum, kant, bestand);
	return { ok: true };
}

export function pad(gebruikerId, id) {
	const f = een('SELECT bestand FROM fotos WHERE id = ? AND gebruiker_id = ?', id, gebruikerId);
	if (!f || !/^[0-9a-f]{32}\.(jpg|png|webp)$/.test(f.bestand)) return null;
	return { pad: path.join(mapVan(gebruikerId), f.bestand), type: TYPES[f.bestand.split('.').pop()] };
}

export function verwijder(gebruikerId, id) {
	const p = pad(gebruikerId, id);
	if (p) fs.rmSync(p.pad, { force: true });
	doe('DELETE FROM fotos WHERE id = ? AND gebruiker_id = ?', id, gebruikerId);
}

/** Bij het verwijderen van een account: alle bestanden weg (de rijen gaan mee met de gebruiker). */
export const verwijderAlles = (gebruikerId) => fs.rmSync(mapVan(gebruikerId), { recursive: true, force: true });

/** Per datum (nieuwste eerst): { datum, voor, zij, achter } met foto-id's. */
export function reeksen(gebruikerId) {
	const perDatum = new Map();
	for (const f of alle('SELECT id, datum, kant FROM fotos WHERE gebruiker_id = ? ORDER BY datum DESC', gebruikerId)) {
		if (!perDatum.has(f.datum)) perDatum.set(f.datum, { datum: f.datum });
		perDatum.get(f.datum)[f.kant] = f.id;
	}
	return [...perDatum.values()];
}
