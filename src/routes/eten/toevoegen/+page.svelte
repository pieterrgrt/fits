<script>
	import { untrack } from 'svelte';
	import { goto } from '$app/navigation';
	import { enhance } from '$app/forms';
	import Icoon from '#lib/Icoon.svelte';
	import Scanner from '#lib/eten/Scanner.svelte';
	import { MAALTIJDEN } from '#lib/voeding.js';
	import { getal } from '#lib/gewicht.js';

	let { data, form } = $props();
	const maaltijdNaam = $derived(MAALTIJDEN.find((m) => m.id === data.maaltijd).naam);
	const terug = $derived(`maaltijd=${data.maaltijd}&datum=${data.datum}`);

	let q = $state('');
	let lokaal = $state([]);
	let online = $state(null);
	let bezig = $state(false);
	let fout = $state('');
	let tab = $state(untrack(() => (data.recent.length ? 'recent' : 'favorieten')));
	let scannen = $state(false);
	let timer;

	function typ() {
		clearTimeout(timer);
		online = null;
		fout = '';
		if (q.trim().length < 2) return (lokaal = []);
		timer = setTimeout(async () => {
			const r = await fetch(`/eten/zoek?q=${encodeURIComponent(q.trim())}`).then((x) => x.json());
			lokaal = r.lokaal;
		}, 200);
	}
	async function zoekOnline() {
		bezig = true;
		fout = '';
		const r = await fetch(`/eten/zoek?online=1&q=${encodeURIComponent(q.trim())}`).then((x) => x.json()).catch(() => ({ online: [], fout: 'Geen verbinding.' }));
		bezig = false;
		lokaal = r.lokaal ?? lokaal;
		online = r.online ?? [];
		fout = r.fout ?? '';
	}
	async function gescand(code) {
		scannen = false;
		bezig = true;
		const r = await fetch(`/eten/barcode/${code}`);
		bezig = false;
		if (r.ok) {
			const p = await r.json();
			goto(`/eten/product/${encodeURIComponent(p.id)}?${terug}`);
		} else if (r.status === 404) {
			goto(`/eten/product/nieuw?barcode=${code}&${terug}`);
		} else fout = (await r.json()).fout;
	}
	const TABS = [
		['recent', 'Recent'],
		['favorieten', 'Favorieten'],
		['maaltijden', 'Maaltijden'],
		['eigen', 'Eigen'],
		['snel', 'Snel']
	];
</script>

