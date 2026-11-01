import { test } from 'node:test';
import assert from 'node:assert/strict';
import { meters, lees, leesGpx, leesTcx, samenvatting, vereenvoudig, codeer, decodeer, svgPad, lokaal, leesCsv, stravaIndex, sleutelVan } from '#lib/spoor.js';

const GPX = `<?xml version="1.0" encoding="UTF-8"?>
<gpx creator="StravaGPX" version="1.1" xmlns="http://www.topografix.com/GPX/1/1">
 <metadata><time>2026-10-30T06:12:00Z</time></metadata>
 <trk>
  <name>Ochtendloop &amp; zo</name>
  <type>running</type>
  <trkseg>
   <trkpt lat="52.0900000" lon="5.1200000"><ele>3.0</ele><time>2026-10-30T06:12:00Z</time></trkpt>
   <trkpt lon="5.1210000" lat="52.0900000"><time>2026-10-30T06:12:30Z</time></trkpt>
   <trkpt lat="52.0900000" lon="5.1210000"><time>2026-10-30T06:14:30Z</time></trkpt>
   <trkpt lat="52.0910000" lon="5.1210000"><time>2026-10-30T06:15:00Z</time></trkpt>
   <trkpt lat="0" lon="0"/>
  </trkseg>
 </trk>
</gpx>`;

const TCX = `  <?xml version="1.0" encoding="UTF-8"?>
<TrainingCenterDatabase xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2">
 <Activities><Activity Sport="Running"><Id>2026-10-30T06:12:00Z</Id><Lap><Track>
  <Trackpoint><Time>2026-10-30T06:12:00Z</Time><Position><LatitudeDegrees>52.09</LatitudeDegrees><LongitudeDegrees>5.12</LongitudeDegrees></Position></Trackpoint>
  <Trackpoint><Time>2026-10-30T06:12:05Z</Time><HeartRateBpm><Value>120</Value></HeartRateBpm></Trackpoint>
  <Trackpoint><Time>2026-10-30T06:13:00Z</Time><Position><LatitudeDegrees>52.091</LatitudeDegrees><LongitudeDegrees>5.12</LongitudeDegrees></Position></Trackpoint>
 </Track></Lap></Activity></Activities>
</TrainingCenterDatabase>`;

test('afstand: 0,001° breedte ≈ 111 m', () => {
	assert.ok(Math.abs(meters({ lat: 52, lon: 5 }, { lat: 52.001, lon: 5 }) - 111.2) < 0.5);
});

test('GPX: naam, soort, punten (ook lat/lon omgedraaid), 0,0 weg', () => {
	const g = leesGpx(GPX);
	assert.equal(g.naam, 'Ochtendloop & zo');
	assert.equal(g.soort, 'Run');
	assert.equal(g.punten.length, 4);
	assert.equal(g.punten[1].lon, 5.121);
	assert.equal(g.punten[0].tijd, Date.parse('2026-10-30T06:12:00Z'));
	assert.equal(lees(GPX).punten.length, 4);
});

test('TCX: soort uit Sport, punten zonder positie overgeslagen, witruimte vooraan mag', () => {
	const t = leesTcx(TCX);
	assert.equal(t.soort, 'Run');
	assert.equal(t.punten.length, 2);
	assert.equal(lees(TCX).punten.length, 2);
	assert.ok(lees('<html></html>').fout);
});

test('samenvatting: bewegende tijd zonder stilstaan', () => {
	const s = samenvatting(leesGpx(GPX).punten);
	assert.equal(s.begin, Date.parse('2026-10-30T06:12:00Z'));
	assert.equal(s.duur, 180);
	assert.equal(s.bewegend, 60); // 2 minuten stil tellen niet
	assert.ok(Math.abs(s.afstand - 180) < 3, String(s.afstand)); // ~68 m oost + ~111 m noord
	assert.deepEqual(s.grenzen, { zuid: 52.09, west: 5.12, noord: 52.091, oost: 5.121 });
	assert.equal(samenvatting([{ lat: 52, lon: 5, tijd: null }]).duur, null);
});

test('vereenvoudigen: rechte lijn houdt begin en eind, een hoek blijft', () => {
	const recht = Array.from({ length: 50 }, (_, i) => ({ lat: 52 + i * 0.0001, lon: 5, tijd: null }));
	assert.equal(vereenvoudig(recht, 5).length, 2);
	const hoek = [...recht, ...Array.from({ length: 20 }, (_, i) => ({ lat: 52.0049, lon: 5 + (i + 1) * 0.0001, tijd: null }))];
	const v = vereenvoudig(hoek, 5);
	assert.equal(v.length, 3);
	assert.equal(v[1].lat, 52.0049);
});

test('polyline: voorbeeld van Google en heen-en-terug', () => {
	const pt = [{ lat: 38.5, lon: -120.2 }, { lat: 40.7, lon: -120.95 }, { lat: 43.252, lon: -126.453 }];
	assert.equal(codeer(pt), '_p~iF~ps|U_ulLnnqC_mqNvxq`@');
	assert.deepEqual(decodeer('_p~iF~ps|U_ulLnnqC_mqNvxq`@'), pt.map((p) => [p.lat, p.lon]));
	assert.deepEqual(decodeer(''), []);
});

test('svg-vorm past in het vak', () => {
	const d = svgPad(codeer([{ lat: 52, lon: 5 }, { lat: 52.01, lon: 5 }, { lat: 52.01, lon: 5.01 }]), 48, 3);
	assert.match(d, /^M[\d. ]+L[\d. ]+L[\d. ]+$/);
	for (const n of d.match(/[\d.]+/g).map(Number)) assert.ok(n >= 0 && n <= 48);
	assert.equal(svgPad(''), '');
});

test('lokale tijd in Nederland (zomer- en wintertijd)', () => {
	assert.equal(lokaal(Date.parse('2026-10-30T06:12:00Z')), '2026-10-30T07:12:00');
	assert.equal(lokaal(Date.parse('2026-07-01T06:12:00Z')), '2026-07-01T08:12:00');
});

test('CSV en activities.csv van Strava', () => {
	assert.deepEqual(leesCsv('a,"b,c","d ""e"""\r\n1,"twee\nregels",3\n'), [['a', 'b,c', 'd "e"'], ['1', 'twee\nregels', '3']]);
	const csv = '﻿Activity ID,Activity Date,Activity Name,Activity Type,Activity Description,Elapsed Time,Filename,Elapsed Time\n' +
		'1,"Oct 30, 2026, 6:12:00 AM",Rondje park,Run,"mooi, koud",1800,activities/1.gpx.gz,1800\n' +
		'2,"Oct 31, 2026, 6:12:00 AM",Fietsen,Ride,,3600,activities/2.fit.gz,3600\n' +
		'3,"Oct 31, 2026, 7:12:00 AM",Gym,Weight Training,,3600,,3600\n';
	const i = stravaIndex(csv);
	assert.equal(i.size, 2);
	assert.deepEqual(i.get('1.gpx'), { naam: 'Rondje park', soort: 'Run' });
	assert.equal(i.get('2.fit').soort, 'Ride');
	assert.equal(sleutelVan('activities\\ABC.TCX.GZ'), 'abc.tcx');
});
