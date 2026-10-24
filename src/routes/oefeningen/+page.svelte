<script>
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { OEFENINGEN, SPIEREN } from '#lib/oefeningen.js';
	import Figuur from '#lib/figuur/Figuur.svelte';

	const GROEPEN = {
		alles: { naam: 'Alles' },
		borst: { naam: 'Borst', spieren: ['borst'] },
		rug: { naam: 'Rug', spieren: ['lats', 'midden-rug', 'onderrug', 'trapezius'] },
		schouders: { naam: 'Schouders', spieren: ['schouder-voor', 'schouder-zij', 'schouder-achter'] },
		armen: { naam: 'Armen', spieren: ['biceps', 'triceps', 'onderarm'] },
		benen: { naam: 'Benen', spieren: ['quadriceps', 'hamstrings', 'bil', 'kuiten', 'adductoren', 'abductoren'] },
		core: { naam: 'Core', spieren: ['buik'] },
		warmup: { naam: 'Warming-up' }
	};
	const groep = $derived(GROEPEN[page.url.searchParams.get('groep')] ? page.url.searchParams.get('groep') : 'alles');
	let zoek = $state('');
	const lijst = $derived(
		OEFENINGEN.filter((o) => {
			if (zoek && !o.naam.toLowerCase().includes(zoek.toLowerCase())) return false;
			if (groep === 'warmup') return o.soort === 'warming-up';
			if (groep === 'alles') return o.soort !== 'warming-up';
			return o.soort !== 'warming-up' && o.spieren.primair.some((s) => GROEPEN[groep].spieren.includes(s));
		})
	);
</script>

<main class="app breed stapel">
	<header class="paginakop">
		<span class="label">{OEFENINGEN.length} oefeningen met uitleg</span>
		<h1>Oefeningen</h1>
	</header>

	<div class="filters">
		{#each Object.entries(GROEPEN) as [sleutel, g]}
			<button class="chip" aria-pressed={groep === sleutel} onclick={() => goto(sleutel === 'alles' ? '?' : `?groep=${sleutel}`, { replaceState: true, noScroll: true, keepFocus: true })}>{g.naam}</button>
		{/each}
	</div>
	<input class="invoer" type="search" placeholder="Zoek een oefening" bind:value={zoek} aria-label="Zoek een oefening" />

	<div class="raster bib">
		{#each lijst as o (o.slug)}
			<a class="kaart oef" href="/oefeningen/{o.slug}">
				<div class="beeld"><Figuur anim={o.anim} klein label={o.naam} /></div>
				<strong>{o.naam}</strong>
				<span class="klein gedempt">{o.spieren.primair.map((s) => SPIEREN[s]).join(', ')}</span>
			</a>
		{:else}
			<p class="leeg">Niets gevonden.</p>
		{/each}
	</div>
</main>

<style>
	.filters { display: flex; gap: var(--r-1); overflow-x: auto; padding-bottom: 2px; scrollbar-width: none; }
	.bib { grid-template-columns: repeat(auto-fill, minmax(min(100%, 10rem), 1fr)); }
	.oef { display: flex; flex-direction: column; gap: var(--r-1); }
	.beeld { background: var(--vlak-hoog); border-radius: var(--hoek-m); padding: var(--r-2); margin-bottom: var(--r-2); }
</style>
