import { test } from 'node:test';
import assert from 'node:assert/strict';
import { leesFit, isFit, samenvatting } from '#lib/spoor.js';

/*
  Bouwt een klein FIT-bestand zoals een horloge het schrijft: file_id, records (little en big endian,
  met en zonder positie, met samengedrukte tijdkop, met een ontwikkelaarsveld) en een session met de sport.
*/
const FIT_EPOCH = 631065600;
const semi = (g) => Math.round((g * 2 ** 31) / 180);

function fit(berichten, { kop = 14, ketting = 1 } = {}) {
	const data = [];
	const u8 = (n) => data.push(n & 0xff);
	const u16 = (n, be) => (be ? [n >> 8, n] : [n, n >> 8]).forEach(u8);
	const u32 = (n, be) => {
		const b = [n, n >> 8, n >> 16, n >>> 24];
		(be ? b.reverse() : b).forEach(u8);
	};
	for (const m of berichten) m(u8, u16, u32);
	const een = [kop, 0x20, 0x08, 0x08, ...new Uint8Array(new Uint32Array([data.length]).buffer), 0x2e, 0x46, 0x49, 0x54, ...(kop === 14 ? [0, 0] : []), ...data, 0, 0];
	return new Uint8Array(Array.from({ length: ketting }, () => een).flat());
}

// definitie: lokaal type, globaal nummer, velden [[nr, maat, basistype]], big endian, ontwikkelaarsvelden
const def = (lokaal, globaal, velden, { be = false, dev = [] } = {}) => (u8, u16) => {
	u8(0x40 | (dev.length ? 0x20 : 0) | lokaal);
	u8(0); u8(be ? 1 : 0); u16(globaal, be); u8(velden.length);
	for (const v of velden) v.forEach(u8);
	if (dev.length) { u8(dev.length); for (const v of dev) v.forEach(u8); }
};

const record = (lokaal, tijd, lat, lon, { be = false, extra = [] } = {}) => (u8, u16, u32) => {
	u8(lokaal);
	u32(tijd - FIT_EPOCH, be);
	u32(lat == null ? 0x7fffffff : semi(lat), be);
	u32(lon == null ? 0x7fffffff : semi(lon), be);
	u16(1234, be); // hartslag/afstand o.i.d., 2 bytes, wordt overgeslagen
	extra.forEach(u8);
};

const t0 = Date.parse('2026-10-30T06:12:00Z') / 1000;
const REC = [[253, 4, 0x86], [0, 4, 0x85], [1, 4, 0x85], [7, 2, 0x84]];

function voorbeeld(opties) {
	return fit(
		[
			def(0, 0, [[0, 1, 0], [4, 4, 0x86]]), // file_id: type, time_created
			(u8, u16, u32) => { u8(0); u8(4); u32(t0 - FIT_EPOCH); },
			def(1, 20, REC),
			record(1, t0, 52.09, 5.12),
			record(1, t0 + 30, 52.09, 5.121),
			record(1, t0 + 40, null, null), // geen positie (tunnel): overslaan
			def(2, 20, REC, { be: true, dev: [[0, 3, 0]] }),
			record(2, t0 + 90, 52.091, 5.121, { be: true, extra: [1, 2, 3] }),
			def(3, 18, [[253, 4, 0x86], [5, 1, 0], [6, 1, 0]]), // session: sport = 1 (running)
			(u8, u16, u32) => { u8(3); u32(t0 + 100 - FIT_EPOCH); u8(1); u8(0); }
		],
		opties
	);
}

test('FIT herkennen', () => {
	assert.ok(isFit(voorbeeld()));
	assert.ok(!isFit(new TextEncoder().encode('<?xml version="1.0"?><gpx>')));
	assert.equal(leesFit(new Uint8Array(4)).fout, 'Geen FIT-bestand.');
});

test('FIT lezen: punten, tijden, sport, beide bytevolgorden, ontwikkelaarsvelden', () => {
	const s = leesFit(voorbeeld());
	assert.equal(s.soort, 'Run');
	assert.equal(s.punten.length, 3);
	assert.ok(Math.abs(s.punten[0].lat - 52.09) < 1e-6 && Math.abs(s.punten[0].lon - 5.12) < 1e-6);
	assert.equal(s.punten[0].tijd, t0 * 1000);
	assert.equal(s.punten[2].tijd, (t0 + 90) * 1000);
	assert.ok(Math.abs(s.punten[2].lat - 52.091) < 1e-6);
	const sam = samenvatting(s.punten);
	assert.equal(sam.duur, 90);
	assert.ok(sam.afstand > 170 && sam.afstand < 200);
});

test('FIT: kop van 12 bytes en aaneengeschakelde bestanden', () => {
	assert.equal(leesFit(voorbeeld({ kop: 12 })).punten.length, 3);
	assert.equal(leesFit(voorbeeld({ ketting: 2 })).punten.length, 6);
});

test('FIT: samengedrukte tijdkop', () => {
	const off = (t0 + 20 - FIT_EPOCH) & 0x1f;
	const b = fit([
		def(0, 20, [[0, 4, 0x85], [1, 4, 0x85]]),
		def(1, 20, [[253, 4, 0x86]]),
		(u8, u16, u32) => { u8(1); u32(t0 - FIT_EPOCH); }, // alleen tijd
		(u8, u16, u32) => { u8(0x80 | off); u32(semi(52.1)); u32(semi(5.1)); }
	]);
	const s = leesFit(b);
	assert.equal(s.punten.length, 1);
	assert.equal(s.punten[0].tijd, (t0 + 20) * 1000);
});

test('FIT: afgekapt of kapot', () => {
	const b = voorbeeld();
	assert.equal(leesFit(b.subarray(0, 40)).fout, 'Kon het FIT-bestand niet lezen.');
	// halverwege kapot: wat er al was blijft
	const c = b.slice();
	c[14 + 12 + 6 + 18 + 15] = 0x0f; // tweede record: lokaal type zonder definitie
	assert.equal(leesFit(c).punten.length, 1);
});
