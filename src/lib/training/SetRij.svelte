<script>
	// Eén set: gewicht, reps (stepper), hoeveel je nog had gekund, en opslaan.
	import { untrack } from 'svelte';
	import { enhance } from '$app/forms';
	import Icoon from '#lib/Icoon.svelte';
	import { getal } from '#lib/gewicht.js';
	import { wachtrij } from './wachtrij.svelte.js';
	import { e1rm } from '#lib/groei.js';

	let { training, item, nr, gedaan = null, doelReps, standaardGewicht, beste = 0, sec = false, onopgeslagen } = $props();

	// Beginwaarden; daarna houdt de rij zijn eigen invoer bij (de rij wordt opnieuw gemaakt als de set verandert).
	// Een set die nog op de telefoon wacht, telt als gedaan.
	const wacht = $derived(wachtrij.voor(training, item.id, nr));
	const b = untrack(() => {
		const w = wachtrij.voor(training, item.id, nr);
		const g = w ? { gewicht: w.gewicht, reps: Number(w.reps), rir: w.rir === '' ? '' : Number(w.rir) } : gedaan;
		// Gewicht met een komma tonen (52,5); de server leest komma en punt.
		const gw = g?.gewicht ?? standaardGewicht ?? '';
		return { g: gw === '' || gw == null ? '' : String(gw).replace('.', ','), r: g?.reps ?? doelReps ?? item.reps_min, i: g?.rir ?? '' };
	});
	let gewicht = $state(b.g);
	let reps = $state(b.r);
	let rir = $state(b.i);
	let bezig = $state(false);
	let fout = $state('');
	const klaar = $derived(!!gedaan || !!wacht);
	// Hoger geschat maximum dan ooit op deze oefening: een record.
	const record = $derived(!sec && !!gedaan && beste > 0 && e1rm(gedaan.gewicht, gedaan.reps) > beste + 0.01);
	const opTelefoon = (cancel) => {
		wachtrij.bewaar({ training, item: item.id, nr, gewicht: String(gewicht ?? ''), reps: String(reps), rir: String(rir ?? '') });
		cancel?.();
		bezig = false;
		onopgeslagen?.();
	};
	const bijstellen = (n) => (reps = Math.max(0, Number(reps || 0) + n));
</script>

<form
	method="POST"
	action="?/set"
	class="set"
	class:klaar
	use:enhance={({ cancel }) => {
		fout = '';
		// Geen bereik: meteen op de telefoon bewaren, dan kun je door.
		if (!navigator.onLine) return opTelefoon(cancel);
		bezig = true;
		return async ({ result, update }) => {
			bezig = false;
			if (result.type === 'error') opTelefoon();
			else if (result.type === 'failure') fout = result.data?.fout ?? 'Niet opgeslagen';
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
		{#if record}<span class="chip volt record"><Icoon naam="omhoog" grootte={12} /> record</span>{/if}
		{#if wacht}<span class="klein wacht" title="Wordt verstuurd zodra er bereik is">op telefoon</span>{/if}
		{#if doelReps}<span class="klein gedempt doel">doel {doelReps}{sec ? ' s' : ''}</span>{/if}
	</div>
	{#if fout}<p class="melding fout" style="grid-column: 1 / -1; margin: 0">{fout}</p>{/if}
</form>

<style>
	.set {
		display: grid;
		/* nr · gewicht · reps · opslaan. De reps-kolom krijgt de meeste ruimte: "12" moet altijd passen. */
		grid-template-columns: 1.25rem minmax(4.25rem, 5rem) minmax(5.5rem, 1fr) 2.75rem;
		gap: 0.375rem;
		align-items: center;
		padding: var(--r-2) 0;
		border-top: 1px solid var(--lijn);
	}
	.nr { font-family: var(--letter-display); font-stretch: var(--breed); font-weight: 800; color: var(--tekst-gedempt); text-align: center; }
	.klaar .nr { color: var(--accent-tekst); }
	.gewicht { position: relative; display: block; }
	.gewicht input { padding: 0 2.1rem 0 0.4rem; text-align: right; font-variant-numeric: tabular-nums; font-weight: 650; }
	.eenheid { position: absolute; right: 0.45rem; top: 50%; transform: translateY(-50%); font-size: var(--maat-xs); color: var(--tekst-gedempt); pointer-events: none; }
	.rir { grid-column: 2 / -1; display: flex; gap: var(--r-1); align-items: center; flex-wrap: wrap; }
	.rir .chip { height: 1.5rem; padding: 0 0.55rem; font-size: var(--maat-xs); }
	.doel { margin-left: auto; }
	.record { height: 1.5rem; font-size: var(--maat-xs); }
	.wacht { color: var(--amber); font-weight: 600; }
	.set .stepper { grid-template-columns: 2.1rem minmax(2rem, 1fr) 2.1rem; }
	.set .stepper input { font-stretch: 100%; font-size: 1.3rem; padding: 0; }
	.klaar .stepper { border-color: color-mix(in srgb, var(--accent) 40%, var(--lijn)); }
</style>
