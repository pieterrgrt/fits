<script>
	/*
	  Kaart met OpenStreetMap-tegels (donker gemaakt, passend bij het designsysteem) en lijnen erop.
	  lijnen: [{ lijn: polyline | punten: [[lat, lon]…], kleur?, dik?, dekking? }]
	          kleur is een designtoken zonder streepjes ('koraal', 'accent', 'tekst-gedempt'), zodat licht en donker kloppen.
	  start:  [lat, lon] voor een startmarkering; onklik(lat, lon) maakt de kaart aanklikbaar.
	  Leaflet laadt pas in de browser (het gebruikt window).
	*/
	import { onMount } from 'svelte';
	import 'leaflet/dist/leaflet.css';
	import { decodeer } from '#lib/spoor.js';

	let { lijnen = [], start = null, onklik = null, hoogte = '22rem', passen = true, midden = null } = $props();

	let element;
	let L = $state(null);
	let kaart = $state(null);
	let laag, markering;
	let gepast = false;

	onMount(() => {
		let weg = false;
		import('leaflet').then((m) => {
			if (weg) return;
			L = m.default ?? m;
			kaart = L.map(element, { zoomControl: true, attributionControl: true, preferCanvas: true }).setView(midden ?? start ?? [52.09, 5.12], 13);
			L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
				maxZoom: 19,
				referrerPolicy: 'strict-origin-when-cross-origin',
				attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
			}).addTo(kaart);
			laag = L.layerGroup().addTo(kaart);
			kaart.on('click', (e) => onklik?.(e.latlng.lat, e.latlng.lng));
		});
		return () => {
			weg = true;
			kaart?.remove();
		};
	});

	// Lijnen tekenen en (de eerste keer, of als `passen` aan staat) de kaart erop laten passen.
	$effect(() => {
		if (!kaart) return;
		laag.clearLayers();
		const stijl = getComputedStyle(element);
		const kleur = (k) => stijl.getPropertyValue(`--${k}`).trim() || k;
		const grenzen = [];
		for (const l of lijnen) {
			const punten = l.punten ?? decodeer(l.lijn ?? '');
			if (punten.length < 2) continue;
			L.polyline(punten, { color: kleur(l.kleur ?? 'koraal'), weight: l.dik ?? 3, opacity: l.dekking ?? 0.85, lineJoin: 'round', interactive: false }).addTo(laag);
			grenzen.push(...punten);
		}
		if (grenzen.length && (passen || !gepast)) {
			kaart.fitBounds(L.latLngBounds(grenzen), { padding: [16, 16], maxZoom: 16 });
			gepast = true;
		}
	});

	$effect(() => {
		if (!kaart) return;
		markering?.remove();
		const stijl = getComputedStyle(element);
		markering = start
			? L.circleMarker(start, { radius: 8, color: stijl.getPropertyValue('--achtergrond').trim(), weight: 3, fillColor: stijl.getPropertyValue('--accent').trim(), fillOpacity: 1 }).addTo(kaart)
			: null;
		if (start && !lijnen.length) kaart.setView(start, Math.max(kaart.getZoom(), 14));
	});

	export const centreer = (p, zoom = 15) => kaart?.setView(p, zoom);
</script>

<div class="kaart-vak" style:height={hoogte} class:klikbaar={!!onklik} bind:this={element}></div>

<style>
	.kaart-vak { width: 100%; border-radius: var(--hoek-l); overflow: hidden; background: var(--vlak-hoog); z-index: 0; }
	.klikbaar:global(.leaflet-container) { cursor: crosshair; }
	/* Tegels donker: omkeren en de kleuren terugdraaien, zodat water blauw en parken groen blijven. */
	.kaart-vak { --tegels: invert(1) hue-rotate(180deg) brightness(0.9) contrast(0.9) saturate(0.6); }
	@media (prefers-color-scheme: light) {
		:global(:root:not([data-thema='donker'])) .kaart-vak { --tegels: saturate(0.7); }
	}
	:global(:root[data-thema='licht']) .kaart-vak { --tegels: saturate(0.7); }
	.kaart-vak :global(.leaflet-tile-pane) { filter: var(--tegels); }
	.kaart-vak :global(.leaflet-control-attribution) { background: rgb(0 0 0 / 0.55); color: var(--tekst-gedempt); font-size: 10px; }
	.kaart-vak :global(.leaflet-control-attribution a) { color: var(--tekst-rustig); }
	.kaart-vak :global(.leaflet-bar a) { background: var(--vlak); color: var(--tekst); border-color: var(--lijn); }
</style>
