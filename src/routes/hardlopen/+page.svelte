<script>
	import { enhance } from '$app/forms';
	import { mooi } from '#lib/datum.js';
	import Icoon from '#lib/Icoon.svelte';

	let { data, form } = $props();
	let bezig = $state(false);
	const NAMEN = { Run: 'Hardlopen', TrailRun: 'Trail', VirtualRun: 'Loopband', Ride: 'Fietsen', Walk: 'Wandelen', Hike: 'Hiken', Swim: 'Zwemmen' };
	const km = (m) => (m / 1000).toLocaleString('nl-NL', { maximumFractionDigits: 1 }) + ' km';
	const duur = (s) => (s ? `${Math.floor(s / 3600) ? Math.floor(s / 3600) + ':' : ''}${String(Math.floor((s % 3600) / 60)).padStart(Math.floor(s / 3600) ? 2 : 1, '0')}:${String(s % 60).padStart(2, '0')}` : '');
	const tempo = (s) => {
		if (!s.bewegend || !s.afstand || !s.soort.includes('Run')) return '';
		const p = Math.round(s.bewegend / (s.afstand / 1000));
		return `${Math.floor(p / 60)}:${String(p % 60).padStart(2, '0')}/km`;
	};
	const verzend = () => {
		bezig = true;
		return async ({ update }) => {
			await update();
			bezig = false;
		};
	};
</script>

<main class="app stapel ruim">
	<header class="paginakop">
		<span class="label">Routes leren en vinden</span>
		<h1>Hardlopen</h1>
		<p class="rustig">Je loopjes als sporen. Straks: een kaart van waar je al liep en rondjes over straten die nog nieuw zijn.</p>
	</header>

	<section class="raster twee">
		<div class="kaart stat"><span class="label">Deze maand</span><span class="waarde tnum">{km(data.totalen.afstandMaand)}</span><span class="klein gedempt">{data.totalen.aantalMaand} loopjes</span></div>
		<div class="kaart stat"><span class="label">Totaal</span><span class="waarde tnum">{km(data.totalen.afstand)}</span><span class="klein gedempt">{data.totalen.aantal} loopjes</span></div>
	</section>

	<details class="kaart toevoegen" open={!data.sporen.length || !!form?.fout}>
		<summary class="rij uiteen"><strong>Loopjes importeren</strong><Icoon naam="plus" grootte={18} /></summary>
		<form method="POST" action="?/upload" enctype="multipart/form-data" class="stapel" use:enhance={verzend}>
			<label class="veld"><span>GPX- of TCX-bestanden</span>
				<input type="file" name="bestanden" multiple accept=".gpx,.tcx,.gz,application/gpx+xml" required />
				<small>Ook .gpx.gz en .tcx.gz uit de Strava-export. Hetzelfde bestand twee keer doet niets.</small>
			</label>
			<button class="knop primair" disabled={bezig}>{bezig ? 'Bezig…' : 'Importeren'}</button>
		</form>
		{#if data.map}
			<form method="POST" action="?/map" class="stapel krap map" use:enhance={verzend}>
				<span class="klein rustig">Of alles uit de map op de server: <code>{data.map}</code> (bv. een uitgepakte Strava-export).</span>
				<button class="knop omlijnd" disabled={bezig}>Map importeren</button>
			</form>
		{/if}
	</details>

	{#if form?.fout}<p class="melding fout">{form.fout}</p>{/if}
	{#if form?.import}
		{@const t = form.import}
		<p class="melding">
			<strong>{t.nieuw} nieuw</strong>{t.dubbel ? ` · ${t.dubbel} had je al` : ''}{t.fit ? ` · ${t.fit} FIT-bestanden overgeslagen (komt later)` : ''}{t.fout ? ` · ${t.fout} niet gelukt` : ''}
			{#each t.fouten as f}<br /><span class="klein">{f}</span>{/each}
		</p>
	{/if}

	{#if data.sporen.length}
		<section class="stapel krap">
			{#each data.sporen as s (s.id)}
				<div class="kaart spoor">
					<svg viewBox="0 0 48 48" class="vorm" aria-hidden="true"><path d={s.vorm} /></svg>
					<span class="stapel krap" style="gap: 2px; min-width: 0">
						<strong class="afkappen">{s.naam ?? NAMEN[s.soort] ?? s.soort}</strong>
						<span class="klein gedempt">{s.datum ? mooi(s.datum, { dag: true, jaar: true }) : 'zonder datum'} · {NAMEN[s.soort] ?? s.soort}</span>
					</span>
					<span class="stapel krap tnum" style="gap: 2px; text-align: right">
						<strong>{km(s.afstand)}</strong>
						<span class="klein gedempt">{duur(s.bewegend || s.duur)} {tempo(s)}</span>
						<form method="POST" action="?/weg" use:enhance><input type="hidden" name="id" value={s.id} /><button class="knop klein stil" style="padding: 0; min-height: 0">Verwijderen</button></form>
					</span>
				</div>
			{/each}
			{#if data.sporen.length >= 100}<p class="klein gedempt">De laatste 100 loopjes.</p>{/if}
		</section>
	{:else}
		<p class="leeg">Nog geen loopjes. Importeer GPX-bestanden van je horloge, telefoon of Strava.</p>
	{/if}
</main>

<style>
	.spoor { display: grid; grid-template-columns: 3rem 1fr auto; gap: var(--r-3); align-items: center; padding: var(--r-3); }
	.vorm { width: 3rem; height: 3rem; border-radius: var(--hoek-m); background: var(--koraal-tint); }
	.vorm path { fill: none; stroke: var(--koraal); stroke-width: 2; stroke-linejoin: round; stroke-linecap: round; }
	.afkappen { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	.toevoegen summary { list-style: none; }
	.toevoegen form { margin-top: var(--r-4); }
	.map { padding-top: var(--r-4); border-top: var(--rand) solid var(--lijn); }
	.map .knop { align-self: flex-start; }
	.map code { word-break: break-all; }
</style>
