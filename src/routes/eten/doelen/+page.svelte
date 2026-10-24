<script>
	import { enhance } from '$app/forms';
	import Icoon from '#lib/Icoon.svelte';
	import { getal } from '#lib/gewicht.js';
	let { data, form } = $props();
	const p = $derived(data.profiel);
	const d = $derived(data.doelen);
</script>

<main class="app stapel">
	<a class="knop stil klein" style="align-self: flex-start" href="/eten"><Icoon naam="terug" grootte={16} /> Eten</a>
	<header class="paginakop">
		<span class="label" style="color: var(--amber)">Uit je schema: eiwit 1,8–2 g/kg, +300–500 kcal</span>
		<h1>Doelen eten</h1>
	</header>

	<div class="kaart raster vier">
		<div class="stat"><span class="label">kcal</span><span class="waarde" style="color: var(--amber)">{d.kcal}</span></div>
		<div class="stat"><span class="label">Eiwit</span><span class="waarde">{d.eiwit[0]}–{d.eiwit[1]}<small>g</small></span></div>
		<div class="stat"><span class="label">Koolh.</span><span class="waarde">{d.koolh}<small>g</small></span></div>
		<div class="stat"><span class="label">Vet</span><span class="waarde">{d.vet}<small>g</small></span></div>
	</div>

	<form method="POST" class="kaart stapel" use:enhance={() => async ({ update }) => update({ reset: false })}>
		<label class="veld"><span>Lichaamsgewicht (kg)</span><input name="gewicht" inputmode="decimal" value={p.gewicht ? getal(p.gewicht) : ''} /><small>Je laatst gelogde gewicht telt; dit is de terugval.</small></label>
		<label class="veld"><span>Onderhoud (kcal per dag)</span><input name="onderhoud" inputmode="numeric" value={p.onderhoud ?? ''} placeholder="bv. 2600" /><small>Weet je het niet? Gewicht × 33 is een begin. Blijft je gewicht 2 weken gelijk terwijl je zo eet, dan is dat je onderhoud.</small></label>
		<label class="veld"><span>Eigen caloriedoel (optioneel)</span><input name="doel_kcal" inputmode="numeric" value={p.doel_kcal ?? ''} placeholder="leeg = onderhoud + 400" /></label>
		<label class="veld"><span>Vet (% van de calorieën)</span><input name="vet" inputmode="numeric" value={p.vet ?? 25} /><small>Koolhydraten vullen de rest aan.</small></label>
		<label class="veld"><span>Water per dag (ml)</span><input name="doel_water" inputmode="numeric" value={p.doel_water ?? ''} placeholder="2500" /></label>
		{#if form?.fout}<p class="melding fout">{form.fout}</p>{/if}
		<button class="knop primair">{form?.ok ? 'Opgeslagen ✓' : 'Opslaan'}</button>
	</form>
</main>
