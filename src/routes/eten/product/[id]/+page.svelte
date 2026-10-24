<script>
	import { untrack } from 'svelte';
	import { enhance } from '$app/forms';
	import Icoon from '#lib/Icoon.svelte';
	import { MAALTIJDEN, voor } from '#lib/voeding.js';
	import { getal } from '#lib/gewicht.js';

	let { data, form } = $props();
	const p = $derived(data.product);

	// Standaard: wat je de vorige keer nam, anders de eerste portie, anders 100 g.
	const start = untrack(() => {
		const pr = data.product;
		const vorigePortie = data.vorige?.portie && pr.porties.find(([n]) => data.vorige.portie.includes(`× ${n} (`));
		if (vorigePortie) return { portie: vorigePortie[0], aantal: Math.round((data.vorige.hoeveelheid / vorigePortie[1]) * 100) / 100 };
		if (data.vorige) return { portie: '', aantal: data.vorige.hoeveelheid };
		if (pr.porties.length) return { portie: pr.porties[0][0], aantal: 1 };
		return { portie: '', aantal: 100 };
	});
	let portie = $state(start.portie);
	let aantal = $state(start.aantal);
	let maaltijd = $state(untrack(() => data.maaltijd) ?? standaardMaaltijd());

	function standaardMaaltijd() {
		const u = new Date().getHours();
		return u < 10 ? 'ontbijt' : u < 14 ? 'lunch' : u < 17 ? 'tussendoor' : u < 21 ? 'avond' : 'tussendoor';
	}
	const gram = $derived((portie ? (p.porties.find(([n]) => n === portie)?.[1] ?? 0) : 1) * (Number(String(aantal).replace(',', '.')) || 0));
	const w = $derived(voor(p, gram));
	const RIJEN = [
		['kcal', 'Energie', 'kcal'],
		['eiwit', 'Eiwit', 'g'],
		['koolh', 'Koolhydraten', 'g'],
		['suiker', 'waarvan suikers', 'g'],
		['vet', 'Vet', 'g'],
		['vezels', 'Vezels', 'g']
	];
	const stap = (n) => (aantal = Math.max(0, Math.round(((Number(String(aantal).replace(',', '.')) || 0) + n) * 100) / 100));
</script>

