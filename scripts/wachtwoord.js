// Nieuw wachtwoord zetten vanaf de server, als je niet meer kunt inloggen.
// docker compose exec web node scripts/wachtwoord.js jij@example.com 'nieuw-wachtwoord'
import Database from 'better-sqlite3';
import crypto from 'node:crypto';
import path from 'node:path';

const [email, wachtwoord] = process.argv.slice(2);
if (!email || !wachtwoord || wachtwoord.length < 10) {
	console.error('Gebruik: node scripts/wachtwoord.js <e-mail> <wachtwoord van minstens 10 tekens>');
	process.exit(1);
}
// Zelfde opslag als src/lib/server/auth.js
const N = 2 ** 15;
const zout = crypto.randomBytes(16);
const sleutel = crypto.scryptSync(wachtwoord.normalize('NFKC'), zout, 64, { N, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
const hash = `scrypt$${N}$${zout.toString('base64')}$${sleutel.toString('base64')}`;

const db = new Database(path.join(process.env.FITS_DATA ?? path.resolve('data'), 'fits.db'));
const g = db.prepare('SELECT id FROM gebruikers WHERE email = ? COLLATE NOCASE').get(email);
if (!g) {
	console.error(`Geen account met ${email}.`);
	process.exit(1);
}
db.prepare('UPDATE gebruikers SET wachtwoord = ? WHERE id = ?').run(hash, g.id);
db.prepare('DELETE FROM sessies WHERE gebruiker_id = ?').run(g.id);
console.log(`Wachtwoord gewijzigd voor ${email}. Alle apparaten zijn uitgelogd.`);
