/*
  Het startschema: precies het document waarmee je begon. Elke nieuwe gebruiker krijgt dit
  als uitgangspunt; daarna past de zondag-check het aan.
  'sinds' zonder jaar in het document = 2026.
*/

const i = (slug, sets, min, max, gewicht, extra = {}) => ({ slug, sets, min, max, gewicht, ...extra });
const wissel = (opties, extra = {}) => ({ slug: null, sets: 3, min: 10, max: 15, gewicht: null, wissel: true, opties, ...extra });
const ds = (d) => (d ? `2026-${d}` : null);

export const START_DAGEN = [
	{
		weekdag: 1,
		code: 'push-a',
		titel: 'Push A',
		focus: 'Borst',
		warmup: { tekst: '5 min cardio + 2× 15 lateral raises 4–5 kg', items: [{ slug: 'lateral-raise', tekst: '2× 15 · 4–5 kg' }] },
		items: [
			i('bench-press', 4, 8, 12, 50, { sinds: ds('10-19'), notitie: 'Stang 20 + 2× 15' }),
			i('incline-chest-press', 3, 8, 12, 15, { sinds: ds('10-01') }),
			i('pec-deck', 3, 12, 15, 35, { sinds: ds('10-01') }),
			i('lateral-raise', 3, 12, 15, 6, { per_stuk: 1, sinds: ds('10-01') }),
			i('tricep-pushdown', 3, 10, 15, 37.5, { sinds: ds('10-01') }),
			wissel([
				{ slug: 'assisted-dip' },
				{ slug: 'cable-fly-laag-hoog' },
				{ slug: 'overhead-cable-extension', hint: 'touw' },
				{ slug: 'converging-chest-press' }
			])
		]
	},
	{
		weekdag: 2,
		code: 'pull-a',
		titel: 'Pull A',
		focus: 'Rug (dikte)',
		warmup: { tekst: '5 min cardio + 2× 12 scapular pulldowns', items: [{ slug: 'scapular-pulldown', tekst: '2× 12' }] },
		items: [
			i('chest-supported-row', 4, 8, 12, 60, { sinds: ds('10-20'), notitie: 'Of T-bar row' }),
			i('lat-pulldown', 3, 8, 12, 50, { sinds: ds('10-02') }),
			i('pull-up', 3, 5, 8, 0, { sinds: ds('09-15'), notitie: 'Lichaamsgewicht' }),
			i('rear-delt-fly', 3, 12, 15, 25),
			i('face-pull', 3, 12, 15, 27),
			wissel([
				{ slug: 'single-arm-db-row', hint: '16 kg, elleboog naar heup' },
				{ slug: 'machine-shrug' },
				{ slug: 'straight-arm-pulldown' },
				{ slug: 'iso-lateral-high-row' }
			])
		]
	},
	{
		weekdag: 3,
		code: 'legs-a',
		titel: 'Legs A',
		focus: 'Quads',
		warmup: {
			tekst: '5 min fietsen + 2× 10 bodyweight squats + 10 lunges',
			items: [{ slug: 'bodyweight-squat', tekst: '2× 10' }, { slug: 'lunge', tekst: '10' }]
		},
		alternatief: 'Loop je zaterdag een duurloop in plaats van Legs B? Voeg dan vandaag barbell RDL 3× 8–12 toe.',
		items: [
			i('leg-press', 4, 8, 12, 120, { sinds: ds('10-03') }),
			i('hack-squat', 3, 8, 12, 60, { sinds: ds('09-16'), notitie: 'Of pendulum squat' }),
			i('leg-extension', 3, 12, 15, 68, { sinds: ds('10-03') }),
			i('seated-leg-curl', 3, 10, 15, 90, { sinds: ds('10-03') }),
			i('calf-raise', 4, 12, 20, 59, { notitie: 'Leg press of calf-machine' }),
			wissel([
				{ slug: 'hip-adductor' },
				{ slug: 'hip-abductor' },
				{ slug: 'bulgarian-split-squat', hint: '2× 10 kg' },
				{ slug: 'leg-press-smal' }
			])
		]
	},
	{
		weekdag: 4,
		code: 'push-b',
		titel: 'Push B',
		focus: 'Schouders',
		warmup: { tekst: '5 min cardio + 2× 15 lateral raises 4–5 kg (activatie)', items: [{ slug: 'lateral-raise', tekst: '2× 15 · 4–5 kg' }] },
		items: [
			i('overhead-press', 4, 6, 10, 20, { sinds: ds('09-17'), notitie: 'Billen en buik aanspannen, stang recht omhoog langs het gezicht' }),
			i('lateral-raise', 4, 12, 20, 7, { per_stuk: 1, sinds: ds('09-17'), notitie: 'Leiden met de elleboog, niet shruggen' }),
			i('incline-db-press', 3, 8, 12, 16, { per_stuk: 1, sinds: ds('09-17') }),
			i('cable-lateral-raise', 3, 12, 15, 5),
			i('overhead-cable-extension', 3, 10, 15, null, { notitie: 'DB-alternatief 2× 7 kg' }),
			wissel([
				{ slug: 'lateral-raise-machine' },
				{ slug: 'assisted-dip' },
				{ slug: 'cable-fly-laag-hoog' },
				{ slug: 'rear-delt-fly', hint: 'reverse pec deck' }
			])
		]
	},
	{
		weekdag: 5,
		code: 'pull-b',
		titel: 'Pull B',
		focus: 'Biceps + lats',
		warmup: { tekst: '5 min cardio + 2× 12 scapular pulldowns', items: [{ slug: 'scapular-pulldown', tekst: '2× 12' }] },
		items: [
			i('lat-pulldown-neutraal', 3, 8, 12, 55, { sinds: ds('09-18'), notitie: 'Andere greep dan dinsdag' }),
			i('seated-cable-row', 3, 8, 12, 45, { sinds: ds('09-18') }),
			i('preacher-curl-machine', 3, 8, 12, null),
			i('db-curl', 3, 8, 12, 10, { per_stuk: 1, sinds: ds('09-11') }),
			i('hammer-curl', 3, 10, 15, 9, { per_stuk: 1, sinds: ds('09-11') }),
			wissel([
				{ slug: 'assisted-pull-up', hint: '2× 5–8' },
				{ slug: 'incline-db-curl', hint: '2× 6 kg' },
				{ slug: 'cable-curl' },
				{ slug: 'bayesian-curl' }
			])
		]
	},
	{
		weekdag: 6,
		code: 'legs-b',
		titel: 'Legs B',
		focus: 'Hamstrings + bil',
		warmup: {
			tekst: '5 min fietsen + 10 lunges + 10 glute bridges',
			items: [{ slug: 'lunge', tekst: '10' }, { slug: 'glute-bridge', tekst: '10' }]
		},
		alternatief: 'Of een duurloop van 60 min in zone 2. Dan woensdag Legs A uitbreiden met barbell RDL 3× 8–12.',
		items: [
			i('romanian-deadlift', 4, 8, 12, 40, { sinds: ds('09-12'), notitie: 'Rug recht, stang langs de benen, heupen naar achteren' }),
			i('lying-leg-curl', 3, 10, 15, 31.7, { sinds: ds('09-19'), notitie: 'Ander apparaat dan woensdag' }),
			i('leg-press-hoog', 3, 10, 15, 360, { eenheid: 'lbs', sinds: ds('09-12') }),
			i('bulgarian-split-squat', 3, 8, 10, 10, { per_stuk: 1, notitie: 'Reps per kant' }),
			i('hip-thrust-machine', 3, 10, 15, null, { notitie: 'Of glute kickback kabel' }),
			i('hanging-knee-raise', 3, 10, 15, 0),
			i('plank', 3, 45, 45, 0)
		]
	},
	{ weekdag: 7, code: 'rust', titel: 'Rust', focus: 'Progressiecheck 10 min', soort: 'rust', items: [] }
];

