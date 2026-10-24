/*
  De oefeningenbibliotheek: alles wat Fits over een oefening weet.

  Per oefening:
    naam, kort         volledige naam en korte naam voor het logboek
    soort              'compound' | 'isolatie' | 'core' | 'warming-up'
                       bepaalt rust (90–120 s of 60 s) en hoe zwaar per set (RIR)
    stap               hoe je zwaarder gaat: 'machine' | 'dumbbell' | 'stang' | 'raise' | 'lichaam' | 'tijd'
    meet               'reps' (standaard) of 'sec'
    spieren            { primair: [], secundair: [] } — namen uit SPIEREN hieronder
    uitvoering, tips, fouten   korte zinnen, in de volgorde waarin je ze nodig hebt
    anim               twee houdingen (a → b) voor de figuur, zie lib/figuur/figuur.js
*/

export const SPIEREN = {
	borst: 'Borst',
	'schouder-voor': 'Voorkant schouder',
	'schouder-zij': 'Zijkant schouder',
	'schouder-achter': 'Achterkant schouder',
	biceps: 'Biceps',
	triceps: 'Triceps',
	onderarm: 'Onderarm',
	buik: 'Buik',
	trapezius: 'Trapezius',
	lats: 'Lats (brede rug)',
	'midden-rug': 'Midden rug',
	onderrug: 'Onderrug',
	bil: 'Bil',
	quadriceps: 'Quadriceps',
	hamstrings: 'Hamstrings',
	adductoren: 'Adductoren (binnenkant)',
	abductoren: 'Abductoren (buitenkant bil)',
	kuiten: 'Kuiten'
};

export const RUST = { compound: [90, 120], isolatie: [60, 60], core: [45, 60], 'warming-up': [30, 30] };

export const STAPPEN = {
	machine: { kg: 2.5, tekst: '+2,5–5 kg' },
	stang: { kg: 2.5, tekst: '+2,5 kg (2× 1,25)' },
	dumbbell: { kg: 1, tekst: '+1–2 kg per stuk' },
	raise: { kg: 1, tekst: '+1 kg, hooguit één keer per maand' },
	lichaam: { kg: 0, tekst: 'meer reps, dan minder hulp of extra gewicht' },
	tijd: { kg: 0, tekst: '+5–10 sec' }
};

/* ---------- Houdingen: herbruikbare stukken ---------- */

const VLOER = { t: 'vloer' };
const ENKEL_Y = 159;
const staand = (x = 120, extra = {}) => ({
	heup: [x, 86],
	romp: 180,
	doel: { been: [x + 2, ENKEL_Y], beenAchter: [x - 4, ENKEL_Y] },
	...extra
});
const voorStaand = (extra = {}) => ({ heup: [120, 86], romp: 180, been: [4, -1], ...extra });
const voorZittend = (extra = {}) => ({ heup: [120, 110], romp: 180, been: [16, 0, 90, 0.35, 1], ...extra });
const zitBank = (x = 104, y = 124) => [
	{ t: 'balk', van: [x - 28, y + 9], naar: [x + 16, y + 9], dik: 8 },
	{ t: 'balk', van: [x - 4, y + 13], naar: [x - 4, 162], dik: 5 }
];
const rugleuning = (dwars = -10) => ({
	t: 'balk',
	van: { j: 'bekken', langs: ['bekken', 'nek'], af: -2, dwars },
	naar: { j: 'nek', langs: ['bekken', 'nek'], af: 4, dwars },
	dik: 8
});
const voorZitting = [
	{ t: 'blok', x: 96, y: 114, b: 48, h: 8 },
	{ t: 'blok', x: 104, y: 50, b: 32, h: 66, r: 6 },
	{ t: 'balk', van: [120, 122], naar: [120, 162], dik: 5 }
];
const HAND_SCHIJF = { t: 'schijf', op: 'hand', r: 7 };

/* ---------- Animaties ---------- */

const A = {};

A.bench = {
	aanzicht: 'zij',
	accent: ['romp', 'bovenarm'],
	tempo: [1.7, 0.3, 1.0, 0.6],
	fasen: ['zakken', 'drukken'],
	props: [
		VLOER,
		{ t: 'balk', van: [66, 121], naar: [176, 121], dik: 8 },
		{ t: 'balk', van: [80, 125], naar: [80, 162], dik: 5 },
		{ t: 'balk', van: [164, 125], naar: [164, 162], dik: 5 },
		{ t: 'balk', van: [90, 20], naar: [90, 162], dik: 4 },
		{ t: 'schijf', op: 'hand', r: 14 }
	],
	a: { heup: [152, 111], romp: -90, doel: { been: [180, ENKEL_Y], arm: [104, 62] } },
	b: { heup: [152, 111], romp: -90, doel: { been: [180, ENKEL_Y], arm: [116, 100] } }
};

const zittendDrukken = (romp, richtingGraden, accent = ['romp', 'bovenarm']) => {
	const heup = [100, 124];
	const s = [heup[0] + 50 * Math.sin((romp * Math.PI) / 180), heup[1] + 50 * Math.cos((romp * Math.PI) / 180)];
	const r = (richtingGraden * Math.PI) / 180;
	const start = [s[0] + 22, s[1] + 4];
	const eind = [s[0] + 50 * Math.sin(r), s[1] + 50 * Math.cos(r)];
	return {
		aanzicht: 'zij',
		accent,
		tempo: [1, 0.3, 1.6, 0.5],
		fasen: ['drukken', 'terug'],
		props: [
			VLOER,
			...zitBank(heup[0], heup[1]),
			rugleuning(-10),
			{ t: 'balk', van: [196, 162], naar: [196, 40], dik: 6 },
			{ t: 'balk', van: [196, 52], naar: 'hand', dik: 4 },
			{ t: 'greep', op: 'hand', r: 4 }
		],
		a: { heup, romp, doel: { arm: start, been: [150, ENKEL_Y] } },
		b: { heup, romp, doel: { arm: eind, been: [150, ENKEL_Y] } }
	};
};

A.inclineMachine = zittendDrukken(205, 112);
A.convergingPress = zittendDrukken(186, 96);

A.pecDeck = {
	aanzicht: 'voor',
	accent: ['romp'],
	tempo: [1, 0.5, 1.6, 0.4],
	fasen: ['sluiten', 'openen'],
	props: [
		VLOER,
		...voorZitting,
		{ t: 'balk', van: { j: 'elleboog', d: [0, 5] }, naar: { j: 'hand', d: [0, -3] }, dik: 12, achter: true },
		{ t: 'balk', van: { j: 'elleboog2', d: [0, 5] }, naar: { j: 'hand2', d: [0, -3] }, dik: 12, achter: true }
	],
	a: voorZittend({ arm: [90, 180, 1, 1] }),
	b: voorZittend({ arm: [90, 180, -0.3, 1] })
};

A.reversePecDeck = {
	aanzicht: 'voor',
	accent: ['schouder', 'romp'],
	tempo: [1, 0.5, 1.5, 0.4],
	fasen: ['openen', 'terug'],
	props: [VLOER, ...voorZitting, { t: 'greep', op: 'hand' }, { t: 'greep', op: 'hand2' }],
	a: voorZittend({ arm: [90, 90, 0.18, 0.18] }),
	b: voorZittend({ arm: [90, 92, 1, 1] })
};

A.lateralRaise = {
	aanzicht: 'voor',
	accent: ['schouder'],
	tempo: [1, 0.3, 1.7, 0.4],
	fasen: ['omhoog', 'zakken'],
	props: [VLOER, { t: 'schijf', op: 'hand', r: 6 }, { t: 'schijf', op: 'hand2', r: 6 }],
	a: voorStaand({ arm: [6, 3] }),
	b: voorStaand({ arm: [84, 92] })
};

A.cableLateral = {
	aanzicht: 'voor',
	accent: ['schouder'],
	tempo: [1, 0.3, 1.7, 0.4],
	fasen: ['omhoog', 'zakken'],
	props: [
		VLOER,
		{ t: 'balk', van: [66, 162], naar: [66, 20], dik: 6 },
		{ t: 'kabel', van: [72, 156], naar: 'hand' },
		{ t: 'greep', op: 'hand' }
	],
	a: voorStaand({ arm: [-12, -18], armAchter: [-30, -60] }),
	b: voorStaand({ arm: [84, 92], armAchter: [-30, -60] })
};

A.lateralMachine = {
	aanzicht: 'voor',
	accent: ['schouder'],
	tempo: [1, 0.4, 1.6, 0.4],
	fasen: ['omhoog', 'zakken'],
	props: [
		VLOER,
		...voorZitting,
		{ t: 'balk', van: { j: 'elleboog', d: [0, 3] }, naar: { j: 'schouder', langs: ['schouder', 'elleboog'], af: 12 }, dik: 10, achter: false, kleur: 'apparaat-licht' },
		{ t: 'balk', van: { j: 'elleboog2', d: [0, 3] }, naar: { j: 'schouder2', langs: ['schouder2', 'elleboog2'], af: 12 }, dik: 10, achter: false, kleur: 'apparaat-licht' }
	],
	a: voorZittend({ arm: [8, 90, 1, 0.3] }),
	b: voorZittend({ arm: [84, 95, 1, 0.3] })
};

A.pushdown = {
	aanzicht: 'zij',
	accent: ['bovenarm'],
	tempo: [0.9, 0.4, 1.5, 0.3],
	fasen: ['duwen', 'terug'],
	props: [
		VLOER,
		{ t: 'balk', van: [176, 162], naar: [176, 10], dik: 6 },
		{ t: 'kabel', van: [170, 16], naar: 'hand' },
		{ t: 'greep', op: 'hand' }
	],
	a: staand(112, { romp: 172, doel: { arm: [137, 46], been: [116, ENKEL_Y], beenAchter: [104, ENKEL_Y] } }),
	b: staand(112, { romp: 172, doel: { arm: [124, 88], been: [116, ENKEL_Y], beenAchter: [104, ENKEL_Y] } })
};

