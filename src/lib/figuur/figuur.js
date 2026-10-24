/*
  Figuur: een pictogram-poppetje dat een oefening voordoet.

  Een houding (pose) beschrijft het lichaam met hoeken en doelen:
    heup: [x, y]           plek van de heup in het beeld (viewBox 240 × 180, vloer op y 166)
    romp: hoek             richting heup → schouder (180 = rechtop)
    hoofd: hoek            extra kanteling van het hoofd t.o.v. de romp (standaard 0)
    shrug: px              schouders omhoog (schouderophalen)
    arm, armAchter:        [bovenarm, onderarm, schaalBoven?, schaalOnder?] in absolute hoeken
    been, beenAchter:      [dij, scheen, voet?]
    doel: { arm, armAchter, been, beenAchter }  wereldpunt voor hand of enkel;
                           dan rekent de figuur zelf de hoeken uit (inverse kinematica)

  Hoeken in graden: 0 = recht omlaag, 90 = naar voren (rechts in beeld), 180 = omhoog,
  -90 = naar achteren. De figuur kijkt altijd naar rechts.

  Aanzicht 'zij' (van opzij): 'arm'/'been' is de kant die het dichtst bij je is,
  'armAchter'/'beenAchter' staat erachter en wordt lichter getekend.
  Aanzicht 'voor' (van voren of van achteren): de tweede arm en het tweede been zijn
  het spiegelbeeld, tenzij je ze zelf opgeeft.
*/

export const L = { romp: 50, nek: 7, hoofd: 9, boven: 27, onder: 25, dij: 38, scheen: 36, voet: 11 };
export const VLOER = 166;
const SCHOUDERBREEDTE = 13;
const HEUPBREEDTE = 7;

const rad = (g) => (g * Math.PI) / 180;
export const richting = (g) => [Math.sin(rad(g)), Math.cos(rad(g))];
const plus = (p, g, l) => {
	const [dx, dy] = richting(g);
	return [p[0] + dx * l, p[1] + dy * l];
};
const hoekVan = (dx, dy) => (Math.atan2(dx, dy) * 180) / Math.PI;

/** Twee-schakel inverse kinematica: hoeken van beide delen om het eindpunt op (dx, dy) te leggen. */
export function ik(l1, l2, dx, dy, buig = 1) {
	let d = Math.hypot(dx, dy);
	const basis = hoekVan(dx, dy);
	if (d >= l1 + l2 - 0.01) return [basis, basis];
	d = Math.max(d, Math.abs(l1 - l2) + 0.01);
	const alfa = (Math.acos((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d)) * 180) / Math.PI;
	// buig +1 draait het eerste deel tegen de klok in: knie naar voren bij een doel eronder,
	// knie omhoog bij een doel ervoor. buig -1: elleboog naar achteren, naar beneden, naar voren boven het hoofd.
	const a1 = basis + buig * alfa;
	const p1 = plus([0, 0], a1, l1);
	const a2 = hoekVan(dx - p1[0], dy - p1[1]);
	return [a1, a2];
}

