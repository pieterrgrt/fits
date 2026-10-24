<script>
	import { enhance } from '$app/forms';
	import { mooi, dagenTussen } from '#lib/datum.js';
	import Icoon from '#lib/Icoon.svelte';

	let { data, form } = $props();
	const deadline = $derived(data.doelen.find((d) => d.deadline)?.deadline);
	const behaald = $derived(data.doelen.filter((d) => d.behaald).length);
</script>

<main class="app stapel">
	<header class="paginakop">
		<span class="label">{deadline ? `Tot ${mooi(deadline)} · nog ${Math.max(0, Math.ceil(dagenTussen(data.vandaag, deadline) / 7))} weken` : 'Doelen'}</span>
		<h1>Doelen</h1>
		<p class="rustig">{behaald} van {data.doelen.length} gehaald. Fits rekent je voortgang uit je logboek.</p>
	</header>

	{#each data.doelen as d (d.id)}
		<article class="kaart doel" class:behaald={d.behaald}>
			<div class="rij uiteen" style="align-items: flex-start; flex-wrap: nowrap">
				<div class="stapel krap" style="gap: 2px">
					<strong>{d.tekst}</strong>
					{#if d.tekst !== d.oefening && d.oefening}<span class="klein gedempt">{d.oefening}</span>{/if}
				</div>
				{#if d.behaald}
					<span class="chip volt"><Icoon naam="vink" grootte={14} /> {mooi(d.behaald)}</span>
				{:else if d.soort === 'vrij'}
					<form method="POST" action="?/vink" use:enhance><input type="hidden" name="id" value={d.id} /><button class="chip omlijnd">Gehaald</button></form>
				{:else}
					<span class="groot tnum">{Math.round(d.waarde * 100)}%</span>
				{/if}
			</div>
			{#if d.soort !== 'vrij'}
				<div class="balk" role="progressbar" aria-valuenow={Math.round(d.waarde * 100)} aria-valuemin="0" aria-valuemax="100"><span style="--waarde: {d.waarde * 100}%"></span></div>
				<span class="klein rustig">{d.stand}</span>
			{/if}
		</article>
	{/each}

	<form method="POST" action="?/nieuw" class="kaart stapel" use:enhance>
		<h3>Eigen doel</h3>
		<label class="veld"><span>Doel</span><input name="tekst" placeholder="bv. 10 pull-ups achter elkaar" /></label>
		<label class="veld"><span>Wanneer</span><input name="deadline" type="date" /></label>
		{#if form?.fout}<p class="melding fout">{form.fout}</p>{/if}
		<button class="knop omlijnd"><Icoon naam="plus" grootte={18} /> Toevoegen</button>
	</form>
</main>

<style>
	.doel { display: flex; flex-direction: column; gap: var(--r-3); }
	.doel.behaald { border-color: color-mix(in srgb, var(--accent) 50%, var(--lijn)); }
	.groot { font-family: var(--letter-display); font-stretch: var(--breed); font-weight: 800; font-size: var(--maat-l); color: var(--accent-tekst); }
</style>
