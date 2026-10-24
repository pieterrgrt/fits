/// <reference types="@sveltejs/kit" />
/*
  Service worker: zorgt dat Fits ook opent als het bereik in de sportschool wegvalt.
  - De app zelf (scripts, stijl, letters, iconen) staat op de telefoon.
  - Pagina's: eerst het netwerk; lukt dat niet, dan de laatst geladen versie van die pagina.
  - Wat je invoert terwijl je offline bent, regelt de wachtrij (src/lib/training/wachtrij.svelte.js).
  Niets van /api, uitloggen of formulieren wordt bewaard: alleen GET-verzoeken naar pagina's.
*/
import { immutable, assets } from '$app/manifest';
import { version } from '$app/env';

const APP = `fits-app-${version}`;
const PAGINAS = 'fits-paginas';
// Paden zijn relatief aan de basis van de app; maak er absolute paden van.
const BESTANDEN = [...immutable, ...assets].map(({ path }) => new URL(path, self.registration.scope).pathname);

self.addEventListener('install', (e) => {
	e.waitUntil(caches.open(APP).then((c) => c.addAll(BESTANDEN)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
	e.waitUntil(
		caches
			.keys()
			.then((sleutels) => Promise.all(sleutels.filter((k) => k.startsWith('fits-app-') && k !== APP).map((k) => caches.delete(k))))
			.then(() => self.clients.claim())
	);
});

// Pagina's die je in de gym nodig hebt; die bewaren we als je ze opent.
const BEWAAR = /^\/($|training\/|schema|oefeningen|eten($|\?|\/$)|logboek)/;

self.addEventListener('fetch', (e) => {
	const v = e.request;
	if (v.method !== 'GET') return;
	const url = new URL(v.url);
	if (url.origin !== location.origin) return;

	// App-bestanden: van de telefoon.
	if (BESTANDEN.includes(url.pathname)) {
		e.respondWith(caches.match(url.pathname).then((r) => r ?? fetch(v)));
		return;
	}

	// Pagina's en hun gegevens (SvelteKit haalt bij doorklikken /…/__data.json op).
	const pad = url.pathname.replace(/\/__data\.json$/, '') || '/';
	const isPagina = v.mode === 'navigate' || url.pathname.endsWith('/__data.json');
	if (!isPagina || !BEWAAR.test(pad)) return;

	e.respondWith(
		(async () => {
			try {
				const antwoord = await fetch(v);
				// Alleen gewone, ingelogde pagina's bewaren (geen doorverwijzing naar inloggen).
				if (antwoord.ok && !antwoord.redirected) {
					const kopie = antwoord.clone();
					caches.open(PAGINAS).then((c) => c.put(v, kopie));
				}
				return antwoord;
			} catch {
				const bewaard = await caches.match(v);
				if (bewaard) return bewaard;
				if (v.mode === 'navigate') {
					return new Response(
						'<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Fits</title><body style="margin:0;font:16px system-ui;background:#0c0d10;color:#f3f2ec;display:grid;place-items:center;min-height:100vh;text-align:center;padding:24px"><div><h1 style="font-size:22px">Geen verbinding</h1><p style="color:#b4b7bf">Deze pagina heb je nog niet eerder geopend op deze telefoon. Open Vandaag of je training; die staan wel bewaard.</p><p><a href="/" style="color:#d7ff3a">Naar Vandaag</a></p></div>',
						{ headers: { 'content-type': 'text/html; charset=utf-8' } }
					);
				}
				return new Response('{"type":"error"}', { status: 503, headers: { 'content-type': 'application/json' } });
			}
		})()
	);
});

// Bij uitloggen: bewaarde pagina's weg (ze bevatten jouw gegevens).
self.addEventListener('message', (e) => {
	if (e.data === 'uitgelogd') e.waitUntil(caches.delete(PAGINAS));
});