{#snippet product(p)}
	<li>
		<a class="product" href="/eten/product/{encodeURIComponent(p.id)}?{terug}">
			<span class="stapel krap" style="gap: 0; min-width: 0">
				<span class="naam">{p.naam}</span>
				<span class="klein gedempt">{p.merk ? `${p.merk} · ` : ''}{Math.round(p.kcal)} kcal · {getal(p.eiwit)} g eiwit per 100 {p.eenheid}</span>
			</span>
			{#if p.bron === 'off'}<span class="chip omlijnd klein-chip">merk</span>{:else if p.bron === 'eigen'}<span class="chip klein-chip">eigen</span>{/if}
			<Icoon naam="plus" grootte={18} />
		</a>
	</li>
{/snippet}

<main class="app stapel">
	<header class="rij uiteen">
		<a class="knop stil klein" href="/eten?datum={data.datum}"><Icoon naam="terug" grootte={16} /> Eten</a>
		<span class="chip amber">{maaltijdNaam}</span>
	</header>

	{#if scannen}
		<Scanner ongevonden={gescand} sluit={() => (scannen = false)} />
	{:else}
		<div class="zoekbalk">
			<input class="invoer" type="search" placeholder="Zoek een product" bind:value={q} oninput={typ} aria-label="Zoek een product" autocomplete="off" />
			<button class="knop primair vierkant" onclick={() => (scannen = true)} aria-label="Barcode scannen"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M3 7V4h3M21 7V4h-3M3 17v3h3M21 17v3h-3M7 8v8M10 8v8M13 8v8M17 8v8" /></svg></button>
		</div>
	{/if}

	{#if fout}<p class="melding fout">{fout}</p>{/if}
	{#if form?.fout}<p class="melding fout">{form.fout}</p>{/if}

	{#if q.trim().length >= 2 && !scannen}
		<section class="stapel krap">
			{#if lokaal.length}
				<ul class="lijst kaart resultaten">{#each lokaal as p (p.id)}{@render product(p)}{/each}</ul>
			{:else}
				<p class="klein gedempt" style="margin:0">Niets in je eigen lijst gevonden.</p>
			{/if}
			{#if online === null}
				<button class="knop omlijnd" onclick={zoekOnline} disabled={bezig}>{bezig ? 'Zoeken…' : `Zoek "${q.trim()}" in merkproducten`}</button>
			{:else if online.length}
				<span class="label" style="margin-top: var(--r-3)">Open Food Facts</span>
				<ul class="lijst kaart resultaten">{#each online as p (p.id)}{@render product(p)}{/each}</ul>
			{:else if !fout}
				<p class="klein gedempt" style="margin:0">Ook online niets gevonden.</p>
			{/if}
			<a class="knop stil klein" href="/eten/product/nieuw?naam={encodeURIComponent(q.trim())}&{terug}">Zelf een product maken</a>
		</section>
	{:else if !scannen}
		<div class="filters">
			{#each TABS as [id, naam]}<button class="chip" aria-pressed={tab === id} onclick={() => (tab = id)}>{naam}</button>{/each}
		</div>

		{#if tab === 'recent'}
			{#if data.recent.length}<ul class="lijst kaart resultaten">{#each data.recent as p (p.id)}{@render product(p)}{/each}</ul>
			{:else}<p class="leeg">Wat je eet, komt hier. Zoek hierboven of scan een barcode.</p>{/if}
		{:else if tab === 'favorieten'}
			{#if data.favorieten.length}<ul class="lijst kaart resultaten">{#each data.favorieten as p (p.id)}{@render product(p)}{/each}</ul>
			{:else}<p class="leeg">Tik bij een product op het hartje om het hier te zetten.</p>{/if}
		{:else if tab === 'maaltijden'}
			{#each data.maaltijden as m (m.id)}
				<form method="POST" action="?/maaltijd&{terug}" class="kaart rij uiteen">
					<input type="hidden" name="id" value={m.id} />
					<span class="stapel krap" style="gap: 0; flex: 1; min-width: 0">
						<strong>{m.naam}</strong>
						<span class="klein gedempt">{m.items.length} producten · {Math.round(m.totaal.kcal / m.porties)} kcal · {Math.round(m.totaal.eiwit / m.porties)} g eiwit{m.porties > 1 ? ' per portie' : ''}</span>
					</span>
					<input class="invoer porties" name="porties" inputmode="decimal" value="1" aria-label="Porties" />
					<button class="knop primair vierkant" aria-label="{m.naam} toevoegen"><Icoon naam="plus" /></button>
				</form>
			{:else}
				<p class="leeg">Zet een maaltijd in je dagboek en kies "Bewaar als maaltijd". Of maak een <a href="/eten/maaltijden">recept</a>.</p>
			{/each}
		{:else if tab === 'eigen'}
			{#if data.eigen.length}<ul class="lijst kaart resultaten">{#each data.eigen as p (p.id)}{@render product(p)}{/each}</ul>{/if}
			<a class="knop omlijnd" href="/eten/product/nieuw?{terug}"><Icoon naam="plus" grootte={18} /> Eigen product maken</a>
		{:else}
			<form method="POST" action="?/snel&{terug}" class="kaart raster twee">
				<label class="veld" style="grid-column: 1 / -1"><span>Omschrijving</span><input name="naam" placeholder="bv. Lunch op het werk" /></label>
				<label class="veld"><span>kcal</span><input name="kcal" inputmode="numeric" required /></label>
				<label class="veld"><span>Eiwit (g)</span><input name="eiwit" inputmode="decimal" /></label>
				<label class="veld"><span>Koolhydraten (g)</span><input name="koolh" inputmode="decimal" /></label>
				<label class="veld"><span>Vet (g)</span><input name="vet" inputmode="decimal" /></label>
				<button class="knop primair" style="grid-column: 1 / -1">Toevoegen</button>
			</form>
		{/if}
	{/if}
</main>

<style>
	.zoekbalk { display: grid; grid-template-columns: 1fr 2.875rem; gap: var(--r-2); }
	.zoekbalk .knop { min-height: 2.875rem; width: 2.875rem; }
	.filters { display: flex; gap: var(--r-1); overflow-x: auto; scrollbar-width: none; }
	.resultaten { padding: var(--r-1) var(--r-3); }
	.product { display: grid; grid-template-columns: 1fr auto auto; gap: var(--r-2); align-items: center; text-decoration: none; color: inherit; }
	.product .naam { font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	.product :global(svg) { color: var(--accent-tekst); }
	.klein-chip { height: 1.35rem; font-size: 0.7rem; }
	.porties { width: 3.5rem; text-align: center; min-height: 2.75rem; padding: 0; }
</style>
