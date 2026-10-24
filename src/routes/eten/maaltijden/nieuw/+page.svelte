<script>
	import Icoon from '#lib/Icoon.svelte';
	import { voor, optellen } from '#lib/voeding.js';

	let { form } = $props();
	let naam = $state('');
	let porties = $state(4);
	let items = $state([]);
	let q = $state('');
	let gevonden = $state([]);
	let timer;

	function typ() {
		clearTimeout(timer);
		if (q.trim().length < 2) return (gevonden = []);
		timer = setTimeout(async () => (gevonden = (await fetch(`/eten/zoek?q=${encodeURIComponent(q.trim())}`).then((r) => r.json())).lokaal.slice(0, 8)), 200);
	}
	async function online() {
		const r = await fetch(`/eten/zoek?online=1&q=${encodeURIComponent(q.trim())}`).then((x) => x.json());
		gevonden = [...r.lokaal, ...(r.online ?? [])].slice(0, 16);
	}
	const kies = (p) => {
		items.push({ p, gram: p.porties?.[0]?.[1] ?? 100 });
		q = '';
		gevonden = [];
	};
	const totaal = $derived(optellen(items.map((i) => voor(i.p, Number(String(i.gram).replace(',', '.')) || 0))));
</script>

<main class="app stapel">
	<a class="knop stil klein" style="align-self: flex-start" href="/eten/maaltijden"><Icoon naam="terug" grootte={16} /> Mijn maaltijden</a>
	<header class="paginakop"><h1>Recept maken</h1></header>

	<form method="POST" class="stapel">
		<div class="kaart raster twee">
			<label class="veld"><span>Naam</span><input name="naam" bind:value={naam} placeholder="bv. Pasta kip pesto" required /></label>
			<label class="veld"><span>Porties</span><input name="porties" inputmode="numeric" bind:value={porties} /></label>
		</div>

		<section class="kaart stapel">
			<h3>Ingrediënten</h3>
			{#each items as it, i}
				<div class="ingredient">
					<input type="hidden" name="product" value={it.p.id} />
					<span class="naam">{it.p.naam}</span>
					<label class="gram"><input class="invoer" name="gram" inputmode="decimal" bind:value={it.gram} aria-label="Gram {it.p.naam}" /><span>{it.p.eenheid}</span></label>
					<button type="button" class="knop stil vierkant klein" aria-label="Weg" onclick={() => items.splice(i, 1)}><Icoon naam="kruis" grootte={16} /></button>
				</div>
			{/each}
			<input class="invoer" type="search" placeholder="Ingrediënt zoeken" bind:value={q} oninput={typ} aria-label="Ingrediënt zoeken" />
			{#if gevonden.length}
				<ul class="lijst">
					{#each gevonden as p (p.id)}<li><button type="button" class="kies" onclick={() => kies(p)}><span>{p.naam}{p.merk ? ` · ${p.merk}` : ''}</span><Icoon naam="plus" grootte={16} /></button></li>{/each}
				</ul>
			{/if}
			{#if q.trim().length >= 2}<button type="button" class="knop klein stil" onclick={online}>Ook in merkproducten zoeken</button>{/if}
		</section>

		{#if items.length}
			<div class="kaart raster drie">
				<div class="stat"><span class="label">Per portie</span><span class="waarde" style="color: var(--amber)">{Math.round(totaal.kcal / (porties || 1))}<small>kcal</small></span></div>
				<div class="stat"><span class="label">Eiwit</span><span class="waarde">{Math.round(totaal.eiwit / (porties || 1))}<small>g</small></span></div>
				<div class="stat"><span class="label">Totaal</span><span class="waarde">{Math.round(totaal.kcal)}<small>kcal</small></span></div>
			</div>
		{/if}
		{#if form?.fout}<p class="melding fout">{form.fout}</p>{/if}
		<button class="knop primair groot">Recept opslaan</button>
	</form>
</main>

<style>
	.ingredient { display: grid; grid-template-columns: 1fr 6.5rem 2rem; gap: var(--r-2); align-items: center; }
	.ingredient .naam { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 550; }
	.gram { position: relative; }
	.gram input { padding-right: 2.2rem; text-align: right; }
	.gram span { position: absolute; right: 0.6rem; top: 50%; transform: translateY(-50%); font-size: var(--maat-xs); color: var(--tekst-gedempt); }
	.kies { all: unset; box-sizing: border-box; width: 100%; display: flex; justify-content: space-between; gap: var(--r-2); cursor: pointer; }
	.kies:focus-visible { outline: 2px solid var(--accent); }
</style>