A.overheadExtension = {
	aanzicht: 'zij',
	accent: ['bovenarm'],
	tempo: [1, 0.4, 1.6, 0.3],
	fasen: ['strekken', 'buigen'],
	props: [
		VLOER,
		{ t: 'balk', van: [26, 162], naar: [26, 20], dik: 6 },
		{ t: 'kabel', van: [32, 40], naar: 'hand' },
		{ t: 'greep', op: 'hand' }
	],
	a: { heup: [112, 92], romp: 162, arm: [168, -12], doel: { been: [146, ENKEL_Y], beenAchter: [86, ENKEL_Y] } },
	b: { heup: [112, 92], romp: 162, arm: [168, 162], doel: { been: [146, ENKEL_Y], beenAchter: [86, ENKEL_Y] } }
};

A.cableFly = {
	aanzicht: 'voor',
	accent: ['romp', 'schouder'],
	tempo: [1, 0.5, 1.6, 0.4],
	fasen: ['omhoog en samen', 'terug'],
	props: [
		VLOER,
		{ t: 'balk', van: [200, 162], naar: [200, 30], dik: 6 },
		{ t: 'balk', van: [40, 162], naar: [40, 30], dik: 6 },
		{ t: 'kabel', van: [194, 154], naar: 'hand' },
		{ t: 'kabel', van: [46, 154], naar: 'hand2' },
		{ t: 'greep', op: 'hand' },
		{ t: 'greep', op: 'hand2' }
	],
	a: voorStaand({ arm: [0, 0, 1, 1], doel: { arm: [176, 112] } }),
	b: voorStaand({ arm: [0, 0, 0.45, 0.45], doel: { arm: [125, 56] } })
};

A.dip = {
	aanzicht: 'zij',
	accent: ['romp', 'bovenarm'],
	tempo: [1.6, 0.3, 1.0, 0.5],
	fasen: ['zakken', 'duwen'],
	props: [
		VLOER,
		{ t: 'balk', van: [132, 96], naar: [132, 162], dik: 5 },
		{ t: 'balk', van: { j: 'knie', d: [-4, 9] }, naar: { j: 'enkel', d: [4, 9] }, dik: 8, kleur: 'apparaat' },
		{ t: 'greep', op: 'hand', r: 4 }
	],
	a: { heup: [121, 90], romp: 166, been: [4, -95], doel: { arm: [130, 92] } },
	b: { heup: [128, 116], romp: 160, been: [4, -95], doel: { arm: [130, 92] } }
};

A.chestSupportedRow = {
	aanzicht: 'zij',
	accent: ['romp', 'bovenarm'],
	tempo: [1, 0.5, 1.5, 0.4],
	fasen: ['trekken', 'laten zakken'],
	props: [
		VLOER,
		{ t: 'balk', van: { j: 'bekken', langs: ['bekken', 'nek'], af: 18, dwars: 12 }, naar: { j: 'nek', langs: ['bekken', 'nek'], af: -2, dwars: 12 }, dik: 9 },
		{ t: 'balk', van: [100, 160], naar: [150, 160], dik: 5 },
		{ t: 'balk', van: [146, 120], naar: [146, 160], dik: 5 },
		{ t: 'balk', van: [190, 160], naar: 'hand', dik: 4 },
		{ t: 'greep', op: 'hand', r: 4 }
	],
	a: { heup: [96, 102], romp: 124, doel: { arm: [144, 130], been: [112, 155] } },
	b: { heup: [96, 102], romp: 124, doel: { arm: [116, 100], been: [112, 155] } }
};

A.latPulldown = {
	aanzicht: 'voor',
	accent: ['romp', 'bovenarm'],
	tempo: [1, 0.4, 1.6, 0.4],
	fasen: ['trekken', 'laten gaan'],
	props: [
		VLOER,
		{ t: 'blok', x: 96, y: 114, b: 48, h: 8 },
		{ t: 'balk', van: [120, 122], naar: [120, 162], dik: 5 },
		{ t: 'kabel', van: [120, -6], naar: 'midden' },
		{ t: 'stang', van: 'hand2', naar: 'hand', uitsteek: 12 },
		{ t: 'balk', van: [98, 118], naar: [142, 118], dik: 6, achter: false }
	],
	a: voorZittend({ doel: { arm: [162, 8] } }),
	b: voorZittend({ doel: { arm: [158, 50] } })
};

A.latPulldownNeutraal = {
	aanzicht: 'zij',
	accent: ['romp', 'bovenarm'],
	tempo: [1, 0.4, 1.6, 0.4],
	fasen: ['trekken', 'laten gaan'],
	props: [
		VLOER,
		...zitBank(110, 116),
		{ t: 'balk', van: [138, 112], naar: [138, 160], dik: 5 },
		{ t: 'balk', van: [126, 110], naar: [146, 110], dik: 6, achter: false },
		{ t: 'kabel', van: [110, -6], naar: 'hand' },
		{ t: 'greep', op: 'hand', r: 4 }
	],
	a: { heup: [110, 116], romp: 188, arm: [168, 175], doel: { been: [140, ENKEL_Y] } },
	b: { heup: [110, 116], romp: 194, arm: [8, 168], doel: { been: [140, ENKEL_Y] } }
};

const pullup = (hulp) => ({
	aanzicht: 'voor',
	accent: ['romp', 'bovenarm'],
	tempo: [1.1, 0.4, 1.6, 0.5],
	fasen: ['optrekken', 'zakken'],
	kader: [0, -6, 240, 180],
	props: [
		{ t: 'balk', van: [60, 12], naar: [180, 12], dik: 4, kleur: 'apparaat' },
		...(hulp ? [{ t: 'balk', van: { j: 'knie2', d: [-8, 9] }, naar: { j: 'knie', d: [8, 9] }, dik: 8 }, { t: 'balk', van: { j: 'knie', d: [0, 12] }, naar: [120, 172], dik: 4 }] : [])
	],
	a: { heup: [120, 114], romp: 180, been: hulp ? [6, 0, 90, 1, 0.3] : [4, -4, 90, 1, 0.8], doel: { arm: [152, 12] } },
	b: { heup: [120, 84], romp: 180, been: hulp ? [6, 0, 90, 1, 0.3] : [4, -4, 90, 1, 0.8], doel: { arm: [152, 12] } }
});
A.pullup = pullup(false);
A.assistedPullup = pullup(true);

A.facePull = {
	aanzicht: 'zij',
	accent: ['schouder', 'romp'],
	tempo: [1, 0.6, 1.4, 0.4],
	fasen: ['naar je gezicht', 'terug'],
	props: [
		VLOER,
		{ t: 'balk', van: [210, 162], naar: [210, 14], dik: 6 },
		{ t: 'kabel', van: [204, 30], naar: 'hand' },
		{ t: 'greep', op: 'hand' }
	],
	a: staand(104, { romp: 184, arm: [92, 92, 1, 1] }),
	b: staand(104, { romp: 186, arm: [92, 160, -0.3, 1] })
};

A.dbRow = {
	aanzicht: 'zij',
	accent: ['romp', 'bovenarm'],
	tempo: [1, 0.5, 1.5, 0.4],
	fasen: ['elleboog naar heup', 'zakken'],
	props: [
		VLOER,
		{ t: 'balk', van: [50, 142], naar: [158, 142], dik: 8 },
		{ t: 'balk', van: [62, 146], naar: [62, 162], dik: 5 },
		{ t: 'balk', van: [148, 146], naar: [148, 162], dik: 5 },
		HAND_SCHIJF
	],
	a: { heup: [95, 96], romp: 100, beenAchter: [0, -90, -90], doel: { armAchter: [146, 137], arm: [150, 140], been: [122, ENKEL_Y] } },
	b: { heup: [95, 96], romp: 100, beenAchter: [0, -90, -90], doel: { armAchter: [146, 137], arm: [128, 112], been: [122, ENKEL_Y] } }
};

A.shrug = {
	aanzicht: 'voor',
	accent: ['nek'],
	tempo: [0.8, 1, 1.2, 0.4],
	fasen: ['optrekken', 'zakken'],
	props: [VLOER, { t: 'greep', op: 'hand', r: 4.5 }, { t: 'greep', op: 'hand2', r: 4.5 }],
	a: voorStaand({ arm: [8, 4], shrug: 0 }),
	b: voorStaand({ arm: [8, 4], shrug: 9 })
};

A.straightArm = {
	aanzicht: 'zij',
	accent: ['romp'],
	tempo: [1, 0.4, 1.6, 0.4],
	fasen: ['naar je dijen', 'terug'],
	props: [
		VLOER,
		{ t: 'balk', van: [204, 162], naar: [204, 8], dik: 6 },
		{ t: 'kabel', van: [198, 14], naar: 'hand' },
		{ t: 'greep', op: 'hand' }
	],
	a: staand(106, { romp: 158, arm: [150, 152], doel: { been: [112, ENKEL_Y], beenAchter: [100, ENKEL_Y] } }),
	b: staand(106, { romp: 158, arm: [-8, -6], doel: { been: [112, ENKEL_Y], beenAchter: [100, ENKEL_Y] } })
};

A.highRow = {
	aanzicht: 'zij',
	accent: ['romp', 'bovenarm'],
	tempo: [1, 0.4, 1.6, 0.4],
	fasen: ['trekken', 'terug'],
	props: [
		VLOER,
		...zitBank(100, 124),
		{ t: 'balk', van: { j: 'bekken', langs: ['bekken', 'nek'], af: 22, dwars: 12 }, naar: { j: 'nek', langs: ['bekken', 'nek'], af: -6, dwars: 12 }, dik: 8 },
		{ t: 'balk', van: [176, 4], naar: 'hand', dik: 4 },
		{ t: 'greep', op: 'hand', r: 4 }
	],
	a: { heup: [100, 124], romp: 180, arm: [155, 158], doel: { been: [146, ENKEL_Y] } },
	b: { heup: [100, 124], romp: 182, arm: [-40, 170], doel: { been: [146, ENKEL_Y] } }
};