/** Rekent een houding om naar punten (gewrichten) in het beeld. */
export function gewrichten(pose, aanzicht = 'zij') {
	const voor = aanzicht === 'voor';
	const heup = pose.heup;
	const romp = pose.romp ?? 180;
	const nekBasis = plus(heup, romp, L.romp);
	const shrug = pose.shrug ?? 0;
	const schouderMidden = plus(nekBasis, romp, shrug);
	const hoofd = plus(nekBasis, romp + (pose.hoofd ?? 0), L.nek + L.hoofd);
	const dwars = romp + 90; // loodrecht op de romp, voor de schouderbreedte in vooraanzicht

	const kant = (zijde) => {
		// zijde 1 = eerste (dichtbij / rechts in beeld), -1 = tweede
		const tweede = zijde === -1;
		const schouder = voor ? plus(schouderMidden, dwars, -zijde * SCHOUDERBREEDTE) : schouderMidden;
		const heupPunt = voor ? plus(heup, dwars, -zijde * HEUPBREEDTE) : heup;

		const spiegel = (a) => (voor && tweede ? -a : a);
		const spiegelDoel = (p) => (voor && tweede ? [2 * heup[0] - p[0], p[1]] : p);

		// Arm
		let arm = tweede ? (pose.armAchter ?? pose.arm) : pose.arm;
		arm = arm ?? [0, 0];
		let [ab, ao, sb = 1, so = 1] = arm;
		if (!(tweede && pose.armAchter)) {
			ab = spiegel(ab);
			ao = spiegel(ao);
		}
		const armDoel = tweede ? (pose.doel?.armAchter ?? (pose.doel?.arm && spiegelDoel(pose.doel.arm))) : pose.doel?.arm;
		if (armDoel) {
			const b = pose.buig?.arm ?? -1;
			[ab, ao] = ik(L.boven * sb, L.onder * so, armDoel[0] - schouder[0], armDoel[1] - schouder[1], voor && tweede ? -b : b);
		}
		const elleboog = plus(schouder, ab, L.boven * sb);
		const hand = plus(elleboog, ao, L.onder * so);

		// Been
		let been = tweede ? (pose.beenAchter ?? pose.been) : pose.been;
		been = been ?? [0, 0, 90];
		let [bd, bs, bv = 90, sd = 1, ss = 1] = been;
		if (!(tweede && pose.beenAchter)) {
			bd = spiegel(bd);
			bs = spiegel(bs);
			bv = voor ? (tweede ? -90 : 90) : bv;
		}
		if (voor && !tweede) bv = 90;
		const beenDoel = tweede ? (pose.doel?.beenAchter ?? (pose.doel?.been && spiegelDoel(pose.doel.been))) : pose.doel?.been;
		if (beenDoel) {
			const b = pose.buig?.been ?? 1;
			[bd, bs] = ik(L.dij * sd, L.scheen * ss, beenDoel[0] - heupPunt[0], beenDoel[1] - heupPunt[1], voor && tweede ? -b : b);
		}
		const knie = plus(heupPunt, bd, L.dij * sd);
		const enkel = plus(knie, bs, L.scheen * ss);
		const teen = plus(enkel, voor ? bv : (pose.voet ?? bv), voor ? L.voet * 0.55 : L.voet);

		return { schouder, elleboog, hand, heup: heupPunt, knie, enkel, teen };
	};

	const een = kant(1);
	const twee = kant(-1);
	return {
		aanzicht,
		bekken: heup,
		nek: nekBasis,
		schouderMidden,
		hoofd,
		een,
		twee
	};
}

/** Zoekt een punt op: een gewricht ('hand', 'enkel2', …) of vaste coördinaten, met verschuiving. */
export function punt(g, p) {
	if (Array.isArray(p)) return p;
	if (typeof p === 'string') p = { j: p };
	const naam = p.j.replace(/2$/, '');
	const set = p.j.endsWith('2') ? g.twee : g.een;
	let basis =
		naam === 'hoofd' ? g.hoofd
		: naam === 'nek' ? g.nek
		: naam === 'bekken' ? g.bekken
		: naam === 'midden' ? [(g.een.hand[0] + g.twee.hand[0]) / 2, (g.een.hand[1] + g.twee.hand[1]) / 2]
		: set[naam];
	if (p.d) basis = [basis[0] + p.d[0], basis[1] + p.d[1]];
	if (p.langs) {
		// verschuif loodrecht op of langs een segment: { langs: ['heup', 'schouder'], af: px, dwars: px }
		const a = punt(g, p.langs[0]);
		const b = punt(g, p.langs[1]);
		const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
		const ux = (b[0] - a[0]) / l;
		const uy = (b[1] - a[1]) / l;
		basis = [basis[0] + ux * (p.af ?? 0) - uy * (p.dwars ?? 0), basis[1] + uy * (p.af ?? 0) + ux * (p.dwars ?? 0)];
	}
	return basis;
}

