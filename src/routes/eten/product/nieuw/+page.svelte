<script>
	import { verzend } from '#lib/verzend.js';
	import Icoon from '#lib/Icoon.svelte';
	let { data, form } = $props();
	const v = (k, s = '') => form?.[k] ?? s;
</script>

<main class="app stapel">
	<a class="knop stil klein" style="align-self: flex-start" href="/eten/toevoegen?{data.terug}"><Icoon naam="terug" grootte={16} /> Terug</a>
	<header class="paginakop">
		<span class="label" style="color: var(--amber)">{data.barcode ? `Barcode ${data.barcode} onbekend` : 'Eigen product'}</span>
		<h1>Product maken</h1>
		<p class="rustig">Neem de waarden over van het etiket, kolom "per 100 g" of "per 100 ml".</p>
	</header>

	<form method="POST" class="kaart raster twee" use:verzend>
		<input type="hidden" name="barcode" value={data.barcode} />
		<label class="veld" style="grid-column: 1 / -1"><span>Naam</span><input name="naam" required value={v('naam', data.naam)} /></label>
		<label class="veld"><span>Merk</span><input name="merk" value={v('merk')} /></label>
		<label class="veld"><span>Per 100</span><select name="eenheid"><option value="g">gram</option><option value="ml" selected={v('eenheid') === 'ml'}>ml</option></select></label>
		<label class="veld"><span>Energie (kcal)</span><input name="kcal" inputmode="decimal" required value={v('kcal')} /></label>
		<label class="veld"><span>Eiwit (g)</span><input name="eiwit" inputmode="decimal" value={v('eiwit')} /></label>
		<label class="veld"><span>Koolhydraten (g)</span><input name="koolh" inputmode="decimal" value={v('koolh')} /></label>
		<label class="veld"><span>waarvan suikers (g)</span><input name="suiker" inputmode="decimal" value={v('suiker')} /></label>
		<label class="veld"><span>Vet (g)</span><input name="vet" inputmode="decimal" value={v('vet')} /></label>
		<label class="veld"><span>Vezels (g)</span><input name="vezels" inputmode="decimal" value={v('vezels')} /></label>
		<label class="veld"><span>Portie heet</span><input name="portie_naam" placeholder="bv. reep, schep" value={v('portie_naam')} /></label>
		<label class="veld"><span>Portie (g of ml)</span><input name="portie_gram" inputmode="decimal" placeholder="optioneel" value={v('portie_gram')} /></label>
		{#if form?.fout}<p class="melding fout" style="grid-column: 1 / -1">{form.fout}</p>{/if}
		<button class="knop primair" style="grid-column: 1 / -1">Opslaan en kiezen</button>
	</form>
	<p class="klein gedempt">Eigen producten zie alleen jij. Een barcode die je invult, herkent de scanner de volgende keer.</p>
</main>