const PRESS_RICHTING = [[0, 0], [77, -64]];
const legPress = (voetPlek = 0) => {
	const heup = [74, 128];
	const dir = [0.766, -0.643];
	const p = (d) => [heup[0] + dir[0] * d + voetPlek * 0.64, heup[1] + dir[1] * d + voetPlek * 0.77 - voetPlek];
	return {
		aanzicht: 'zij',
		accent: ['dij', 'heup'],
		tempo: [1.6, 0.2, 1.0, 0.5],
		fasen: ['zakken', 'duwen'],
		props: [
			VLOER,
			{ t: 'balk', van: [104, 156], naar: [224, 56], dik: 5 },
			{ t: 'balk', van: [96, 138], naar: [64, 142], dik: 9 },
			rugleuning(-10),
			{ t: 'balk', van: [80, 146], naar: [80, 162], dik: 5 },
			{ t: 'balk', van: { j: 'enkel', langs: PRESS_RICHTING, af: 6, dwars: 22 }, naar: { j: 'enkel', langs: PRESS_RICHTING, af: 6, dwars: -14 }, dik: 7, achter: false },
			{ t: 'schijf', op: { j: 'enkel', langs: PRESS_RICHTING, af: 22, dwars: 30 }, r: 12 }
		],
		a: { heup, romp: 238, doel: { been: p(71), arm: [88, 140] }, voet: 145 },
		b: { heup, romp: 238, doel: { been: p(44), arm: [88, 140] }, voet: 145 }
	};
};
A.legPress = legPress(0);
A.legPressHoog = legPress(8);

A.calfRaise = {
	aanzicht: 'zij',
	accent: ['scheen'],
	tempo: [0.8, 0.8, 1.4, 0.6],
	fasen: ['op je tenen', 'zakken'],
	props: [
		VLOER,
		{ t: 'blok', x: 116, y: 156, b: 34, h: 10, r: 2 },
		{ t: 'balk', van: { j: 'schouder', d: [-12, -7] }, naar: { j: 'schouder', d: [14, -7] }, dik: 7, achter: false },
		{ t: 'balk', van: { j: 'schouder', d: [14, -7] }, naar: [166, 20], dik: 4 },
		{ t: 'balk', van: [170, 162], naar: [170, 14], dik: 6 }
	],
	a: { heup: [116, 86], romp: 180, voet: 112, arm: [20, 160], doel: { been: [112, 155] } },
	b: { heup: [116, 74], romp: 180, voet: 52, arm: [20, 160], doel: { been: [113, 143] } }
};

A.hackSquat = {
	aanzicht: 'zij',
	accent: ['dij', 'heup'],
	tempo: [1.7, 0.2, 1.1, 0.5],
	fasen: ['zakken', 'duwen'],
	props: [
		VLOER,
		{ t: 'balk', van: [76, 18], naar: [128, 160], dik: 4 },
		{ t: 'balk', van: { j: 'bekken', langs: ['bekken', 'nek'], af: -4, dwars: -10 }, naar: { j: 'nek', langs: ['bekken', 'nek'], af: 6, dwars: -10 }, dik: 9 },
		{ t: 'balk', van: [134, 158], naar: [178, 150], dik: 6 },
		{ t: 'rol', op: { j: 'schouder', d: [3, -6] }, r: 6 }
	],
	a: { heup: [118, 88], romp: 200, arm: [12, 172], doel: { been: [152, 147] }, voet: 100 },
	b: { heup: [132, 124], romp: 200, arm: [12, 172], doel: { been: [152, 147] }, voet: 100 }
};

A.legExtension = {
	aanzicht: 'zij',
	accent: ['dij'],
	tempo: [1, 0.6, 1.6, 0.3],
	fasen: ['strekken', 'zakken'],
	props: [
		VLOER,
		{ t: 'balk', van: [76, 129], naar: [146, 129], dik: 9 },
		{ t: 'balk', van: [80, 124], naar: [72, 66], dik: 9 },
		{ t: 'balk', van: [104, 134], naar: [104, 162], dik: 5 },
		{ t: 'balk', van: [148, 121], naar: { j: 'enkel', d: [5, -2] }, dik: 4 },
		{ t: 'rol', op: { j: 'enkel', d: [6, -2] } }
	],
	a: { heup: [108, 120], romp: 186, been: [90, -6, 90], arm: [12, 70] },
	b: { heup: [108, 120], romp: 186, been: [90, 86, 90], arm: [12, 70] }
};

A.seatedLegCurl = {
	aanzicht: 'zij',
	accent: ['dij'],
	tempo: [1, 0.6, 1.6, 0.3],
	fasen: ['buigen', 'strekken'],
	props: [
		VLOER,
		{ t: 'balk', van: [76, 129], naar: [146, 129], dik: 9 },
		{ t: 'balk', van: [80, 124], naar: [72, 66], dik: 9 },
		{ t: 'balk', van: [104, 134], naar: [104, 162], dik: 5 },
		{ t: 'balk', van: [118, 110], naar: [146, 110], dik: 7, achter: false },
		{ t: 'balk', van: [148, 121], naar: { j: 'enkel', d: [-2, 7] }, dik: 4 },
		{ t: 'rol', op: { j: 'enkel', d: [-2, 7] } }
	],
	a: { heup: [108, 120], romp: 186, been: [88, 84, 100], arm: [12, 70] },
	b: { heup: [108, 120], romp: 186, been: [88, -12, 80], arm: [12, 70] }
};

A.lyingLegCurl = {
	aanzicht: 'zij',
	accent: ['dij'],
	tempo: [1, 0.6, 1.6, 0.3],
	fasen: ['hielen naar bil', 'strekken'],
	props: [
		VLOER,
		{ t: 'balk', van: [56, 126], naar: [166, 126], dik: 8 },
		{ t: 'balk', van: [70, 130], naar: [70, 162], dik: 5 },
		{ t: 'balk', van: [156, 130], naar: [156, 162], dik: 5 },
		{ t: 'balk', van: [168, 118], naar: { j: 'enkel', langs: ['knie', 'enkel'], dwars: -7 }, dik: 4 },
		{ t: 'rol', op: { j: 'enkel', langs: ['knie', 'enkel'], dwars: -7 } }
	],
	a: { heup: [124, 115], romp: -90, been: [90, 90, 180], arm: [-6, -30] },
	b: { heup: [124, 115], romp: -90, been: [90, 205, 300], arm: [-6, -30] }
};

const heupMachine = (open) => ({
	aanzicht: 'voor',
	accent: open ? ['heup'] : ['dij'],
	tempo: [1, 0.6, 1.5, 0.4],
	fasen: open ? ['knieën uit elkaar', 'terug'] : ['knieën naar elkaar', 'terug'],
	props: [
		VLOER,
		...voorZitting,
		{ t: 'rol', op: { j: 'knie', d: [open ? 8 : -8, 0] }, r: 6 },
		{ t: 'rol', op: { j: 'knie2', d: [open ? -8 : 8, 0] }, r: 6 }
	],
	a: voorZittend({ arm: [12, 2], been: [open ? 10 : 48, open ? 4 : 14, 90, 0.42, 1] }),
	b: voorZittend({ arm: [12, 2], been: [open ? 48 : 10, open ? 14 : 4, 90, 0.42, 1] })
});
A.abductor = heupMachine(true);
A.adductor = heupMachine(false);

const splitSquat = (bank) => ({
	aanzicht: 'zij',
	accent: ['dij', 'heup'],
	tempo: [1.5, 0.2, 1.1, 0.5],
	fasen: ['zakken', 'omhoog'],
	props: [
		VLOER,
		...(bank ? [{ t: 'balk', van: [22, 128], naar: [74, 128], dik: 8 }, { t: 'balk', van: [48, 132], naar: [48, 162], dik: 5 }] : []),
		...(bank ? [HAND_SCHIJF] : [])
	],
	a: { heup: [114, 90], romp: 178, arm: [0, 0], beenAchter: [0, 0, bank ? -70 : 60], doel: { been: [140, ENKEL_Y], beenAchter: bank ? [62, 118] : [70, 152] } },
	b: { heup: [108, 118], romp: 170, arm: [6, 0], beenAchter: [0, 0, bank ? -70 : 70], doel: { been: [140, ENKEL_Y], beenAchter: bank ? [62, 118] : [72, 154] } }
});
A.bulgarian = splitSquat(true);
A.lunge = splitSquat(false);

A.squat = {
	aanzicht: 'zij',
	accent: ['dij', 'heup'],
	tempo: [1.3, 0.2, 1.0, 0.4],
	fasen: ['zakken', 'omhoog'],
	props: [VLOER],
	a: { heup: [116, 86], romp: 180, arm: [0, 0], doel: { been: [122, ENKEL_Y] } },
	b: { heup: [94, 122], romp: 138, arm: [96, 94], doel: { been: [122, ENKEL_Y] } }
};

A.rdl = {
	aanzicht: 'zij',
	accent: ['dij', 'heup'],
	tempo: [1.7, 0.3, 1.1, 0.5],
	fasen: ['heupen naar achter', 'omhoog'],
	props: [VLOER, { t: 'schijf', op: 'hand', r: 14 }],
	a: { heup: [118, 86], romp: 180, arm: [2, 0], doel: { been: [124, ENKEL_Y] } },
	b: { heup: [98, 94], romp: 112, arm: [0, 2], doel: { been: [124, ENKEL_Y] } }
};