/* ---------- Tussen twee houdingen ---------- */

function meng(a, b, t) {
	if (typeof a === 'number' && typeof b === 'number') return a + (b - a) * t;
	if (Array.isArray(a) && Array.isArray(b)) return a.map((x, i) => meng(x, b[i] ?? x, t));
	if (a && b && typeof a === 'object') {
		const uit = {};
		for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
			uit[k] = k in a && k in b ? meng(a[k], b[k], t) : (a[k] ?? b[k]);
		}
		return uit;
	}
	return t < 0.5 ? a : b;
}

const zacht = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/**
 * Houding op tijdstip t (seconden) in een herhaling.
 * Tempo: [naar B, vasthouden in B, terug naar A, rust in A] in seconden.
 */
export function houdingOp(anim, t) {
	const [heen, vast, terug, rust] = anim.tempo ?? [1, 0.4, 1.4, 0.5];
	const totaal = heen + vast + terug + rust;
	const s = ((t % totaal) + totaal) % totaal;
	let f;
	if (s < heen) f = zacht(s / heen);
	else if (s < heen + vast) f = 1;
	else if (s < heen + vast + terug) f = 1 - zacht((s - heen - vast) / terug);
	else f = 0;
	const fase = s < heen ? 'heen' : s < heen + vast ? 'vast' : s < heen + vast + terug ? 'terug' : 'rust';
	return { pose: meng(anim.a, anim.b, f), f, fase, duur: totaal };
}

export const tempoDuur = (anim) => (anim.tempo ?? [1, 0.4, 1.4, 0.5]).reduce((a, b) => a + b, 0);

/* ---------- Tekenen ---------- */

const DIKTE = { romp: 15, boven: 8.5, onder: 7.5, dij: 11, scheen: 9, voet: 6 };
const STANDAARD_ACHTER = new Set(['balk', 'kabel', 'blok', 'lijn']);

/**
 * Zet een houding plus apparatuur om in tekenvormen (lijnen, cirkels, rechthoeken).
 * Elke vorm heeft een rol (lichaam, accent, apparaat, gewicht, kabel, vloer) die de kleur bepaalt.
 */
