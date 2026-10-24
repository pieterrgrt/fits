<script>
	import { enhance } from '$app/forms';
	import { untrack } from 'svelte';
	import Icoon from '#lib/Icoon.svelte';
	import { mooi, dagenTussen, plusDagen } from '#lib/datum.js';

	let { data, form } = $props();
	const KANTEN = ['voor', 'zij', 'achter'];
	const NAAM = { voor: 'Voor', zij: 'Zij', achter: 'Achter' };

	let datum = $state(untrack(() => data.vandaag));
	let voorbeeld = $state({}); // kant → object-URL
	let bezig = $state(false);
	let fout = $state('');

	// Vergelijken: standaard je eerste en je laatste reeks.
	let a = $state(untrack(() => data.reeksen.at(-1)?.datum));
	let b = $state(untrack(() => data.reeksen[0]?.datum));
	let kant = $state('voor');
	const reeks = (d) => data.reeksen.find((r) => r.datum === d);
	const volgende = $derived(data.reeksen[0] ? plusDagen(data.reeksen[0].datum, 28) : null);

	function kies(k, e) {
		const f = e.currentTarget.files?.[0];
		if (voorbeeld[k]) URL.revokeObjectURL(voorbeeld[k]);
		voorbeeld[k] = f ? URL.createObjectURL(f) : null;
	}

	/** Kleiner maken op de telefoon: lange kant 1440 px, JPEG (drie foto's blijven samen onder 2 MB). Scheelt upload en ruimte op de server. */
	async function verklein(bestand) {
		try {
			const beeld = await createImageBitmap(bestand, { imageOrientation: 'from-image' });
			const schaal = Math.min(1, 1440 / Math.max(beeld.width, beeld.height));
			const c = document.createElement('canvas');
			c.width = Math.round(beeld.width * schaal);
			c.height = Math.round(beeld.height * schaal);
			c.getContext('2d').drawImage(beeld, 0, 0, c.width, c.height);
			beeld.close?.();
			return await new Promise((klaar) => c.toBlob((blob) => klaar(blob ?? bestand), 'image/jpeg', 0.82));
		} catch {
			return bestand; // kan de browser hem niet lezen, dan stuurt hij het origineel
		}
	}

	const insturen = async ({ formData }) => {
		bezig = true;
		fout = '';
		for (const k of KANTEN) {
			const f = formData.get(k);
			if (f instanceof File && f.size) formData.set(k, await verklein(f), `${k}.jpg`);
		}
		return async ({ result, update }) => {
			bezig = false;
			await update();
			if (result.type === 'success') {
				for (const k of KANTEN) if (voorbeeld[k]) URL.revokeObjectURL(voorbeeld[k]);
				voorbeeld = {};
				b = result.data?.nieuw ?? b;
				a ??= b;
			} else if (result.type === 'error') fout = 'Uploaden lukte niet. Probeer het opnieuw met bereik.';
		};
	};
</script>

