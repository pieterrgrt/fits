<script>
	import { mooi } from '#lib/datum.js';
	import { oefening } from '#lib/oefeningen.js';
	import { getal, repsTekst } from '#lib/gewicht.js';
	import Icoon from '#lib/Icoon.svelte';
	let { data } = $props();
</script>

<main class="app stapel">
	<header class="paginakop">
		<span class="label">Eén regel per oefening</span>
		<h1>Logboek</h1>
	</header>

	{#each data.trainingen as t (t.id)}
		<a class="kaart log" href="/logboek/{t.id}">
			<div class="rij uiteen">
				<span class="rij"><strong class="display">{t.titel}</strong>{#if t.extra}<span class="chip">+{t.extra}</span>{/if}{#if t.strava_id}<span class="chip koraal">Strava</span>{/if}</span>
				<span class="klein gedempt">{mooi(t.datum, { dag: true })}</span>
			</div>
			<ul class="regels tnum">
				{#each t.groepen as g}
					<li><span class="gedempt">{oefening(g.slug)?.kort ?? g.slug} {g.sets[0].gewicht != null ? getal(g.sets[0].gewicht) : ''}:</span> {repsTekst(g.sets)}</li>
				{/each}
			</ul>
			{#if t.notitie}<p class="klein rustig" style="margin:0">Notitie: {t.notitie}</p>{/if}
		</a>
	{:else}
		<div class="leeg stapel krap">
			<Icoon naam="logboek" grootte={32} />
			<strong>Nog geen trainingen</strong>
			<span class="klein">Start er een vanaf Vandaag. Elke set komt hier vanzelf in.</span>
		</div>
	{/each}

	{#if data.meer}<a class="knop omlijnd" href="?voor={data.meer}">Oudere trainingen</a>{/if}
</main>

<style>
	.log { display: flex; flex-direction: column; gap: var(--r-2); }
	.regels { list-style: none; margin: 0; padding: 0; font-size: var(--maat-s); display: grid; gap: 2px; }
</style>