export function teken(anim, pose) {
	const aanzicht = anim.aanzicht ?? 'zij';
	const g = gewrichten(pose, aanzicht);
	const accent = new Set(anim.accent ?? []);
	const vormen = [];
	const lijn = (a, b, dik, rol, extra = {}) =>
		vormen.push({ soort: 'lijn', x1: a[0], y1: a[1], x2: b[0], y2: b[1], dik, rol, ...extra });
	const cirkel = (p, r, rol, extra = {}) => vormen.push({ soort: 'cirkel', cx: p[0], cy: p[1], r, rol, ...extra });

	const props = anim.props ?? [];
	const tekenProp = (p) => {
		switch (p.t) {
			case 'vloer':
				lijn([4, VLOER + 4], [236, VLOER + 4], 2, 'vloer');
				break;
			case 'balk':
			case 'lijn':
				lijn(punt(g, p.van), punt(g, p.naar), p.dik ?? (p.t === 'lijn' ? 3 : 7), p.kleur ?? 'apparaat');
				break;
			case 'kabel': {
				const van = punt(g, p.van);
				lijn(van, punt(g, p.naar), 1.6, 'kabel');
				cirkel(van, 4.5, 'apparaat');
				break;
			}
			case 'blok':
				vormen.push({ soort: 'rect', x: p.x, y: p.y, b: p.b, h: p.h, r: p.r ?? 3, rol: p.kleur ?? 'apparaat' });
				break;
			case 'schijf': {
				const op = punt(g, p.op);
				cirkel(op, p.r ?? 13, 'gewicht');
				cirkel(op, 2.6, 'gat');
				break;
			}
			case 'halter': {
				const op = punt(g, p.op);
				let h = p.hoek ?? 90;
				if (p.relatief) {
					const [a, b] = p.relatief.map((q) => punt(g, q));
					h += hoekVan(b[0] - a[0], b[1] - a[1]);
				}
				const lang = p.lang ?? 13;
				const a = plus(op, h, -lang / 2);
				const b = plus(op, h, lang / 2);
				lijn(a, b, 3, 'gewicht');
				lijn(plus(a, h + 90, -5), plus(a, h + 90, 5), 5.5, 'gewicht');
				lijn(plus(b, h + 90, -5), plus(b, h + 90, 5), 5.5, 'gewicht');
				break;
			}
			case 'greep':
				cirkel(punt(g, p.op), p.r ?? 3.6, 'gewicht');
				break;
			case 'rol':
				cirkel(punt(g, p.op), p.r ?? 6.5, 'apparaat-licht');
				break;
			case 'stang': {
				// stang van voren gezien, tussen twee punten, met schijven aan de uiteinden
				const a = punt(g, p.van);
				const b = punt(g, p.naar);
				const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
				const ux = (b[0] - a[0]) / l;
				const uy = (b[1] - a[1]) / l;
				const u = p.uitsteek ?? 0;
				const s = [a[0] - ux * u, a[1] - uy * u];
				const e = [b[0] + ux * u, b[1] + uy * u];
				lijn(s, e, 3, p.kleur ?? 'gewicht');
				if (p.schijven) {
					for (const [q, r] of [[s, -1], [e, 1]]) {
						const m = [q[0] - ux * r * 3, q[1] - uy * r * 3];
						lijn([m[0] - uy * 13, m[1] + ux * 13], [m[0] + uy * 13, m[1] - ux * 13], 6, 'gewicht');
					}
				}
				break;
			}
		}
	};

	if (props.some((p) => p.t === 'vloer')) tekenProp({ t: 'vloer' });
	for (const p of props) if (p.t !== 'vloer' && (p.achter ?? STANDAARD_ACHTER.has(p.t))) tekenProp(p);

	const kleur = (deel, achter) => (accent.has(deel) ? 'accent' : 'lichaam') + (achter ? '-achter' : '');
	const ledematen = (k, achter) => {
		lijn(k.heup, k.knie, DIKTE.dij, kleur('dij', achter));
		lijn(k.knie, k.enkel, DIKTE.scheen, kleur('scheen', achter));
		lijn(k.enkel, k.teen, DIKTE.voet, kleur('voet', achter));
	};
	const arm = (k, achter) => {
		lijn(k.schouder, k.elleboog, DIKTE.boven, kleur('bovenarm', achter));
		lijn(k.elleboog, k.hand, DIKTE.onder, kleur('onderarm', achter));
		cirkel(k.hand, 3.6, kleur('onderarm', achter));
	};

	const zij = aanzicht === 'zij';
	// Achterste ledematen eerst
	ledematen(g.twee, zij);
	if (zij) arm(g.twee, true);
	// Romp en hoofd
	const rompBoven = plus(g.nek, (pose.romp ?? 180) + 180, 2);
	lijn(g.bekken, rompBoven, DIKTE.romp + (zij ? 0 : 7), kleur('romp', false));
	if (accent.has('heup')) cirkel(g.bekken, 8.5, 'accent');
	if (accent.has('nek')) {
		// trapezius: van schouder via de nek naar de andere schouder
		lijn(g.een.schouder, g.nek, 7, 'accent');
		lijn(g.nek, g.twee.schouder, 7, 'accent');
	}
	cirkel(g.hoofd, L.hoofd, 'lichaam');
	ledematen(g.een, false);
	if (!zij) arm(g.twee, false);
	arm(g.een, false);
	if (accent.has('schouder')) {
		cirkel(g.een.schouder, 6, 'accent');
		if (!zij) cirkel(g.twee.schouder, 6, 'accent');
	}

	for (const p of props) if (p.t !== 'vloer' && !(p.achter ?? STANDAARD_ACHTER.has(p.t))) tekenProp(p);
	return vormen;
}
