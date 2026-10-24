<script>
	import { DAGEN } from '#lib/datum.js';
	import { gewichtTekst } from '#lib/gewicht.js';
	import Icoon from '#lib/Icoon.svelte';
	let { data } = $props();
</script>

<main class="app stapel">
	<header class="paginakop">
		<span class="label">Push / Pull / Legs · 6 dagen</span>
		<h1>Schema</h1>
		<p class="rustig">Elke sessie: 5 min warming-up, 5 vaste oefeningen en 1 wisselslot. Ongeveer 18 werksets, klaar in 55–65 min. Gewichten verander je op zondag, niet in de gym.</p>
	</header>

	{#each data.dagen as d (d.id)}
		<a class="kaart dag" class:vandaag={d.weekdag === data.vandaag} href="/schema/{d.weekdag}">
			<div class="rij uiteen">
				<span class="label">{DAGEN[d.weekdag - 1]}{d.weekdag === data.vandaag ? ' · vandaag' : ''}</span>
				<Icoon naam="bewerk" grootte={16} />
			</div>
			<div class="rij" style="align-items: baseline">
				<h2>{d.titel}</h2>
				{#if d.focus}<span class="rustig">{d.focus}</span>{/if}
			</div>
			{#if d.items.length}
				<div class="chips">
					{#each d.items as it}
						<span class="chip" class:volt={it.wissel}>{it.wissel ? '⇄ ' : ''}{it.kort ?? 'wisselslot'}{#if it.gewicht}<span class="gedempt"> · {gewichtTekst(it, { eenheid: false })}</span>{/if}</span>
					{/each}
				</div>
			{/if}
		</a>
	{/each}
</main>

<style>
	.dag { display: flex; flex-direction: column; gap: var(--r-2); color: var(--tekst); }
	.dag.vandaag { border-color: var(--accent); }
	.dag.vandaag .label { color: var(--accent-tekst); }
	.chips { display: flex; flex-wrap: wrap; gap: var(--r-1); }
</style>