A.hipThrust = {
	aanzicht: 'zij',
	accent: ['heup'],
	tempo: [1, 0.8, 1.4, 0.4],
	fasen: ['heupen omhoog', 'zakken'],
	props: [
		VLOER,
		{ t: 'balk', van: [24, 120], naar: [68, 120], dik: 9 },
		{ t: 'balk', van: [40, 124], naar: [40, 162], dik: 5 },
		{ t: 'balk', van: { j: 'bekken', d: [-13, -10] }, naar: { j: 'bekken', d: [13, -10] }, dik: 8, achter: false }
	],
	a: { heup: [104, 144], romp: -124, hoofd: 30, arm: [40, 120], doel: { been: [150, ENKEL_Y] } },
	b: { heup: [110, 110], romp: -88, hoofd: 40, arm: [70, 160], doel: { been: [150, ENKEL_Y] } }
};

A.kickback = {
	aanzicht: 'zij',
	accent: ['heup'],
	tempo: [1, 0.6, 1.4, 0.4],
	fasen: ['been naar achter', 'terug'],
	props: [
		VLOER,
		{ t: 'balk', van: [160, 162], naar: [160, 20], dik: 6 },
		{ t: 'kabel', van: [154, 156], naar: 'enkel' }
	],
	a: { heup: [112, 90], romp: 158, been: [8, -4, 90], doel: { arm: [156, 76], beenAchter: [118, ENKEL_Y] } },
	b: { heup: [112, 90], romp: 158, been: [-62, -40, 40], doel: { arm: [156, 76], beenAchter: [118, ENKEL_Y] } }
};

A.kneeRaise = {
	aanzicht: 'zij',
	accent: ['romp'],
	tempo: [1, 0.5, 1.5, 0.4],
	fasen: ['knieën op', 'zakken'],
	kader: [0, -6, 240, 180],
	props: [{ t: 'balk', van: [84, 12], naar: [156, 12], dik: 4 }],
	a: { heup: [120, 114], romp: 180, been: [4, -2, 90], doel: { arm: [124, 12] } },
	b: { heup: [123, 114], romp: 176, been: [100, 4, 90], doel: { arm: [124, 12] } }
};

A.plank = {
	aanzicht: 'zij',
	accent: ['romp'],
	tempo: [2, 1, 2, 0],
	fasen: ['aanspannen', 'vasthouden'],
	props: [VLOER],
	a: { heup: [100, 146], romp: 102, arm: [0, 90], doel: { been: [28, 159] }, voet: 10 },
	b: { heup: [100, 144], romp: 100, arm: [0, 90], doel: { been: [28, 159] }, voet: 10 }
};

A.gluteBridge = {
	aanzicht: 'zij',
	accent: ['heup'],
	tempo: [1, 0.8, 1.3, 0.4],
	fasen: ['heupen omhoog', 'zakken'],
	props: [VLOER],
	a: { heup: [104, 156], romp: -92, arm: [88, 92], doel: { been: [140, ENKEL_Y] } },
	b: { heup: [108, 130], romp: -64, arm: [88, 92], doel: { been: [140, ENKEL_Y] } }
};

A.scapular = {
	aanzicht: 'voor',
	accent: ['romp'],
	tempo: [0.8, 0.8, 1.2, 0.4],
	fasen: ['schouders omlaag', 'loslaten'],
	props: [
		VLOER,
		{ t: 'blok', x: 96, y: 114, b: 48, h: 8 },
		{ t: 'balk', van: [120, 122], naar: [120, 162], dik: 5 },
		{ t: 'kabel', van: [120, -6], naar: 'midden' },
		{ t: 'stang', van: 'hand2', naar: 'hand', uitsteek: 12 }
	],
	a: voorZittend({ shrug: 5, arm: [168, 172] }),
	b: voorZittend({ shrug: -5, arm: [166, 170] })
};

const curl = (extra = {}) => ({
	aanzicht: 'zij',
	accent: ['bovenarm'],
	tempo: [1, 0.4, 1.7, 0.3],
	fasen: ['krullen', 'zakken'],
	props: [VLOER, extra.greep ?? HAND_SCHIJF, ...(extra.props ?? [])],
	a: staand(116, { arm: [extra.boven ?? 2, extra.boven ?? 2], romp: extra.romp ?? 180, ...(extra.pose ?? {}) }),
	b: staand(116, { arm: [extra.boven ?? 2, extra.eind ?? 158], romp: extra.romp ?? 180, ...(extra.pose ?? {}) })
});
A.dbCurl = curl();
A.hammerCurl = curl({ greep: { t: 'halter', op: 'hand', relatief: ['elleboog', 'hand'], hoek: 90, lang: 14 } });
A.cableCurl = curl({
	greep: { t: 'greep', op: 'hand', r: 4 },
	props: [{ t: 'balk', van: [172, 162], naar: [172, 30], dik: 6 }, { t: 'kabel', van: [166, 156], naar: 'hand' }]
});
A.bayesian = curl({
	boven: -24,
	eind: 140,
	greep: { t: 'greep', op: 'hand', r: 4 },
	pose: { doel: { been: [138, ENKEL_Y], beenAchter: [92, ENKEL_Y] } },
	props: [{ t: 'balk', van: [26, 162], naar: [26, 30], dik: 6 }, { t: 'kabel', van: [32, 156], naar: 'hand' }]
});

A.inclineCurl = {
	aanzicht: 'zij',
	accent: ['bovenarm'],
	tempo: [1, 0.4, 1.8, 0.3],
	fasen: ['krullen', 'zakken'],
	props: [VLOER, rugleuning(-10), { t: 'balk', van: [98, 132], naar: [140, 132], dik: 8 }, { t: 'balk', van: [116, 136], naar: [116, 162], dik: 5 }, HAND_SCHIJF],
	a: { heup: [122, 122], romp: 212, arm: [-6, -6], doel: { been: [162, ENKEL_Y] } },
	b: { heup: [122, 122], romp: 212, arm: [-6, 150], doel: { been: [162, ENKEL_Y] } }
};

A.preacher = {
	aanzicht: 'zij',
	accent: ['bovenarm'],
	tempo: [1, 0.4, 1.8, 0.3],
	fasen: ['krullen', 'zakken'],
	props: [
		VLOER,
		...zitBank(98, 124),
		{ t: 'balk', van: { j: 'schouder', langs: ['schouder', 'elleboog'], af: 6, dwars: 8 }, naar: { j: 'elleboog', langs: ['schouder', 'elleboog'], af: 2, dwars: 8 }, dik: 9 },
		{ t: 'balk', van: [142, 104], naar: [142, 162], dik: 5 },
		{ t: 'balk', van: 'elleboog', naar: 'hand', dik: 3, kleur: 'gewicht', achter: false },
		{ t: 'greep', op: 'hand', r: 4 }
	],
	a: { heup: [98, 124], romp: 170, arm: [52, 58], doel: { been: [146, ENKEL_Y] } },
	b: { heup: [98, 124], romp: 170, arm: [52, 168], doel: { been: [146, ENKEL_Y] } }
};

A.ohp = {
	aanzicht: 'zij',
	accent: ['schouder', 'bovenarm'],
	tempo: [1, 0.4, 1.5, 0.5],
	fasen: ['drukken', 'zakken'],
	kader: [-10, -24, 260, 195],
	props: [VLOER, { t: 'schijf', op: 'hand', r: 14 }],
	a: staand(118, { buig: { arm: -1 }, doel: { arm: [131, 38], been: [120, ENKEL_Y], beenAchter: [114, ENKEL_Y] } }),
	b: staand(118, { buig: { arm: -1 }, doel: { arm: [122, -14], been: [120, ENKEL_Y], beenAchter: [114, ENKEL_Y] } })
};

A.inclineDb = {
	aanzicht: 'zij',
	accent: ['romp', 'schouder'],
	tempo: [1.6, 0.3, 1.0, 0.5],
	fasen: ['zakken', 'drukken'],
	props: [
		VLOER,
		rugleuning(-10),
		{ t: 'balk', van: [104, 130], naar: [144, 130], dik: 8 },
		{ t: 'balk', van: [116, 134], naar: [116, 162], dik: 5 },
		HAND_SCHIJF
	],
	a: { heup: [124, 120], romp: 232, doel: { arm: [88, 34], been: [164, ENKEL_Y] } },
	b: { heup: [124, 120], romp: 232, doel: { arm: [94, 84], been: [164, ENKEL_Y] } }
};

A.cableRow = {
	aanzicht: 'zij',
	accent: ['romp', 'bovenarm'],
	tempo: [1, 0.5, 1.5, 0.4],
	fasen: ['trekken', 'terug'],
	props: [
		VLOER,
		{ t: 'balk', van: [36, 146], naar: [104, 146], dik: 8 },
		{ t: 'balk', van: [60, 150], naar: [60, 162], dik: 5 },
		{ t: 'balk', van: [138, 126], naar: [138, 162], dik: 6 },
		{ t: 'balk', van: [214, 162], naar: [214, 90], dik: 6 },
		{ t: 'kabel', van: [208, 104], naar: 'hand' },
		{ t: 'greep', op: 'hand', r: 4 }
	],
	a: { heup: [72, 136], romp: 162, doel: { arm: [134, 98], been: [130, 146] } },
	b: { heup: [72, 136], romp: 186, doel: { arm: [90, 110], been: [130, 146] } }
};

/* ---------- De oefeningen ---------- */

const o = (slug, data) => ({ slug, rust: RUST[data.soort], meet: 'reps', ...data });

