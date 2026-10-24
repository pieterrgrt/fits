import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { FITS_DATA } from '$app/env/private';

// Eén SQLite-bestand. In Docker staat het op het volume /data (zie docker-compose.yml).
const map = FITS_DATA ?? path.resolve('data');
fs.mkdirSync(map, { recursive: true });

export const db = new Database(path.join(map, 'fits.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.pragma('busy_timeout = 3000');

/*
  Migraties: elke stap draait één keer, in volgorde. Nooit een bestaande stap wijzigen;
  voeg een nieuwe toe. user_version houdt bij hoe ver de database is.
*/
const MIGRATIES = [
	`
	CREATE TABLE gebruikers (
		id INTEGER PRIMARY KEY,
		email TEXT NOT NULL UNIQUE COLLATE NOCASE,
		naam TEXT NOT NULL,
		wachtwoord TEXT NOT NULL,
		rol TEXT NOT NULL DEFAULT 'lid',            -- 'beheerder' of 'lid'
		gewicht REAL,                                -- lichaamsgewicht in kg, voor eiwit en doelen
		onderhoud INTEGER,                           -- onderhoudscalorieën per dag
		gemaakt TEXT NOT NULL DEFAULT (datetime('now'))
	);

	CREATE TABLE sessies (
		id TEXT PRIMARY KEY,                         -- sha256 van het token in de cookie
		gebruiker_id INTEGER NOT NULL REFERENCES gebruikers(id) ON DELETE CASCADE,
		verloopt INTEGER NOT NULL,                   -- unix ms
		apparaat TEXT,
		gemaakt TEXT NOT NULL DEFAULT (datetime('now')),
		laatst TEXT NOT NULL DEFAULT (datetime('now'))
	);

	CREATE TABLE uitnodigingen (
		code TEXT PRIMARY KEY,
		gemaakt_door INTEGER REFERENCES gebruikers(id) ON DELETE SET NULL,
		gebruikt_door INTEGER REFERENCES gebruikers(id) ON DELETE SET NULL,
		verloopt TEXT NOT NULL,
		gemaakt TEXT NOT NULL DEFAULT (datetime('now'))
	);

	CREATE TABLE dagen (
		id INTEGER PRIMARY KEY,
		gebruiker_id INTEGER NOT NULL REFERENCES gebruikers(id) ON DELETE CASCADE,
		weekdag INTEGER NOT NULL,                    -- 1 = maandag … 7 = zondag
		code TEXT NOT NULL,                          -- 'push-a', 'rust', …
		titel TEXT NOT NULL,
		focus TEXT,
		soort TEXT NOT NULL DEFAULT 'gym',           -- 'gym' of 'rust'
		warmup TEXT,                                 -- JSON: { tekst, items: [{ slug, tekst }] }
		alternatief TEXT,
		UNIQUE (gebruiker_id, weekdag)
	);

	CREATE TABLE items (
		id INTEGER PRIMARY KEY,
		dag_id INTEGER NOT NULL REFERENCES dagen(id) ON DELETE CASCADE,
		positie INTEGER NOT NULL,
		slug TEXT,                                   -- oefening; leeg bij een wisselslot zonder keuze
		sets INTEGER NOT NULL,
		reps_min INTEGER NOT NULL,
		reps_max INTEGER NOT NULL,
		gewicht REAL,                                -- leeg = zoek gewicht
		per_stuk INTEGER NOT NULL DEFAULT 0,         -- 1 = dumbbells: gewicht per stuk
		eenheid TEXT NOT NULL DEFAULT 'kg',          -- 'kg' of 'lbs'
		sinds TEXT,                                  -- datum van de laatste verhoging
		notitie TEXT,
		wissel INTEGER NOT NULL DEFAULT 0,           -- 1 = wisselslot
		opties TEXT,                                 -- JSON: [{ slug, hint }]
		sets_tijdelijk INTEGER                       -- één set minder na 3 keer missen
	);

	CREATE TABLE trainingen (
		id INTEGER PRIMARY KEY,
		gebruiker_id INTEGER NOT NULL REFERENCES gebruikers(id) ON DELETE CASCADE,
		dag_id INTEGER REFERENCES dagen(id) ON DELETE SET NULL,
		titel TEXT NOT NULL,
		datum TEXT NOT NULL,                         -- YYYY-MM-DD
		begin TEXT NOT NULL DEFAULT (datetime('now')),
		eind TEXT,
		notitie TEXT,
		extra TEXT,                                  -- twee-uursoptie: 'A', 'B' of 'C'
		strava_id TEXT
	);

	CREATE TABLE sets (
		id INTEGER PRIMARY KEY,
		training_id INTEGER NOT NULL REFERENCES trainingen(id) ON DELETE CASCADE,
		item_id INTEGER REFERENCES items(id) ON DELETE SET NULL,
		slug TEXT NOT NULL,
		nr INTEGER NOT NULL,
		gewicht REAL,
		eenheid TEXT NOT NULL DEFAULT 'kg',
		per_stuk INTEGER NOT NULL DEFAULT 0,
		reps INTEGER NOT NULL,
		rir INTEGER,                                 -- reps in reserve (0 = tot falen), mag leeg
		gemaakt TEXT NOT NULL DEFAULT (datetime('now')),
		UNIQUE (training_id, item_id, slug, nr)
	);
	CREATE INDEX sets_slug ON sets (slug);

	CREATE TABLE wijzigingen (
		id INTEGER PRIMARY KEY,
		item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
		datum TEXT NOT NULL,
		oud REAL,
		nieuw REAL,
		reden TEXT
	);

	CREATE TABLE dagregels (
		gebruiker_id INTEGER NOT NULL REFERENCES gebruikers(id) ON DELETE CASCADE,
		datum TEXT NOT NULL,
		slaap REAL,
		eiwit INTEGER,
		kcal INTEGER,
		gewicht REAL,
		PRIMARY KEY (gebruiker_id, datum)
	);

	CREATE TABLE weekregels (
		gebruiker_id INTEGER NOT NULL REFERENCES gebruikers(id) ON DELETE CASCADE,
		week TEXT NOT NULL,                          -- maandag van de week, YYYY-MM-DD
		slaap REAL,
		energie INTEGER,
		gewicht REAL,
		gemist TEXT,
		notitie TEXT,
		PRIMARY KEY (gebruiker_id, week)
	);

	CREATE TABLE doelen (
		id INTEGER PRIMARY KEY,
		gebruiker_id INTEGER NOT NULL REFERENCES gebruikers(id) ON DELETE CASCADE,
		soort TEXT NOT NULL,                         -- 'lift', 'verhogingen', 'lichaamsgewicht', 'vrij'
		slug TEXT,
		gewicht REAL,
		reps INTEGER,
		aantal INTEGER,
		tekst TEXT NOT NULL,
		start TEXT NOT NULL,
		deadline TEXT,
		behaald TEXT,
		volgorde INTEGER NOT NULL DEFAULT 0
	);

	CREATE TABLE strava (
		gebruiker_id INTEGER PRIMARY KEY REFERENCES gebruikers(id) ON DELETE CASCADE,
		atleet_id TEXT NOT NULL,
		naam TEXT,
		access_token TEXT NOT NULL,
		refresh_token TEXT NOT NULL,
		verloopt INTEGER NOT NULL,                   -- unix sec
		scope TEXT,
		laatst_gesynct TEXT
	);

	CREATE TABLE activiteiten (
		id TEXT PRIMARY KEY,                         -- Strava-id
		gebruiker_id INTEGER NOT NULL REFERENCES gebruikers(id) ON DELETE CASCADE,
		soort TEXT NOT NULL,
		naam TEXT,
		datum TEXT NOT NULL,
		begin TEXT NOT NULL,
		duur INTEGER,                                -- sec, bewegend
		afstand REAL,                                -- meter
		hartslag REAL,
		hoogte REAL
	);
	CREATE INDEX activiteiten_datum ON activiteiten (gebruiker_id, datum);
	`,
	// 2: eten (dagboek zoals Lifesum), water, vasten, slaap uit Apple Gezondheid, API-sleutels
	`
	CREATE TABLE producten (
		id TEXT PRIMARY KEY,                         -- 'basis:…', 'off:<barcode>', 'eigen:<uuid>'
		gebruiker_id INTEGER REFERENCES gebruikers(id) ON DELETE CASCADE,  -- alleen bij eigen producten
		bron TEXT NOT NULL,                          -- 'basis', 'off' (Open Food Facts), 'eigen'
		barcode TEXT,
		naam TEXT NOT NULL,
		merk TEXT,
		eenheid TEXT NOT NULL DEFAULT 'g',           -- voedingswaarden per 100 g of 100 ml
		kcal REAL NOT NULL DEFAULT 0,
		eiwit REAL NOT NULL DEFAULT 0,
		koolh REAL NOT NULL DEFAULT 0,
		vet REAL NOT NULL DEFAULT 0,
		vezels REAL,
		suiker REAL,
		zout REAL,
		porties TEXT,                                -- JSON: [[naam, gram], …]
		bijgewerkt TEXT NOT NULL DEFAULT (datetime('now'))
	);
	CREATE INDEX producten_barcode ON producten (barcode);
	CREATE INDEX producten_naam ON producten (naam COLLATE NOCASE);

	CREATE TABLE eetregels (
		id INTEGER PRIMARY KEY,
		gebruiker_id INTEGER NOT NULL REFERENCES gebruikers(id) ON DELETE CASCADE,
		datum TEXT NOT NULL,
		maaltijd TEXT NOT NULL,                      -- 'ontbijt', 'lunch', 'avond', 'tussendoor'
		product_id TEXT,                             -- leeg bij snel toevoegen
		naam TEXT NOT NULL,                          -- vastgelegd, zodat het dagboek klopt als een product verandert
		hoeveelheid REAL NOT NULL,                   -- in gram/ml (of 1 bij snel toevoegen)
		portie TEXT,                                 -- bv. '2 × snee'
		kcal REAL NOT NULL,
		eiwit REAL NOT NULL,
		koolh REAL NOT NULL,
		vet REAL NOT NULL,
		vezels REAL,
		suiker REAL,
		gemaakt TEXT NOT NULL DEFAULT (datetime('now'))
	);
	CREATE INDEX eetregels_dag ON eetregels (gebruiker_id, datum);
	CREATE INDEX eetregels_product ON eetregels (gebruiker_id, product_id);

	CREATE TABLE favorieten (
		gebruiker_id INTEGER NOT NULL REFERENCES gebruikers(id) ON DELETE CASCADE,
		product_id TEXT NOT NULL,
		PRIMARY KEY (gebruiker_id, product_id)
	);

	CREATE TABLE maaltijden (
		id INTEGER PRIMARY KEY,
		gebruiker_id INTEGER NOT NULL REFERENCES gebruikers(id) ON DELETE CASCADE,
		naam TEXT NOT NULL,
		porties INTEGER NOT NULL DEFAULT 1,          -- recept voor zoveel porties
		items TEXT NOT NULL,                         -- JSON: [{ product_id, naam, hoeveelheid }]
		gemaakt TEXT NOT NULL DEFAULT (datetime('now'))
	);

	CREATE TABLE vasten (
		id INTEGER PRIMARY KEY,
		gebruiker_id INTEGER NOT NULL REFERENCES gebruikers(id) ON DELETE CASCADE,
		begin TEXT NOT NULL,                         -- ISO, UTC
		eind TEXT,
		doel_uren INTEGER NOT NULL DEFAULT 16
	);

	CREATE TABLE sleutels (
		id INTEGER PRIMARY KEY,
		gebruiker_id INTEGER NOT NULL REFERENCES gebruikers(id) ON DELETE CASCADE,
		naam TEXT NOT NULL,
		hash TEXT NOT NULL UNIQUE,                   -- sha256 van de sleutel
		begin TEXT NOT NULL,                         -- eerste tekens, om hem te herkennen
		gemaakt TEXT NOT NULL DEFAULT (datetime('now')),
		laatst TEXT
	);

	ALTER TABLE dagregels ADD COLUMN water INTEGER;          -- ml
	ALTER TABLE dagregels ADD COLUMN slaap_bron TEXT;        -- 'zelf' of 'gezondheid'
	ALTER TABLE dagregels ADD COLUMN slaap_fasen TEXT;       -- JSON: { diep, kern, rem, wakker } in minuten

	ALTER TABLE gebruikers ADD COLUMN doel_kcal INTEGER;     -- leeg = onderhoud + 400
	ALTER TABLE gebruikers ADD COLUMN doel_water INTEGER;    -- ml, leeg = 2500
	ALTER TABLE gebruikers ADD COLUMN macro TEXT;            -- JSON: { vet: procent kcal }
	`
];

const versie = db.pragma('user_version', { simple: true });
for (let i = versie; i < MIGRATIES.length; i++) {
	db.transaction(() => {
		db.exec(MIGRATIES[i]);
		db.pragma(`user_version = ${i + 1}`);
	})();
}

export const een = (sql, ...p) => db.prepare(sql).get(...p);
export const alle = (sql, ...p) => db.prepare(sql).all(...p);
export const doe = (sql, ...p) => db.prepare(sql).run(...p);
export const transactie = (fn) => db.transaction(fn)();
