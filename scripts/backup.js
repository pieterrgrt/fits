// Maakt een veilige kopie van de database (ook terwijl de app draait).
// Op de server: docker compose exec web node scripts/backup.js
// Lokaal:       node scripts/backup.js
import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

const map = process.env.FITS_DATA ?? path.resolve('data');
const doel = path.join(map, 'backups');
fs.mkdirSync(doel, { recursive: true });
const stempel = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
const bestand = path.join(doel, `fits-${stempel}.db`);

const db = new Database(path.join(map, 'fits.db'), { readonly: true });
await db.backup(bestand);
db.close();

// Alleen de laatste 30 bewaren.
const oud = fs.readdirSync(doel).filter((f) => f.startsWith('fits-') && f.endsWith('.db')).sort().slice(0, -30);
for (const f of oud) fs.unlinkSync(path.join(doel, f));
console.log(`Back-up gemaakt: ${bestand}`);
