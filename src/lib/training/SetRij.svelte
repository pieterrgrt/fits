<script>
	// Eén set: gewicht, reps (stepper), hoeveel je nog had gekund, en opslaan.
	import { untrack } from 'svelte';
	import { enhance } from '$app/forms';
	import Icoon from '#lib/Icoon.svelte';
	import { getal } from '#lib/gewicht.js';

	let { item, nr, gedaan = null, doelReps, standaardGewicht, sec = false, onopgeslagen } = $props();

	// Beginwaarden; daarna houdt de rij zijn eigen invoer bij (de rij wordt opnieuw gemaakt als de set verandert).
	const b = untrack(() => ({ g: gedaan?.gewicht ?? standaardGewicht ?? '', r: gedaan?.reps ?? doelReps ?? item.reps_min, i: gedaan?.rir ?? '' }));
	let gewicht = $state(b.g);
	let reps = $state(b.r);
	let rir = $state(b.i);
	let bezig = $state(false);
	let fout = $state('');
	const klaar = $derived(!!gedaan);
	const bijstellen = (n) => (reps = Math.max(0, Number(reps || 0) + n));
</script>

<form
	method="POST"
	action="?/set"
	class="set"
	class:klaar
	use:enhance={() => {
		bezig = true;
		fout = '';
		return async ({ result, update }) => {
			bezig = false;
			if (result.type === 'failure') fout = result.data?.fout ?? 'Niet opgeslagen';
			else {
				await update({ reset: false });
				onopgeslagen?.();
			}
		};
	}}
>
	<input type="hidden" name="item" value={item.id} />
	<input type="hidden" name="nr" value={nr} />
	<input type="hidden" name="rir" value={rir} />
	<span class="nr" aria-label="Set {nr}">{nr}</span>
	<label class="gewicht">
		<span class="verborgen">Gewicht set {nr}</span>
		<input name="gewicht" inputmode="decimal" bind:value={gewicht} placeholder="kg" class="invoer" />
		<span class="eenheid">{item.per_stuk ? '×2 ' : ''}{item.eenheid}</span>
	</label>
	<div class="stepper">
		<button type="button" onclick={() => bijstellen(sec ? -5 : -1)} aria-label="Minder">−</button>
		<input name="reps" type="number" inputmode="numeric" bind:value={reps} aria-label="{sec ? 'Seconden' : 'Reps'} set {nr}" />
		<button type="button" onclick={() => bijstellen(sec ? 5 : 1)} aria-label="Meer">+</button>
	</div>
	<button class="knop vierkant" class:primair={klaar} class:omlijnd={!klaar} disabled={bezig} aria-label={klaar ? `Set ${nr} bijwerken` : `Set ${nr} opslaan`}>
		<Icoon naam="vink" />
	</button>
	<div class="rir" role="group" aria-label="Hoeveel reps had je nog gekund?">
		<span class="klein gedempt">nog over:</span>
		{#each [0, 1, 2] as r}
			<button type="button" class="chip" aria-pressed={rir === r} onclick={() => (rir = rir === r ? '' : r)}>{r === 2 ? '2+' : r}</button>
		{/each}
		{#if doelReps}<span class="klein gedempt doel">doel {doelReps}{sec ? ' s' : ''}</span>{/if}
	</div>
	{#if fout}<p class="melding fout" style="grid-column: 1 / -1; margin: 0">{fout}</p>{/if}
</form>

<style>
	.set {
		display: grid;
		grid-template-columns: 1.5rem minmax(0, 6.5rem) minmax(0, 1fr) 2.75rem;
		gap: var(--r-2);
		align-items: center;
		padding: var(--r-2) 0;
		border-top: 1px solid var(--lijn);
	}
	.nr { font-family: var(--letter-display); font-stretch: var(--breed); font-weight: 800; color: var(--tekst-gedempt); text-align: center; }
	.klaar .nr { color: var(--accent-tekst); }
	.gewicht { position: relative; display: block; }
	.gewicht input { padding-right: 2.6rem; text-align: right; font-variant-numeric: tabular-nums; font-weight: 650; }
	.eenheid { position: absolute; right: 0.6rem; top: 50%; transform: translateY(-50%); font-size: var(--maat-xs); color: var(--tekst-gedempt); pointer-events: none; }
	.rir { grid-column: 2 / -1; display: flex; gap: var(--r-1); align-items: center; flex-wrap: wrap; }
	.rir .chip { height: 1.5rem; padding: 0 0.55rem; font-size: var(--maat-xs); }
	.doel { margin-left: auto; }
	.klaar .stepper { border-color: color-mix(in srgb, var(--accent) 40%, var(--lijn)); }
</style>
