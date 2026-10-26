<script>
	import { verzend } from '#lib/verzend.js';
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import { mooi } from '#lib/datum.js';
	import { oefening } from '#lib/oefeningen.js';
	import { getal, repsTekst } from '#lib/gewicht.js';
	import { logTekst } from '#lib/logtekst.js';
	import Icoon from '#lib/Icoon.svelte';

	let { data, form } = $props();
	const t = $derived(data.training);
	const sets = $derived(data.groepen.reduce((a, g) => a + g.sets.length, 0));
	const volume = $derived(
		data.groepen.reduce((a, g) => a + g.sets.reduce((b, s) => b + (s.gewicht > 0 ? s.gewicht * (s.per_stuk ? 2 : 1) * (s.eenheid === 'lbs' ? 0.4536 : 1) * s.reps : 0), 0), 0)
	);
	const duur = $derived(t.eind ? Math.round((new Date(t.eind.replace(' ', 'T') + 'Z') - new Date(t.begin.replace(' ', 'T') + 'Z')) / 60000) : null);
	let gekopieerd = $state(false);
	const kopieer = async () => {
		await navigator.clipboard.writeText(logTekst(t, data.groepen));
		gekopieerd = true;
		setTimeout(() => (gekopieerd = false), 1500);
	};
</script>

<main class="app stapel">
	<a href="/logboek" class="knop stil klein" style="align-self: flex-start"><Icoon naam="terug" grootte={16} /> Logboek</a>
	<header class="paginakop">
		<span class="label">{mooi(t.datum, { dag: true, jaar: true })}</span>
		<h1>{page.url.searchParams.has('klaar') ? 'Goed gedaan.' : t.titel}</h1>
		{#if page.url.searchParams.has('klaar')}<p class="rustig">{t.titel} staat in je logboek. Zondag kijk je of er iets zwaarder mag.</p>{/if}
	</header>

	<div class="raster drie">
		<div class="kaart stat"><span class="label">Sets</span><span class="waarde">{sets}</span></div>
		<div class="kaart stat"><span class="label">Volume</span><span class="waarde">{getal(Math.round(volume / 100) / 10)}<small>ton</small></span></div>
		<div class="kaart stat"><span class="label">Tijd</span><span class="waarde">{duur ?? '–'}<small>min</small></span></div>
	</div>

	<section class="kaart">
		<ul class="lijst">
			{#each data.groepen as g}
				{@const o = oefening(g.slug)}
				<li class="rij uiteen">
					<a href="/oefeningen/{g.slug}" class="naam">{o?.naam ?? g.slug}</a>
					<span class="tnum"><span class="gedempt">{g.sets[0].gewicht != null ? `${g.sets[0].per_stuk ? '2× ' : ''}${getal(g.sets[0].gewicht)} ${g.sets[0].eenheid}` : ''}</span> <strong>{repsTekst(g.sets)}</strong></span>
				</li>
			{/each}
		</ul>
		{#if t.notitie}<hr /><p class="rustig" style="margin:0">Notitie: {t.notitie}</p>{/if}
		{#if t.extra}<p class="klein gedempt" style="margin: var(--r-2) 0 0">Twee-uursoptie {t.extra}</p>{/if}
	</section>

	<div class="rij">
		<button class="knop omlijnd" onclick={kopieer}><Icoon naam={gekopieerd ? 'vink' : 'logboek'} grootte={18} /> {gekopieerd ? 'Gekopieerd' : 'Kopieer als tekst'}</button>
		{#if data.strava}
			{#if t.strava_id}
				<a class="knop omlijnd" href="https://www.strava.com/activities/{t.strava_id}" target="_blank" rel="noopener">Bekijk op Strava ↗</a>
			{:else if data.strava.schrijven}
				<form method="POST" action="?/strava" use:enhance><button class="knop koraal-knop"><Icoon naam="omhoog" grootte={18} /> Zet op Strava</button></form>
			{:else}
				<a class="knop omlijnd" href="/strava/koppel?schrijven=1">Strava: ook trainingen plaatsen</a>
			{/if}
		{/if}
	</div>
	{#if form?.fout}<p class="melding fout">{form.fout}</p>{/if}

	<details class="klein">
		<summary class="gedempt">Meer</summary>
		<div class="rij" style="margin-top: var(--r-3)">
			<form method="POST" action="?/heropen" use:verzend><button class="knop klein omlijnd"><Icoon naam="bewerk" grootte={16} /> Sets aanpassen</button></form>
			<form method="POST" action="?/verwijder" use:verzend={{ bevestig: 'Deze training verwijderen?' }}>
				<button class="knop klein gevaar">Verwijderen</button>
			</form>
		</div>
	</details>
</main>

<style>
	.naam { font-weight: 600; text-decoration: none; }
	.koraal-knop { --knop-vlak: var(--koraal); --knop-tekst: #160604; }
</style>