<main class="app stapel">
	<header class="rij uiteen">
		<a class="knop stil klein" href={data.maaltijd ? `/eten/toevoegen?maaltijd=${data.maaltijd}&datum=${data.datum}` : `/eten?datum=${data.datum}`}><Icoon naam="terug" grootte={16} /> Terug</a>
		<form method="POST" action="?/favoriet" use:enhance>
			<button class="knop stil vierkant hart" class:aan={data.favoriet} aria-label={data.favoriet ? 'Uit favorieten' : 'Favoriet maken'} aria-pressed={data.favoriet}>
				<svg width="22" height="22" viewBox="0 0 24 24" fill={data.favoriet ? 'currentColor' : 'none'} stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M12 20s-7-4.4-9-9.2C1.6 7.3 3.8 4 7.2 4c2 0 3.6 1.2 4.8 2.8C13.2 5.2 14.8 4 16.8 4c3.4 0 5.6 3.3 4.2 6.8C19 15.6 12 20 12 20z" /></svg>
			</button>
		</form>
	</header>

	<header class="paginakop" style="margin-bottom: 0">
		<span class="label" style="color: var(--amber)">{p.bron === 'off' ? `Open Food Facts${p.barcode ? ' · ' + p.barcode : ''}` : p.bron === 'eigen' ? 'Eigen product' : 'Basislijst'}</span>
		<h1>{p.naam}</h1>
		{#if p.merk}<p class="rustig" style="margin:0">{p.merk}</p>{/if}
	</header>

	<form method="POST" action="?/toevoegen" class="kaart stapel">
		<input type="hidden" name="datum" value={data.datum} />
		<div class="hoeveel">
			<div class="stepper">
				<button type="button" onclick={() => stap(portie ? -0.5 : -10)} aria-label="Minder">−</button>
				<input name="aantal" inputmode="decimal" bind:value={aantal} aria-label="Hoeveelheid" />
				<button type="button" onclick={() => stap(portie ? 0.5 : 10)} aria-label="Meer">+</button>
			</div>
			<select name="portie" class="invoer" bind:value={portie} aria-label="Eenheid" onchange={() => (aantal = portie ? 1 : 100)}>
				<option value="">{p.eenheid}</option>
				{#each p.porties as [naam, g]}<option value={naam}>{naam} ({getal(g)} {p.eenheid})</option>{/each}
			</select>
		</div>

		<div class="kcal">
			<span class="groot-cijfer">{Math.round(w.kcal ?? 0)}</span>
			<span class="label">kcal · {getal(Math.round(gram))} {p.eenheid}</span>
		</div>
		<div class="raster drie">
			<div class="stat"><span class="label">Eiwit</span><span class="waarde" style="color: var(--amber)">{getal(w.eiwit)}<small>g</small></span></div>
			<div class="stat"><span class="label">Koolh.</span><span class="waarde">{getal(w.koolh)}<small>g</small></span></div>
			<div class="stat"><span class="label">Vet</span><span class="waarde">{getal(w.vet)}<small>g</small></span></div>
		</div>

		<div class="maaltijden" role="radiogroup" aria-label="Maaltijd">
			{#each MAALTIJDEN as m}
				<label class="chip" class:gekozen={maaltijd === m.id}><input type="radio" name="maaltijd" value={m.id} bind:group={maaltijd} class="verborgen" />{m.naam}</label>
			{/each}
		</div>
		{#if form?.fout}<p class="melding fout">{form.fout}</p>{/if}
		<button class="knop primair groot vol-breed" disabled={!gram}>Toevoegen</button>
	</form>

	<section class="kaart">
		<table class="voedingswaarden tnum">
			<thead><tr><th>Voedingswaarde</th><th>per 100 {p.eenheid}</th><th>deze portie</th></tr></thead>
			<tbody>
				{#each RIJEN as [k, naam, e]}
					{#if p[k] != null}
						<tr class:sub={k === 'suiker'}><td>{naam}</td><td>{getal(p[k])} {e}</td><td>{getal(w[k])} {e}</td></tr>
					{/if}
				{/each}
				{#if p.zout != null}<tr><td>Zout</td><td>{getal(p.zout)} g</td><td>{getal(Math.round(p.zout * gram) / 100)} g</td></tr>{/if}
			</tbody>
		</table>
		{#if p.bron === 'basis'}<p class="klein gedempt" style="margin: var(--r-3) 0 0">Richtwaarden. Scan de barcode voor de precieze waarden van een merk.</p>{/if}
		{#if p.bron === 'off'}<p class="klein gedempt" style="margin: var(--r-3) 0 0">Gegevens van <a href="https://nl.openfoodfacts.org/product/{p.barcode}" target="_blank" rel="noopener">Open Food Facts</a>, ingevoerd door vrijwilligers.</p>{/if}
	</section>

	{#if p.bron === 'eigen'}
		<form method="POST" action="?/verwijder" onsubmit={(e) => { if (!confirm('Dit product verwijderen? Je dagboek blijft kloppen.')) e.preventDefault(); }}>
			<button class="knop stil klein" style="color: var(--fout)">Eigen product verwijderen</button>
		</form>
	{/if}
</main>

<style>
	.hoeveel { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: var(--r-2); }
	.hoeveel .stepper input { font-size: 1.15rem; font-stretch: 100%; }
	.kcal { display: flex; flex-direction: column; align-items: center; gap: var(--r-1); padding: var(--r-3) 0; }
	.kcal .groot-cijfer { color: var(--amber); }
	.maaltijden { display: flex; flex-wrap: wrap; gap: var(--r-1); }
	.maaltijden .chip { cursor: pointer; }
	.maaltijden .chip.gekozen { background: var(--accent); color: var(--op-accent); }
	.maaltijden .chip:focus-within { outline: 2px solid var(--accent); }
	.hart { color: var(--tekst-gedempt); }
	.hart.aan { color: var(--koraal); }
	.voedingswaarden { width: 100%; border-collapse: collapse; font-size: var(--maat-s); }
	.voedingswaarden th { text-align: left; font-size: var(--maat-xs); color: var(--tekst-gedempt); font-weight: 600; padding-bottom: var(--r-2); }
	.voedingswaarden td { padding: var(--r-1) 0; border-top: 1px solid var(--lijn); }
	.voedingswaarden td + td, .voedingswaarden th + th { text-align: right; }
	.voedingswaarden tr.sub td:first-child { padding-left: var(--r-3); color: var(--tekst-rustig); }
</style>
