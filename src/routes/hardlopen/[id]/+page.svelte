<script>
	import Kaart from '#lib/hardlopen/Kaart.svelte';
	import Icoon from '#lib/Icoon.svelte';
	import { mooi } from '#lib/datum.js';
	let { data } = $props();
	const s = $derived(data.spoor);
	const km = (m) => (m / 1000).toLocaleString('nl-NL', { maximumFractionDigits: 2 }) + ' km';
	const tijd = (t) => (t ? `${Math.floor(t / 3600) ? Math.floor(t / 3600) + ':' : ''}${String(Math.floor((t % 3600) / 60)).padStart(Math.floor(t / 3600) ? 2 : 1, '0')}:${String(t % 60).padStart(2, '0')}` : '–');
	const tempo = $derived(s.bewegend && s.afstand ? Math.round(s.bewegend / (s.afstand / 1000)) : null);
	const nieuwTotaal = $derived(data.nieuweStraten.reduce((a, x) => a + x.m, 0));
</script>

<main class="app stapel ruim">
	<header class="paginakop">
		<a class="klein rustig terug" href="/hardlopen"><Icoon naam="terug" grootte={16} /> Hardlopen</a>
		<h1>{s.naam ?? 'Loopje'}</h1>
		<p class="rustig">{s.datum ? mooi(s.datum, { dag: true, jaar: true }) : 'Zonder datum'}{s.begin ? ` · ${s.begin.slice(11, 16)}` : ''}</p>
	</header>

	<Kaart lijnen={[{ lijn: s.lijn, kleur: 'koraal', dik: 4, dekking: 0.95 }]} />

	<section class="raster drie">
		<div class="kaart stat"><span class="label">Afstand</span><span class="waarde tnum">{km(s.afstand)}</span></div>
		<div class="kaart stat"><span class="label">Tijd</span><span class="waarde tnum">{tijd(s.bewegend || s.duur)}</span></div>
		<div class="kaart stat"><span class="label">Tempo</span><span class="waarde tnum">{tempo ? `${Math.floor(tempo / 60)}:${String(tempo % 60).padStart(2, '0')}` : '–'}<small>/km</small></span></div>
	</section>

	<section class="kaart stapel krap">
		<h2>Nieuwe straten</h2>
		{#if s.gematcht === 0}
			<p class="klein rustig" style="margin:0">Nog niet op straten gelegd. Ga naar <a href="/hardlopen">Hardlopen</a> en klik bij "Straten die je kent" op Bijwerken.</p>
		{:else if s.gematcht === 2}
			<p class="klein rustig" style="margin:0">Dit loopje beslaat een te groot gebied om op straten te leggen.</p>
		{:else if data.nieuweStraten.length}
			<p class="klein rustig" style="margin:0">{km(nieuwTotaal)} straat liep je met dit loopje voor het eerst.</p>
			<ul class="lijst">
				{#each data.nieuweStraten as st}<li class="rij uiteen"><span>{st.naam}</span><span class="klein gedempt tnum">{Math.round(st.m)} m</span></li>{/each}
			</ul>
		{:else}
			<p class="klein rustig" style="margin:0">Geen nieuwe straten: hier was je al eerder.</p>
		{/if}
	</section>
</main>

<style>
	.terug { display: inline-flex; gap: var(--r-1); align-items: center; text-decoration: none; }
	.drie { grid-template-columns: repeat(3, 1fr); }
</style>
