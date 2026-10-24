<script>
	// Kies een andere oefening: eerst die voor dezelfde spieren, dan de rest per spiergroep.
	import { enhance } from '$app/forms';
	import Figuur from '#lib/figuur/Figuur.svelte';
	import Icoon from '#lib/Icoon.svelte';
	import { OEFENINGEN, SPIEREN, oefening } from '#lib/oefeningen.js';
	import { alternatieven, groepVan } from '#lib/alternatieven.js';

	/** @type {{ slug: string, actie: string, velden?: Record<string, any>, vandaag?: boolean, sluit: () => void }} */
	let { slug, actie, velden = {}, vandaag = false, sluit } = $props();

	const huidig = $derived(oefening(slug));
	const zelfde = $derived(alternatieven(slug));
	let zoek = $state('');
	let alles = $state(false);
	let bereik = $state('vandaag');
	const rest = $derived.by(() => {
		const q = zoek.trim().toLowerCase();
		const lijst = OEFENINGEN.filter((o) => o.soort !== 'warming-up' && o.slug !== slug && (q ? o.naam.toLowerCase().includes(q) : !zelfde.includes(o.slug)));
		const groepen = new Map();
		for (const o of lijst) {
			const g = groepVan(o.slug);
			groepen.set(g, [...(groepen.get(g) ?? []), o]);
		}
		return [...groepen.entries()];
	});
	const enter = () => async ({ update, result }) => {
		await update({ reset: false });
		if (result.type !== 'failure') sluit();
	};
</script>

<svelte:window onkeydown={(e) => e.key === 'Escape' && sluit()} />

<div class="achter" role="presentation" onclick={sluit}></div>
<div class="paneel" role="dialog" aria-modal="true" aria-label="Andere oefening kiezen">
	<header class="rij uiteen">
		<div class="stapel krap" style="gap: 0">
			<span class="label">Vervang</span>
			<strong>{huidig?.naam}</strong>
		</div>
		<button class="knop stil vierkant" onclick={sluit} aria-label="Sluiten"><Icoon naam="kruis" /></button>
	</header>

	<form method="POST" action={actie} class="stapel" use:enhance={enter}>
		{#each Object.entries(velden) as [k, v]}<input type="hidden" name={k} value={v} />{/each}

		{#if vandaag}
			<div class="bereik" role="radiogroup" aria-label="Voor wanneer">
				<label class="chip" class:gekozen={bereik === 'vandaag'}><input type="radio" name="bereik" value="vandaag" bind:group={bereik} class="verborgen" />Alleen vandaag</label>
				<label class="chip" class:gekozen={bereik === 'schema'}><input type="radio" name="bereik" value="schema" bind:group={bereik} class="verborgen" />Ook in mijn schema</label>
			</div>
			<p class="klein gedempt" style="margin:0">
				{bereik === 'vandaag' ? 'Bijvoorbeeld als het apparaat bezet is. Volgende week staat de oude oefening er weer.' : 'De nieuwe oefening komt op deze plek in je schema; je zoekt er eerst het gewicht voor.'}
			</p>
		{/if}

		{#if zelfde.length}
			<span class="label">Zelfde spieren · {huidig?.spieren.primair.map((m) => SPIEREN[m]).join(', ')}</span>
			<div class="opties">
				{#each zelfde as s (s)}
					{@const o = oefening(s)}
					<button class="optie" name="slug" value={s}>
						<span class="beeld"><Figuur anim={o.anim} klein speelt={false} label={o.naam} /></span>
						<span class="stapel krap" style="gap: 0; min-width: 0">
							<strong class="naam">{o.naam}</strong>
							<span class="klein gedempt">{o.spieren.primair.map((m) => SPIEREN[m]).join(', ')}</span>
						</span>
					</button>
				{/each}
			</div>
		{/if}

		{#if alles || !zelfde.length}
			<input class="invoer" type="search" placeholder="Zoek een oefening" bind:value={zoek} aria-label="Zoek een oefening" />
			{#each rest as [groep, lijst] (groep)}
				<span class="label">{groep}</span>
				<div class="opties">
					{#each lijst as o (o.slug)}
						<button class="optie" name="slug" value={o.slug}>
							<span class="beeld"><Figuur anim={o.anim} klein speelt={false} label={o.naam} /></span>
							<span class="stapel krap" style="gap: 0; min-width: 0">
								<strong class="naam">{o.naam}</strong>
								<span class="klein gedempt">{o.spieren.primair.map((m) => SPIEREN[m]).join(', ')}</span>
							</span>
						</button>
					{/each}
				</div>
			{/each}
		{:else}
			<button type="button" class="knop omlijnd" onclick={() => (alles = true)}>Andere spiergroep kiezen</button>
		{/if}
	</form>
</div>

<style>
	.achter { position: fixed; inset: 0; z-index: 40; background: rgb(0 0 0 / 0.55); }
	.paneel {
		position: fixed;
		z-index: 41;
		inset: auto 0 0 0;
		max-height: min(88dvh, 52rem);
		overflow-y: auto;
		margin-inline: auto;
		max-width: var(--breedte-app);
		display: flex;
		flex-direction: column;
		gap: var(--r-4);
		padding: var(--r-4) var(--r-4) calc(var(--r-5) + env(safe-area-inset-bottom));
		background: var(--vlak);
		border: 1px solid var(--lijn);
		border-radius: var(--hoek-l) var(--hoek-l) 0 0;
		box-shadow: 0 -20px 50px -20px rgb(0 0 0 / 0.6);
		animation: op var(--gewoon) var(--veer);
	}
	@keyframes op { from { transform: translateY(24px); opacity: 0; } }
	.paneel header { position: sticky; top: calc(-1 * var(--r-4)); background: var(--vlak); padding-top: var(--r-1); z-index: 1; }
	.bereik { display: flex; flex-wrap: wrap; gap: var(--r-1); }
	.bereik .chip { cursor: pointer; }
	.bereik .chip.gekozen { background: var(--accent); color: var(--op-accent); }
	.bereik .chip:focus-within { outline: 2px solid var(--accent); }
	.opties { display: grid; gap: var(--r-2); }
	.optie {
		all: unset;
		box-sizing: border-box;
		display: grid;
		grid-template-columns: 4.5rem 1fr;
		gap: var(--r-3);
		align-items: center;
		padding: var(--r-2);
		border-radius: var(--hoek-m);
		background: var(--vlak-hoog);
		border: 1px solid var(--lijn);
		cursor: pointer;
	}
	.optie:hover { border-color: var(--accent); }
	.optie:focus-visible { outline: 2px solid var(--accent); }
	.beeld { display: block; background: var(--vlak); border-radius: var(--hoek-s); }
	.naam { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style>
