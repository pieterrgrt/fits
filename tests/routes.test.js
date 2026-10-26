import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Start de gebouwde app (npm run build) met een lege database en vraagt de belangrijkste routes op.
const gebouwd = fs.existsSync('build/index.js');
const POORT = 3900 + Math.floor(Math.random() * 100);
const basis = `http://127.0.0.1:${POORT}`;
let app, data;

before(async () => {
	if (!gebouwd) return;
	data = fs.mkdtempSync(path.join(os.tmpdir(), 'fits-test-'));
	app = spawn(process.execPath, ['build'], {
		env: { ...process.env, PORT: String(POORT), HOST: '127.0.0.1', FITS_DATA: data },
		stdio: 'inherit'
	});
	for (let i = 0; i < 100; i++) {
		try {
			if ((await fetch(`${basis}/health`)).ok) return;
		} catch {}
		await new Promise((r) => setTimeout(r, 100));
	}
	throw new Error('app start niet');
});

after(() => {
	app?.kill();
	if (data) fs.rmSync(data, { recursive: true, force: true });
});

const opties = { skip: !gebouwd && 'eerst npm run build' };

test('/health en /gezond: 200 als app en database werken', opties, async () => {
	for (const pad of ['/health', '/gezond']) {
		const r = await fetch(basis + pad);
		assert.equal(r.status, 200, pad);
		assert.equal(await r.text(), 'ok');
		assert.equal(r.headers.get('cache-control'), 'no-store');
	}
});

test('zonder inloggen: doorsturen naar /inloggen', opties, async () => {
	const r = await fetch(`${basis}/`, { redirect: 'manual' });
	assert.equal(r.status, 303);
	assert.equal(r.headers.get('location'), '/inloggen');
	const sub = await fetch(`${basis}/eten`, { redirect: 'manual' });
	assert.equal(sub.headers.get('location'), '/inloggen?naar=%2Feten');
});

test('inlogpagina laadt', opties, async () => {
	const r = await fetch(`${basis}/inloggen`);
	assert.equal(r.status, 200);
	assert.match(await r.text(), /<html/i);
});