export const OEFENINGEN = [
	o('bench-press', {
		naam: 'Barbell bench press',
		kort: 'Bench',
		soort: 'compound',
		stap: 'stang',
		apparaat: 'Halterstang en bank',
		spieren: { primair: ['borst'], secundair: ['triceps', 'schouder-voor'] },
		uitvoering: [
			'Ogen recht onder de stang. Voeten plat op de grond, iets achter je knieën.',
			'Schouderbladen naar achteren en omlaag, alsof je ze in je achterzak stopt. Kleine boog in je onderrug.',
			'Pak de stang iets breder dan schouderbreedte. Pols recht boven je elleboog.',
			'Laat de stang gecontroleerd zakken naar je onderste borst, ellebogen ca. 45° van je lichaam.',
			'Druk omhoog en iets naar achteren, terug boven je schouders.'
		],
		tips: ['Billen blijven op de bank.', 'Rust 90–120 sec: dit is een zware oefening.', 'Altijd 1–2 reps over, ook in de laatste set. Bij een barbell nooit tot falen.'],
		fouten: ['Heupen omhoog om de rep af te maken: je bent er, stop.', 'Stang laten stuiteren op je borst.', 'Ellebogen wijd naar buiten (90°): zwaar voor je schouders.'],
		anim: A.bench
	}),
	o('incline-chest-press', {
		naam: 'Incline chest press machine',
		kort: 'Incline machine',
		soort: 'compound',
		stap: 'machine',
		apparaat: 'Hammer Strength of vergelijkbaar',
		spieren: { primair: ['borst'], secundair: ['schouder-voor', 'triceps'] },
		uitvoering: [
			'Zet de stoel zo dat de handvatten op de hoogte van je bovenste borst zitten.',
			'Rug en hoofd tegen het kussen, schouderbladen naar achteren.',
			'Druk omhoog en naar voren tot je armen bijna gestrekt zijn.',
			'Laat in ca. 2 seconden terugkomen tot je een rek voelt in je borst.'
		],
		tips: ['Niet helemaal op slot strekken: houd spanning op je borst.', 'Rust 90–120 sec.'],
		fouten: ['Schouders naar voren rollen aan het eind.', 'Gewicht laten vallen in de terugweg.'],
		anim: A.inclineMachine
	}),
	o('converging-chest-press', {
		naam: 'Converging chest press',
		kort: 'Converging press',
		soort: 'compound',
		stap: 'machine',
		apparaat: 'Machine met naar binnen draaiende armen',
		spieren: { primair: ['borst'], secundair: ['triceps', 'schouder-voor'] },
		uitvoering: [
			'Handvatten op borsthoogte. Rug tegen het kussen.',
			'Druk naar voren; de armen komen vanzelf naar elkaar toe.',
			'Knijp kort in je borst als je handen dicht bij elkaar zijn.',
			'Rustig terug tot een rek in je borst.'
		],
		tips: ['Een goede wissel voor de incline machine als je borst vooral binnenkant mist.'],
		fouten: ['Schouders van het kussen af tillen.'],
		anim: A.convergingPress
	}),
	o('pec-deck', {
		naam: 'Pec deck',
		kort: 'Pec deck',
		soort: 'isolatie',
		stap: 'machine',
		apparaat: 'Butterfly-machine',
		spieren: { primair: ['borst'], secundair: ['schouder-voor'] },
		uitvoering: [
			'Stoel zo dat je ellebogen net onder schouderhoogte zitten.',
			'Onderarmen of handen tegen de kussens, borst omhoog.',
			'Breng de armen in een boog naar elkaar toe. Knijp 1 seconde.',
			'Langzaam terug tot je armen ongeveer in lijn met je lichaam zijn.'
		],
		tips: ['Denk "omarm een boom", niet "duw".', 'Isolatie: de laatste set mag tot 0 reps over.'],
		fouten: ['Te ver terug laten gaan: dat trekt aan je schoudergewricht.', 'Schouders optrekken.'],
		anim: A.pecDeck
	}),
	o('lateral-raise', {
		naam: 'Lateral raises (dumbbells)',
		kort: 'Lat raise',
		soort: 'isolatie',
		stap: 'raise',
		apparaat: 'Twee dumbbells',
		spieren: { primair: ['schouder-zij'], secundair: ['trapezius'] },
		uitvoering: [
			'Sta rechtop, dumbbells naast je benen, ellebogen licht gebogen.',
			'Til de armen opzij tot schouderhoogte. Leid met je elleboog, niet met je hand.',
			'Pinken iets hoger dan duimen, alsof je een kan leeggiet.',
			'Laat in 2 seconden zakken. Niet laten vallen.'
		],
		tips: ['Liever licht en strak dan zwaar en zwaaiend.', 'Zwaarder gaan: +1 kg, hooguit één keer per maand.'],
		fouten: ['Shruggen: je schouders kruipen naar je oren. Dan is het gewicht te zwaar.', 'Zwaaien met je bovenlichaam.'],
		anim: A.lateralRaise
	}),
	o('cable-lateral-raise', {
		naam: 'Single-arm cable lateral raise',
		kort: 'Cable lat raise',
		soort: 'isolatie',
		stap: 'raise',
		apparaat: 'Kabel, laag, met handvat',
		spieren: { primair: ['schouder-zij'], secundair: [] },
		uitvoering: [
			'Kabel laag. Ga er zijwaarts naast staan en pak het handvat met de verste hand.',
			'Houd je met de andere hand vast aan het apparaat.',
			'Til de arm opzij tot schouderhoogte, elleboog licht gebogen.',
			'Rustig terug tot je hand voor je heup hangt.'
		],
		tips: ['De kabel houdt ook onderin spanning; daarom werkt dit naast de dumbbell-versie.', 'Doe eerst je zwakke kant.'],
		fouten: ['Wegleunen om het gewicht omhoog te krijgen.'],
		anim: A.cableLateral
	}),
	o('lateral-raise-machine', {
		naam: 'Lateral raise machine',
		kort: 'Lat raise machine',
		soort: 'isolatie',
		stap: 'machine',
		apparaat: 'Machine met kussens tegen je bovenarmen',
		spieren: { primair: ['schouder-zij'], secundair: [] },
		uitvoering: [
			'Stoel zo dat het draaipunt naast je schouder zit.',
			'Bovenarmen tegen de kussens, borst tegen het kussen of rechtop.',
			'Duw met je ellebogen opzij en omhoog tot schouderhoogte.',
			'Langzaam terug.'
		],
		tips: ['Fijn als je merkt dat je bij dumbbells gaat zwaaien.'],
		fouten: ['Shruggen.'],
		anim: A.lateralMachine
	}),
	o('tricep-pushdown', {
		naam: 'Tricep pushdown (kabel)',
		kort: 'Pushdown',
		soort: 'isolatie',
		stap: 'machine',
		apparaat: 'Kabel hoog, met rechte stang of touw',
		spieren: { primair: ['triceps'], secundair: [] },
		uitvoering: [
			'Kabel hoog. Sta dichtbij, licht voorover.',
			'Ellebogen tegen je zij. Die blijven daar de hele set.',
			'Duw naar beneden tot je armen gestrekt zijn. Knijp kort.',
			'Laat je onderarmen rustig omhoog komen tot iets boven 90°.'
		],
		tips: ['Alleen je onderarmen bewegen.', 'Laatste set mag tot 0 reps over.'],
		fouten: ['Ellebogen naar voren laten schuiven.', 'Met je hele lijf op de stang hangen.'],
		anim: A.pushdown
	}),
	o('overhead-cable-extension', {
		naam: 'Overhead tricep extension (kabel, touw)',
		kort: 'OH extension',
		soort: 'isolatie',
		stap: 'machine',
		apparaat: 'Kabel met touw. Alternatief: één dumbbell met twee handen',
		spieren: { primair: ['triceps'], secundair: [] },
		uitvoering: [
			'Pak het touw, draai je om en zet een stap naar voren. Licht voorover leunen.',
			'Ellebogen naast je hoofd, wijzend naar voren.',
			'Strek je armen naar voren en omhoog.',
			'Buig terug tot je een flinke rek in je triceps voelt.'
		],
		tips: ['Deze stand rekt de lange kop van je triceps: daar zit de meeste groei.'],
		fouten: ['Ellebogen wijd laten uitwaaieren.', 'Je onderrug hol trekken.'],
		anim: A.overheadExtension
	}),
	o('cable-fly-laag-hoog', {
		naam: 'Cable fly laag-naar-hoog',
		kort: 'Cable fly',
		soort: 'isolatie',
		stap: 'machine',
		apparaat: 'Twee kabels, laag',
		spieren: { primair: ['borst'], secundair: ['schouder-voor'] },
		uitvoering: [
			'Beide kabels laag. Pak de handvatten en zet een stap naar voren.',
			'Armen licht gebogen, handpalmen naar voren.',
			'Breng je handen in een boog omhoog en naar elkaar, tot op kinhoogte.',
			'Rustig terug.'
		],
		tips: ['Werkt vooral op je bovenste borst.'],
		fouten: ['Armen buigen en strekken: dan wordt het een press.'],
		anim: A.cableFly
	}),
	o('assisted-dip', {
		naam: 'Assisted dip machine',
		kort: 'Dip machine',
		soort: 'compound',
		stap: 'lichaam',
		apparaat: 'Machine met kniekussen; meer gewicht = meer hulp',
		spieren: { primair: ['borst', 'triceps'], secundair: ['schouder-voor'] },
		uitvoering: [
			'Knieën op het kussen, handen op de handvatten, armen gestrekt.',
			'Leun iets voorover.',
			'Zak tot je bovenarmen ongeveer horizontaal zijn.',
			'Duw jezelf omhoog tot je armen gestrekt zijn.'
		],
		tips: ['Let op: bij deze machine is minder gewicht zwáárder. Je schrijft het op als –20.', 'Vooruitgang = elke keer wat minder hulp.'],
		fouten: ['Dieper zakken dan je schouders prettig vinden.', 'Schouders naar je oren.'],
		anim: A.dip
	}),
	o('chest-supported-row', {
		naam: 'Chest-supported row / T-bar row',
		kort: 'Row',
		soort: 'compound',
		stap: 'machine',
		apparaat: 'Machine of T-bar met borstkussen',
		spieren: { primair: ['midden-rug', 'lats'], secundair: ['schouder-achter', 'biceps'] },
		uitvoering: [
			'Borst tegen het kussen, voeten stevig neer.',
			'Pak de handvatten, armen gestrekt, schouders ontspannen naar voren.',
			'Trek je ellebogen naar achteren, langs je lichaam. Knijp je schouderbladen samen.',
			'Rustig terug tot je armen gestrekt zijn.'
		],
		tips: ['Borst blijft op het kussen: dan doet je rug het werk, niet je onderrug.', 'Rust 90–120 sec.'],
		fouten: ['Borst van het kussen om met momentum te trekken.', 'Alleen met je armen trekken.'],
		anim: A.chestSupportedRow
	}),
	o('lat-pulldown', {
		naam: 'Lat pulldown',
		kort: 'Pulldown',
		soort: 'compound',
		stap: 'machine',
		apparaat: 'Kabel met brede stang',
		spieren: { primair: ['lats'], secundair: ['biceps', 'midden-rug'] },
		uitvoering: [
			'Dijen onder het kussen. Pak de stang iets breder dan schouderbreedte.',
			'Borst omhoog, licht achterover.',
			'Trek de stang naar je bovenste borst. Denk: ellebogen naar je zakken.',
			'Laat de stang langzaam omhoog tot je armen gestrekt zijn.'
		],
		tips: ['Begin elke rep met je schouders omlaag te trekken.', 'Rust 90–120 sec.'],
		fouten: ['Ver achterover hangen en trekken met je lijf.', 'De stang achter je nek.'],
		anim: A.latPulldown
	}),
	o('lat-pulldown-neutraal', {
		naam: 'Lat pulldown, neutrale greep',
		kort: 'Pulldown neutraal',
		soort: 'compound',
		stap: 'machine',
		apparaat: 'Kabel met V-greep of converging machine',
		spieren: { primair: ['lats'], secundair: ['biceps', 'midden-rug'] },
		uitvoering: [
			'Handpalmen naar elkaar toe (V-greep of parallelle handvatten).',
			'Borst omhoog, licht achterover.',
			'Trek je ellebogen naar beneden, langs je lichaam, tot je handen bij je borst zijn.',
			'Rustig terug tot gestrekt.'
		],
		tips: ['Andere greep dan op dinsdag: zo krijgen je lats een andere prikkel.'],
		fouten: ['Je ellebogen naar voren laten wijzen aan het eind.'],
		anim: A.latPulldownNeutraal
	}),
	o('pull-up', {
		naam: 'Pull-up',
		kort: 'Pull-up',
		soort: 'compound',
		stap: 'lichaam',
		apparaat: 'Optrekstang',
		spieren: { primair: ['lats'], secundair: ['biceps', 'midden-rug', 'onderarm'] },
		uitvoering: [
			'Hang aan de stang, handen iets breder dan schouders, handpalmen van je af.',
			'Trek eerst je schouders omlaag (een scapular pull).',
			'Trek jezelf op tot je kin boven de stang is.',
			'Zak gecontroleerd tot je armen gestrekt zijn.'
		],
		tips: ['Haal je geen 5? Doe negatieven: spring op en zak in 3–5 sec.', 'Doel: één ongeassisteerde pull-up.'],
		fouten: ['Halve reps.', 'Zwaaien met je benen.'],
		anim: A.pullup
	}),
	o('assisted-pull-up', {
		naam: 'Assisted pull-up',
		kort: 'Assisted pull-up',
		soort: 'compound',
		stap: 'lichaam',
		apparaat: 'Machine met kniekussen; meer gewicht = meer hulp',
		spieren: { primair: ['lats'], secundair: ['biceps', 'midden-rug'] },
		uitvoering: [
			'Knieën op het kussen, handen breed op de stang.',
			'Schouders omlaag, borst naar de stang.',
			'Trek je op tot je kin boven de handvatten is.',
			'Langzaam terug.'
		],
		tips: ['Elke week een stap minder hulp. Zo werk je naar een echte pull-up.'],
		fouten: ['Te veel hulp nemen: de laatste reps moeten zwaar zijn.'],
		anim: A.assistedPullup
	}),
	o('rear-delt-fly', {
		naam: 'Rear delt fly (pec deck omgekeerd)',
		kort: 'Rear delt',
		soort: 'isolatie',
		stap: 'machine',
		apparaat: 'Pec deck, met je borst naar het kussen',
		spieren: { primair: ['schouder-achter'], secundair: ['midden-rug', 'trapezius'] },
		uitvoering: [
			'Zit omgekeerd, borst tegen het kussen. Handvatten op schouderhoogte.',
			'Armen bijna gestrekt.',
			'Duw de handvatten in een boog naar achteren tot je armen in lijn met je lichaam zijn.',
			'Rustig terug.'
		],
		tips: ['Denk "handen ver weg", niet "schouderbladen samen". Zo blijft het werk in je achterste schouder.'],
		fouten: ['Shruggen.', 'Te zwaar: dan neemt je rug het over.'],
		anim: A.reversePecDeck
	}),
	o('face-pull', {
		naam: 'Face pulls (kabel)',
		kort: 'Face pull',
		soort: 'isolatie',
		stap: 'machine',
		apparaat: 'Kabel op gezichtshoogte, touw',
		spieren: { primair: ['schouder-achter'], secundair: ['trapezius', 'midden-rug'] },
		uitvoering: [
			'Kabel op ooghoogte. Pak het touw met je duimen naar achteren.',
			'Stap naar achteren tot je armen gestrekt zijn.',
			'Trek het touw naar je gezicht, ellebogen hoog en wijd. Trek de touwuiteinden uit elkaar.',
			'Rustig terug.'
		],
		tips: ['Goed voor je schoudergezondheid naast al het drukwerk.'],
		fouten: ['Ellebogen laag: dan wordt het een row.'],
		anim: A.facePull
	}),
	o('single-arm-db-row', {
		naam: 'Single-arm dumbbell row',
		kort: 'DB row',
		soort: 'compound',
		stap: 'dumbbell',
		apparaat: 'Dumbbell en bank',
		spieren: { primair: ['lats', 'midden-rug'], secundair: ['biceps', 'schouder-achter'] },
		uitvoering: [
			'Knie en hand van dezelfde kant op de bank, rug plat.',
			'Dumbbell hangt onder je schouder.',
			'Trek je elleboog naar je heup, niet naar je oksel.',
			'Laat zakken tot je arm gestrekt is en je een rek in je lat voelt.'
		],
		tips: ['Elleboog naar heup = lats. Elleboog breed = bovenrug.'],
		fouten: ['Je romp mee draaien.'],
		anim: A.dbRow
	}),
	o('machine-shrug', {
		naam: 'Machine shrug',
		kort: 'Shrug',
		soort: 'isolatie',
		stap: 'machine',
		apparaat: 'Shrug-machine of smith machine',
		spieren: { primair: ['trapezius'], secundair: [] },
		uitvoering: ['Sta rechtop, armen gestrekt.', 'Trek je schouders recht omhoog naar je oren.', 'Houd 1 seconde vast.', 'Langzaam omlaag.'],
		tips: ['Niet rollen met je schouders; recht op en neer.'],
		fouten: ['Je armen buigen.'],
		anim: A.shrug
	}),
	o('straight-arm-pulldown', {
		naam: 'Straight-arm pulldown',
		kort: 'Straight-arm',
		soort: 'isolatie',
		stap: 'machine',
		apparaat: 'Kabel hoog, stang of touw',
		spieren: { primair: ['lats'], secundair: [] },
		uitvoering: [
			'Kabel hoog. Stap naar achteren en scharnier licht voorover.',
			'Armen gestrekt, ellebogen een beetje zacht.',
			'Duw de stang in een boog naar je dijen.',
			'Rustig terug tot je armen boven je hoofd zijn.'
		],
		tips: ['Isoleert je lats zonder dat je biceps meedoet.'],
		fouten: ['Je ellebogen buigen.'],
		anim: A.straightArm
	}),
	o('iso-lateral-high-row', {
		naam: 'Iso-lateral high row',
		kort: 'High row',
		soort: 'compound',
		stap: 'machine',
		apparaat: 'Hammer Strength of vergelijkbaar',
		spieren: { primair: ['lats', 'midden-rug'], secundair: ['biceps', 'schouder-achter'] },
		uitvoering: [
			'Dijen onder het kussen, borst tegen het kussen.',
			'Pak de handvatten boven je.',
			'Trek je ellebogen naar beneden en naar achteren.',
			'Rustig terug.'
		],
		tips: ['Je kunt ook één arm tegelijk doen.'],
		fouten: ['Je borst van het kussen halen.'],
		anim: A.highRow
	}),
	o('leg-press', {
		naam: 'Leg press',
		kort: 'Leg press',
		soort: 'compound',
		stap: 'machine',
		apparaat: 'Leg press 45°',
		spieren: { primair: ['quadriceps', 'bil'], secundair: ['hamstrings', 'adductoren'] },
		uitvoering: [
			'Rug en billen helemaal tegen het kussen.',
			'Voeten op heupbreedte midden op het plateau.',
			'Laat zakken tot je knieën ongeveer 90° zijn, of zo diep als je onderrug op het kussen blijft.',
			'Duw terug zonder je knieën op slot te zetten.'
		],
		tips: ['Knieën in de lijn van je tenen.', 'Rust 90–120 sec.'],
		fouten: ['Billen komen los van het kussen onderin: te diep.', 'Knieën op slot bovenin.'],
		anim: A.legPress
	}),
	o('leg-press-smal', {
		naam: 'Leg press, smalle voetstand',
		kort: 'Leg press smal',
		soort: 'compound',
		stap: 'machine',
		apparaat: 'Leg press 45°',
		spieren: { primair: ['quadriceps'], secundair: ['bil'] },
		uitvoering: ['Voeten dicht bij elkaar, wat lager op het plateau.', 'Laat rustig zakken, knieën recht vooruit.', 'Duw terug zonder op slot te gaan.'],
		tips: ['Meer quadriceps, minder bil.'],
		fouten: ['Hielen los van het plateau.'],
		anim: A.legPress
	}),
	o('leg-press-hoog', {
		naam: 'Leg press, voeten hoog en breed',
		kort: 'Leg press hoog',
		soort: 'compound',
		stap: 'machine',
		apparaat: 'Leg press 45°',
		spieren: { primair: ['bil', 'hamstrings'], secundair: ['quadriceps', 'adductoren'] },
		uitvoering: ['Voeten hoog en breed op het plateau, tenen iets naar buiten.', 'Laat diep zakken, knieën naar buiten.', 'Duw door je hielen terug.'],
		tips: ['Let op de eenheid van de machine: sommige tellen in lbs.'],
		fouten: ['Onderrug die van het kussen rolt.'],
		anim: A.legPressHoog
	}),
	o('hack-squat', {
		naam: 'Hack squat / pendulum squat',
		kort: 'Hack squat',
		soort: 'compound',
		stap: 'machine',
		apparaat: 'Hack squat- of pendulum-machine',
		spieren: { primair: ['quadriceps'], secundair: ['bil', 'adductoren'] },
		uitvoering: [
			'Rug tegen het kussen, schouders onder de kussens.',
			'Voeten op heupbreedte, midden op het plateau.',
			'Zak zo diep als je kunt met je hielen plat en je rug tegen het kussen.',
			'Duw terug door je hele voet.'
		],
		tips: ['Begin licht: zoek eerst je gewicht. Doel: drie keer verhogen.', 'Rust 90–120 sec.'],
		fouten: ['Hielen omhoog.', 'Knieën naar binnen.'],
		anim: A.hackSquat
	}),
	o('leg-extension', {
		naam: 'Leg extension',
		kort: 'Leg ext',
		soort: 'isolatie',
		stap: 'machine',
		apparaat: 'Leg extension-machine',
		spieren: { primair: ['quadriceps'], secundair: [] },
		uitvoering: [
			'Knie in lijn met het draaipunt. Rol net boven je enkels.',
			'Houd de handvatten vast.',
			'Strek je benen tot ze bijna recht zijn. Knijp 1 seconde.',
			'Laat langzaam zakken.'
		],
		tips: ['Leun iets achterover voor meer rek op je quadriceps.'],
		fouten: ['Het gewicht omhoog schoppen.'],
		anim: A.legExtension
	}),
	o('seated-leg-curl', {
		naam: 'Seated leg curl',
		kort: 'Seated curl',
		soort: 'isolatie',
		stap: 'machine',
		apparaat: 'Seated leg curl-machine',
		spieren: { primair: ['hamstrings'], secundair: ['kuiten'] },
		uitvoering: [
			'Knie in lijn met het draaipunt. Klem het dijkussen stevig vast.',
			'Rol net boven je hielen.',
			'Buig je knieën zo ver als je kunt.',
			'Langzaam terug tot bijna gestrekt.'
		],
		tips: ['Leun iets voorover: dan rekken je hamstrings meer.'],
		fouten: ['Je billen van de stoel tillen.'],
		anim: A.seatedLegCurl
	}),
	o('lying-leg-curl', {
		naam: 'Lying leg curl',
		kort: 'Lying curl',
		soort: 'isolatie',
		stap: 'machine',
		apparaat: 'Lying leg curl-machine (een ander apparaat dan op woensdag)',
		spieren: { primair: ['hamstrings'], secundair: ['kuiten'] },
		uitvoering: [
			'Lig op je buik, knieën net over de rand van het kussen.',
			'Rol net boven je hielen. Houd de handvatten vast.',
			'Trek je hielen naar je billen.',
			'Langzaam terug tot bijna gestrekt.'
		],
		tips: ['Heupen blijven op het kussen.'],
		fouten: ['Je heupen omhoog laten komen.'],
		anim: A.lyingLegCurl
	}),
	o('calf-raise', {
		naam: 'Calf raises',
		kort: 'Calf',
		soort: 'isolatie',
		stap: 'machine',
		apparaat: 'Calf-machine of leg press',
		spieren: { primair: ['kuiten'], secundair: [] },
		uitvoering: [
			'Voorvoeten op de rand, hielen vrij.',
			'Laat je hielen zo ver mogelijk zakken. Houd 1 seconde vast.',
			'Duw omhoog op je tenen. Houd 1 seconde vast.',
			'Langzaam terug.'
		],
		tips: ['Kuiten groeien van de rek onderin. Pauzeer daar.'],
		fouten: ['Stuiteren.'],
		anim: A.calfRaise
	}),
	o('hip-abductor', {
		naam: 'Hip abductor machine',
		kort: 'Abductor',
		soort: 'isolatie',
		stap: 'machine',
		apparaat: 'Abductor-machine (kussens buitenkant knie)',
		spieren: { primair: ['abductoren', 'bil'], secundair: [] },
		uitvoering: ['Kussens tegen de buitenkant van je knieën.', 'Duw je knieën uit elkaar.', 'Houd 1 seconde vast.', 'Langzaam terug.'],
		tips: ['Leun iets voorover voor meer bil.'],
		fouten: ['Terug laten klappen.'],
		anim: A.abductor
	}),
	o('hip-adductor', {
		naam: 'Hip adductor machine',
		kort: 'Adductor',
		soort: 'isolatie',
		stap: 'machine',
		apparaat: 'Adductor-machine (kussens binnenkant knie)',
		spieren: { primair: ['adductoren'], secundair: [] },
		uitvoering: ['Kussens tegen de binnenkant van je knieën.', 'Knijp je knieën naar elkaar.', 'Langzaam terug tot een lichte rek.'],
		tips: ['Begin met een kleine opening en bouw de rek op.'],
		fouten: ['Te ver open beginnen.'],
		anim: A.adductor
	}),
	o('bulgarian-split-squat', {
		naam: 'Bulgarian split squat (dumbbells)',
		kort: 'Bulgarian',
		soort: 'compound',
		stap: 'dumbbell',
		apparaat: 'Twee dumbbells en een bank',
		spieren: { primair: ['quadriceps', 'bil'], secundair: ['adductoren', 'hamstrings'] },
		uitvoering: [
			'Achterste voet met de wreef op de bank. Voorste voet een grote stap ervoor.',
			'Dumbbells naast je lichaam.',
			'Zak recht omlaag tot je achterste knie bijna de grond raakt.',
			'Duw door je voorste hiel omhoog.'
		],
		tips: ['Reps tellen per kant.', 'Licht voorover = meer bil, rechtop = meer quadriceps.'],
		fouten: ['Voorste hiel komt los.', 'Te kleine stap: je knie schiet ver over je tenen.'],
		anim: A.bulgarian
	}),
	o('overhead-press', {
		naam: 'Staande barbell overhead press',
		kort: 'OHP',
		soort: 'compound',
		stap: 'raise',
		apparaat: 'Halterstang',
		spieren: { primair: ['schouder-voor', 'schouder-zij'], secundair: ['triceps', 'trapezius', 'buik'] },
		uitvoering: [
			'Stang op je bovenste borst, handen net buiten je schouders.',
			'Billen en buik aanspannen.',
			'Druk de stang recht omhoog, langs je gezicht. Hoofd even naar achteren.',
			'Bovenin hoofd door je armen naar voren. Rustig terug naar je borst.'
		],
		tips: ['Begin met de lege stang (20 kg) en zoek je gewicht.', 'Zwaarder gaan: +1 kg per maand.'],
		fouten: ['Achterover leunen: dan wordt het een incline press.', 'Je knieën gebruiken.'],
		anim: A.ohp
	}),
	o('incline-db-press', {
		naam: 'Incline dumbbell press',
		kort: 'Incline DB',
		soort: 'compound',
		stap: 'dumbbell',
		apparaat: 'Twee dumbbells, bank op 30–45°',
		spieren: { primair: ['borst', 'schouder-voor'], secundair: ['triceps'] },
		uitvoering: [
			'Bank op 30–45°. Dumbbells op je knieën, dan liggend naar je schouders.',
			'Schouderbladen samen, voeten plat.',
			'Druk de dumbbells omhoog tot ze bijna tegen elkaar komen.',
			'Laat zakken tot naast je borst.'
		],
		tips: ['Ellebogen iets naar binnen (45°), niet wijd.'],
		fouten: ['De bank te steil zetten: dan is het vooral schouder.'],
		anim: A.inclineDb
	}),
	o('seated-cable-row', {
		naam: 'Seated cable row',
		kort: 'Cable row',
		soort: 'compound',
		stap: 'machine',
		apparaat: 'Kabel laag, V-greep',
		spieren: { primair: ['midden-rug', 'lats'], secundair: ['biceps', 'schouder-achter'] },
		uitvoering: [
			'Voeten tegen de steunen, knieën licht gebogen.',
			'Rug recht, leun licht naar voren met gestrekte armen.',
			'Trek de greep naar je buik terwijl je rechtop gaat zitten.',
			'Rustig terug.'
		],
		tips: ['Borst omhoog aan het eind van elke rep.'],
		fouten: ['Ver achterover zwaaien.', 'Een ronde rug als je naar voren gaat.'],
		anim: A.cableRow
	}),
	o('preacher-curl-machine', {
		naam: 'Preacher curl machine',
		kort: 'Preacher',
		soort: 'isolatie',
		stap: 'machine',
		apparaat: 'Preacher curl-machine',
		spieren: { primair: ['biceps'], secundair: ['onderarm'] },
		uitvoering: [
			'Stoel zo dat je oksels net over het kussen hangen.',
			'Ellebogen in lijn met het draaipunt.',
			'Krul omhoog. Knijp bovenin.',
			'Laat langzaam zakken tot je armen bijna gestrekt zijn.'
		],
		tips: ['De onderkant is het zwaarst en levert het meest op. Sla die niet over.'],
		fouten: ['Je billen van de stoel tillen.'],
		anim: A.preacher
	}),
	o('db-curl', {
		naam: 'Dumbbell bicep curl',
		kort: 'Curl',
		soort: 'isolatie',
		stap: 'dumbbell',
		apparaat: 'Twee dumbbells',
		spieren: { primair: ['biceps'], secundair: ['onderarm'] },
		uitvoering: ['Sta rechtop, handpalmen naar voren.', 'Ellebogen naast je lichaam.', 'Krul omhoog tot je onderarm verticaal is.', 'Langzaam terug.'],
		tips: ['Doel: 2× 12–14 kg.'],
		fouten: ['Zwaaien met je rug.', 'Ellebogen naar voren laten komen.'],
		anim: A.dbCurl
	}),
	o('hammer-curl', {
		naam: 'Hammer curl',
		kort: 'Hammer',
		soort: 'isolatie',
		stap: 'dumbbell',
		apparaat: 'Twee dumbbells',
		spieren: { primair: ['biceps', 'onderarm'], secundair: [] },
		uitvoering: ['Handpalmen naar elkaar toe, als een hamer.', 'Ellebogen naast je lichaam.', 'Krul omhoog.', 'Langzaam terug.'],
		tips: ['Maakt je arm dikker: brachialis en onderarm.'],
		fouten: ['Zwaaien.'],
		anim: A.hammerCurl
	}),
	o('incline-db-curl', {
		naam: 'Incline dumbbell curl',
		kort: 'Incline curl',
		soort: 'isolatie',
		stap: 'dumbbell',
		apparaat: 'Twee dumbbells, bank op 45–60°',
		spieren: { primair: ['biceps'], secundair: [] },
		uitvoering: ['Lig op de schuine bank, armen hangen recht naar beneden.', 'Krul omhoog zonder je ellebogen naar voren te brengen.', 'Langzaam terug tot een flinke rek.'],
		tips: ['Licht beginnen: de rek maakt het zwaarder dan je denkt.'],
		fouten: ['Je schouders van de bank halen.'],
		anim: A.inclineCurl
	}),
	o('cable-curl', {
		naam: 'Cable curl',
		kort: 'Cable curl',
		soort: 'isolatie',
		stap: 'machine',
		apparaat: 'Kabel laag, stang of handvat',
		spieren: { primair: ['biceps'], secundair: ['onderarm'] },
		uitvoering: ['Kabel laag, sta er vlak voor.', 'Ellebogen naast je lichaam.', 'Krul omhoog.', 'Rustig terug.'],
		tips: ['Constante spanning, ook onderin.'],
		fouten: ['Achterover leunen.'],
		anim: A.cableCurl
	}),
	o('bayesian-curl', {
		naam: 'Bayesian curl',
		kort: 'Bayesian',
		soort: 'isolatie',
		stap: 'machine',
		apparaat: 'Kabel laag, één handvat',
		spieren: { primair: ['biceps'], secundair: [] },
		uitvoering: [
			'Kabel laag. Ga met je rug naar het apparaat staan en stap naar voren.',
			'Je arm hangt iets achter je lichaam.',
			'Krul omhoog zonder je elleboog naar voren te brengen.',
			'Langzaam terug tot een rek in je biceps.'
		],
		tips: ['De gerekte stand maakt dit een van de beste curls voor groei.'],
		fouten: ['Je elleboog naar voren laten zwaaien.'],
		anim: A.bayesian
	}),
	o('romanian-deadlift', {
		naam: 'Roemeense deadlift (barbell)',
		kort: 'RDL',
		soort: 'compound',
		stap: 'stang',
		apparaat: 'Halterstang',
		spieren: { primair: ['hamstrings', 'bil'], secundair: ['onderrug', 'trapezius', 'onderarm'] },
		uitvoering: [
			'Sta rechtop met de stang tegen je dijen, voeten op heupbreedte.',
			'Knieën licht gebogen; die hoek blijft zo.',
			'Duw je heupen naar achteren. De stang glijdt langs je benen omlaag.',
			'Stop als je hamstrings flink rekken (meestal net onder de knie). Heupen naar voren om omhoog te komen.'
		],
		tips: ['Rug recht, stang langs de benen, heupen naar achteren.', 'Doel: 70 kg voor 8.'],
		fouten: ['Een ronde rug: dan is het gewicht te zwaar of ga je te diep.', 'Squatten in plaats van scharnieren.'],
		anim: A.rdl
	}),
	o('hip-thrust-machine', {
		naam: 'Hip thrust machine',
		kort: 'Hip thrust',
		soort: 'compound',
		stap: 'machine',
		apparaat: 'Hip thrust-machine (of stang op een bank)',
		spieren: { primair: ['bil'], secundair: ['hamstrings'] },
		uitvoering: [
			'Bovenrug tegen het kussen, het heupkussen over je heupen.',
			'Voeten plat, zo dat je schenen bovenin verticaal staan.',
			'Duw je heupen omhoog tot je lichaam van knie tot schouder recht is. Knijp je billen.',
			'Rustig omlaag.'
		],
		tips: ['Kin naar je borst houdt je onderrug neutraal.'],
		fouten: ['Je onderrug hol trekken bovenin.'],
		anim: A.hipThrust
	}),
	o('glute-kickback', {
		naam: 'Glute kickback (kabel)',
		kort: 'Kickback',
		soort: 'isolatie',
		stap: 'machine',
		apparaat: 'Kabel laag, enkelband',
		spieren: { primair: ['bil'], secundair: ['hamstrings'] },
		uitvoering: [
			'Enkelband om, kabel laag. Houd je vast aan het apparaat.',
			'Leun licht voorover.',
			'Duw je been naar achteren en omhoog. Knijp je bil.',
			'Langzaam terug.'
		],
		tips: ['Klein bereik, veel controle.'],
		fouten: ['Je onderrug hol trekken om hoger te komen.'],
		anim: A.kickback
	}),
	o('hanging-knee-raise', {
		naam: 'Hanging knee raises',
		kort: 'Knee raise',
		soort: 'core',
		stap: 'lichaam',
		apparaat: 'Optrekstang of dipstation',
		spieren: { primair: ['buik'], secundair: [] },
		uitvoering: ['Hang aan de stang, schouders actief.', 'Trek je knieën op tot heuphoogte of hoger.', 'Kantel je bekken een beetje naar je toe.', 'Laat rustig zakken zonder te zwaaien.'],
		tips: ['Te makkelijk? Strek je benen meer.'],
		fouten: ['Zwaaien.'],
		anim: A.kneeRaise
	}),
	o('plank', {
		naam: 'Plank',
		kort: 'Plank',
		soort: 'core',
		stap: 'tijd',
		meet: 'sec',
		apparaat: 'Mat',
		spieren: { primair: ['buik'], secundair: ['schouder-voor', 'bil'] },
		uitvoering: ['Onderarmen op de grond, ellebogen onder je schouders.', 'Lichaam recht van hoofd tot hielen.', 'Billen en buik aanspannen.', 'Houd vast en blijf rustig ademen.'],
		tips: ['Doel per set: 45 sec.'],
		fouten: ['Heupen laten hangen.', 'Billen in de lucht.'],
		anim: A.plank
	}),

	/* Warming-up */
	o('scapular-pulldown', {
		naam: 'Scapular pulldowns',
		kort: 'Scap pulldown',
		soort: 'warming-up',
		stap: 'machine',
		apparaat: 'Lat pulldown, licht',
		spieren: { primair: ['lats'], secundair: ['trapezius'] },
		uitvoering: ['Armen gestrekt aan de stang.', 'Trek alleen je schouders omlaag, zonder je armen te buigen.', 'Laat weer los.'],
		tips: ['Activatie voor je rug. 2× 12.'],
		fouten: ['Je armen buigen.'],
		anim: A.scapular
	}),
	o('bodyweight-squat', {
		naam: 'Bodyweight squats',
		kort: 'Squat',
		soort: 'warming-up',
		stap: 'lichaam',
		apparaat: 'Geen',
		spieren: { primair: ['quadriceps', 'bil'], secundair: [] },
		uitvoering: ['Voeten op schouderbreedte.', 'Zak zo diep als lekker voelt, armen naar voren.', 'Omhoog.'],
		tips: ['2× 10 om je knieën en heupen wakker te maken.'],
		fouten: [],
		anim: A.squat
	}),
	o('lunge', {
		naam: 'Lunges',
		kort: 'Lunge',
		soort: 'warming-up',
		stap: 'lichaam',
		apparaat: 'Geen',
		spieren: { primair: ['quadriceps', 'bil'], secundair: [] },
		uitvoering: ['Grote stap naar voren.', 'Zak tot je achterste knie bijna de grond raakt.', 'Duw terug.'],
		tips: ['10 per sessie, afwisselend links en rechts.'],
		fouten: [],
		anim: A.lunge
	}),
	o('glute-bridge', {
		naam: 'Glute bridges',
		kort: 'Bridge',
		soort: 'warming-up',
		stap: 'lichaam',
		apparaat: 'Mat',
		spieren: { primair: ['bil'], secundair: ['hamstrings'] },
		uitvoering: ['Lig op je rug, knieën gebogen.', 'Duw je heupen omhoog en knijp je billen.', 'Rustig omlaag.'],
		tips: ['10 stuks voor Legs B.'],
		fouten: [],
		anim: A.gluteBridge
	})
];

export const PER_SLUG = Object.fromEntries(OEFENINGEN.map((x) => [x.slug, x]));
export const oefening = (slug) => PER_SLUG[slug];
export const isZwaar = (slug) => PER_SLUG[slug]?.soort === 'compound';