<main class="app stapel ruim">
	<header class="paginakop">
		<span class="label">Elke 4 weken · alleen op jouw server</span>
		<h1>Fotoverloop</h1>
		<p class="rustig">De weegschaal zegt weinig over spieren. Foto's wel: zelfde plek, zelfde licht, 's ochtends, ontspannen staan.</p>
	</header>

	{#if form?.fout || fout}<p class="melding fout">{form?.fout ?? fout}</p>{/if}
	{#if form?.nieuw}<p class="melding"><Icoon naam="vink" grootte={16} /> Foto's van {mooi(form.nieuw)} staan erin.</p>{/if}

	<!-- Nieuw -->
	<form method="POST" action="?/nieuw" enctype="multipart/form-data" class="kaart stapel" use:enhance={insturen}>
		<div class="rij uiteen">
			<h2>Nieuwe foto's</h2>
			{#if volgende}<span class="klein" class:gedempt={dagenTussen(data.vandaag, volgende) > 0}>{dagenTussen(data.vandaag, volgende) > 0 ? `volgende: ${mooi(volgende)}` : 'tijd voor nieuwe'}</span>{/if}
		</div>
		<div class="slots">
			{#each KANTEN as k}
				<label class="slot" style={voorbeeld[k] ? `background-image: url(${voorbeeld[k]})` : ''}>
					<input type="file" name={k} accept="image/*" class="verborgen" onchange={(e) => kies(k, e)} />
					{#if !voorbeeld[k]}<Icoon naam="foto" />{/if}
					<span class="kant">{NAAM[k]}</span>
				</label>
			{/each}
		</div>
		<div class="rij">
			<label class="veld" style="flex: 1"><span>Datum</span><input type="date" name="datum" bind:value={datum} max={data.vandaag} /></label>
			<button class="knop primair" style="align-self: flex-end" disabled={bezig || !Object.values(voorbeeld).some(Boolean)}>{bezig ? 'Bezig…' : 'Bewaar'}</button>
		</div>
		<p class="klein gedempt" style="margin:0">Je foto's gaan alleen naar je eigen Fits-server en zijn alleen te zien als je bent ingelogd. Ze zitten niet in de export.</p>
	</form>

	<!-- Vergelijken -->
	{#if data.reeksen.length >= 2}
		<section class="stapel">
			<h2>Vergelijk</h2>
			<div class="raster twee">
				<label class="veld"><span>Van</span>
					<select bind:value={a}>{#each data.reeksen as r}<option value={r.datum}>{mooi(r.datum, { jaar: true })}</option>{/each}</select>
				</label>
				<label class="veld"><span>Naar</span>
					<select bind:value={b}>{#each data.reeksen as r}<option value={r.datum}>{mooi(r.datum, { jaar: true })}</option>{/each}</select>
				</label>
			</div>
			<div class="kanten" role="radiogroup" aria-label="Kant">
				{#each KANTEN as k}<button type="button" class="chip" class:gekozen={kant === k} aria-pressed={kant === k} onclick={() => (kant = k)}>{NAAM[k]}</button>{/each}
			</div>
			<div class="naast">
				{#each [a, b] as d}
					{@const id = reeks(d)?.[kant]}
					<figure>
						{#if id}<img src="/fotos/{id}" alt="{NAAM[kant]}, {mooi(d)}" />{:else}<div class="geen klein gedempt">Geen {NAAM[kant].toLowerCase()}foto</div>{/if}
						<figcaption class="klein">{mooi(d)}</figcaption>
					</figure>
				{/each}
			</div>
			{#if a && b && a !== b}<p class="klein gedempt" style="margin:0">{Math.abs(dagenTussen(a, b))} dagen ertussen ({Math.round(Math.abs(dagenTussen(a, b)) / 7)} weken).</p>{/if}
		</section>
	{/if}

	<!-- Alle reeksen -->
	{#if data.reeksen.length}
		<section class="stapel">
			<h2>Alle foto's</h2>
			{#each data.reeksen as r (r.datum)}
				<div class="kaart stapel krap">
					<div class="rij uiteen">
						<strong>{mooi(r.datum, { jaar: true })}</strong>
						<form method="POST" action="?/weg" use:enhance={({ cancel }) => { if (!confirm(`Foto's van ${mooi(r.datum)} verwijderen?`)) cancel(); }}>
							<input type="hidden" name="datum" value={r.datum} />
							<button class="knop klein stil">Verwijder</button>
						</form>
					</div>
					<div class="duimen">
						{#each KANTEN as k}
							{#if r[k]}<img src="/fotos/{r[k]}" alt="{NAAM[k]}, {mooi(r.datum)}" loading="lazy" />{:else}<div class="geen"></div>{/if}
						{/each}
					</div>
				</div>
			{/each}
		</section>
	{:else}
		<p class="leeg">Nog geen foto's. Maak vandaag je eerste reeks; over 4 weken zie je het verschil naast elkaar.</p>
	{/if}
</main>

<style>
	.slots, .duimen { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--r-2); }
	.slot {
		position: relative; aspect-ratio: 3 / 4; border-radius: var(--hoek-m); cursor: pointer;
		display: grid; place-items: center; color: var(--tekst-gedempt);
		background: var(--vlak-hoog) center / cover no-repeat; border: 1px dashed var(--lijn-sterk);
	}
	.slot:focus-within { outline: 2px solid var(--accent); }
	.kant {
		position: absolute; left: var(--r-1); bottom: var(--r-1); padding: 0 0.4rem; border-radius: 999px;
		background: rgb(0 0 0 / 0.6); color: #fff; font-size: var(--maat-xs); font-weight: 650;
	}
	.kanten { display: flex; gap: var(--r-1); }
	.kanten .chip { cursor: pointer; border: 0; font: inherit; font-size: var(--maat-s); }
	.kanten .chip.gekozen { background: var(--accent); color: var(--op-accent); }
	.naast { display: grid; grid-template-columns: 1fr 1fr; gap: var(--r-2); }
	figure { margin: 0; display: grid; gap: var(--r-1); text-align: center; }
	img, .geen { width: 100%; aspect-ratio: 3 / 4; object-fit: cover; border-radius: var(--hoek-m); background: var(--vlak-hoog); }
	.geen { display: grid; place-items: center; }
</style>