export const START_DOELEN = [
	{ soort: 'lift', slug: 'pull-up', gewicht: 0, reps: 1, tekst: 'Ongeassisteerde pull-up' },
	{ soort: 'lift', slug: 'bench-press', gewicht: 60, reps: 8, tekst: 'Barbell bench 60 kg voor 8' },
	{ soort: 'lift', slug: 'overhead-press', gewicht: 40, reps: 8, tekst: 'Overhead press 40 kg voor 8' },
	{ soort: 'lift', slug: 'romanian-deadlift', gewicht: 70, reps: 8, tekst: 'Barbell RDL 70 kg voor 8' },
	{ soort: 'lift', slug: 'leg-press', gewicht: 120, reps: 8, tekst: 'Leg press 120 kg' },
	{ soort: 'verhogingen', slug: 'hack-squat', aantal: 3, tekst: 'Hack squat: gewicht gevonden en 3 keer verhoogd' },
	{ soort: 'lift', slug: 'db-curl', gewicht: 12, reps: 8, tekst: 'Bicep curl 2× 12–14 kg' },
	{ soort: 'lichaamsgewicht', gewicht: 2, tekst: 'Lichaamsgewicht +2 tot +3 kg' }
];
export const DOELEN_START = '2026-09-15';
export const DOELEN_DEADLINE = '2026-12-15';
