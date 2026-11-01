<script>
	import { enhance, deserialize, applyAction } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
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
	// Nog loopjes over om op straten te leggen? Dan vanzelf verder (elke ronde blijft onder de minuut).
	// Lukt het wegennet ophalen een paar keer achter elkaar niet, dan stoppen (Overpass is dan even vol).
	let verder = $state();
	let rondes = 0, mislukt = 0;
	$effect(() => {
		const st = form?.straten;
		if (!st || bezig) return;
		mislukt = st.fout ? mislukt + 1 : 0;
		if (st.over && rondes < 200 && mislukt < 3) {
			rondes++;
			verder?.requestSubmit();
		}
	});
	const verzend = () => {
		bezig = true;
		return async ({ update }) => {
			await update();
			bezig = false;
		};
	};

	/*
	  Uploaden in porties: nginx laat hooguit 2 MB per verzoek door. Daarom pakt de browser elk bestand in (gzip,
	  GPX wordt ~10× kleiner) en stuurt ze in porties van hooguit 1,5 MB. De uitslagen worden opgeteld.
	*/
	const PORTIE = 1.5 * 1024 * 1024;
	let voortgang = $state('');
	async function inpakken(f) {
		if (/\.gz$/i.test(f.name) || typeof CompressionStream === 'undefined') return f;
		const blob = await new Response(f.stream().pipeThrough(new CompressionStream('gzip'))).blob();
		return new File([blob], f.name + '.gz');
	}
	async function upload(e) {
		e.preventDefault();
		const bestanden = [...e.currentTarget.bestanden.files];
		if (!bestanden.length) return;
		bezig = true;
		const totaal = { nieuw: 0, dubbel: 0, zonderGps: 0, fout: 0, fouten: [] };
		let straten = null, foutmelding = null;
		try {
			let portie = [], grootte = 0;
			const stuur = async () => {
				if (!portie.length) return;
				const fd = new FormData();
				for (const f of portie) fd.append('bestanden', f);
				const r = deserialize(await (await fetch('?/upload', { method: 'POST', body: fd, headers: { 'x-sveltekit-action': 'true' } })).text());
				if (r.type === 'success') {
					for (const k of ['nieuw', 'dubbel', 'zonderGps', 'fout']) totaal[k] += r.data.import[k];
					totaal.fouten.push(...r.data.import.fouten);
					straten = r.data.straten ?? straten;
				} else if (r.type === 'failure') foutmelding = r.data?.fout;
				else foutmelding = 'Uploaden lukte niet.';
				portie = [];
				grootte = 0;
			};
			for (let i = 0; i < bestanden.length; i++) {
				voortgang = `${i + 1} van ${bestanden.length}`;
				const f = await inpakken(bestanden[i]);
				if (f.size > PORTIE) {
					totaal.fout++;
					totaal.fouten.push(`${bestanden[i].name}: te groot (ook ingepakt meer dan 1,5 MB)`);
					continue;
				}
				if (grootte + f.size > PORTIE || portie.length >= 200) await stuur();
				portie.push(f);
				grootte += f.size;
			}
			await stuur();
		} catch {
			foutmelding = 'Uploaden lukte niet. Heb je verbinding?';
		}
		voortgang = '';
		bezig = false;
		e.target.reset();
		await applyAction(foutmelding && !totaal.nieuw ? { type: 'failure', status: 400, data: { fout: foutmelding } } : { type: 'success', status: 200, data: { import: totaal, straten } });
		await invalidateAll();
	}
</script>

<main class="app stapel ruim">
	<header class="paginakop">
		<span class="label">Routes leren en vinden</span>
		<h1>Hardlopen</h1>
		<p class="rustig">Je loopjes, de straten die je al kent en rondjes over straten die nog nieuw zijn.</p>
	</header>

	<section class="raster twee">
		<div class="kaart stat"><span class="label">Deze maand</span><span class="waarde tnum">{km(data.totalen.afstandMaand)}</span><span class="klein gedempt">{data.totalen.aantalMaand} loopjes</span></div>
		<div class="kaart stat"><span class="label">Totaal</span><span class="waarde tnum">{km(data.totalen.afstand)}</span><span class="klein gedempt">{data.totalen.aantal} loopjes</span></div>
	</section>

	<nav class="raster twee">
		<a class="knop primair" href="/hardlopen/rondje"><Icoon naam="route" /> Ontdekrondje</a>
		<a class="knop omlijnd" href="/hardlopen/kaart">Kaart</a>
	</nav>

	{#if data.sporen.length}
		{@const d = data.dekking}
		<section class="kaart stapel krap">
			<div class="rij uiteen">
				<span class="label">Straten die je kent</span>
				<form method="POST" action="?/straten" use:enhance={verzend} bind:this={verder}><button class="knop klein omlijnd" disabled={bezig}><Icoon naam="sync" grootte={16} /> {bezig ? 'Bezig…' : 'Bijwerken'}</button></form>
			</div>
			{#if d.totaal}
				<div class="rij" style="align-items: baseline"><span class="groot tnum">{Math.round((d.gelopen / d.totaal) * 100)}%</span><span class="rustig">van de straten in jouw gebied</span></div>
				<div class="balk"><span style:width="{Math.min(100, (d.gelopen / d.totaal) * 100)}%"></span></div>
				<span class="klein gedempt">{km(d.gelopen)} van {km(d.totaal)} · {d.namenGelopen} van {d.namen} straatnamen · {d.cellen} vakken van ~2 × 2 km</span>
			{:else}
				<span class="klein rustig">Nog niet berekend. Fits haalt het wegennet op uit OpenStreetMap en legt je loopjes erop.</span>
			{/if}
			{#if form?.straten}
				{@const st = form.straten}
				<span class="klein" class:fout-tekst={st.fout}>{st.fout ?? `${st.gedaan} loopjes op straten gelegd.`}{st.over ? ` Nog ${st.over} te gaan — Fits gaat vanzelf verder.` : ''}</span>
			{/if}
		</section>
	{/if}

	<details class="kaart toevoegen" open={!data.sporen.length || !!form?.fout}>
		<summary class="rij uiteen"><strong>Loopjes importeren</strong><Icoon naam="plus" grootte={18} /></summary>
		<form method="POST" action="?/upload" enctype="multipart/form-data" class="stapel" onsubmit={upload}>
			<label class="veld"><span>GPX-, TCX- of FIT-bestanden</span>
				<input type="file" name="bestanden" multiple accept=".gpx,.tcx,.fit,.gz,application/gpx+xml" required />
				<small>Ook .gz uit de Strava-export. Hetzelfde bestand twee keer doet niets.</small>
			</label>
			<button class="knop primair" disabled={bezig}>{voortgang ? `Bezig… ${voortgang}` : bezig ? 'Bezig…' : 'Importeren'}</button>
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
			<strong>{t.nieuw} nieuw</strong>{t.dubbel ? ` · ${t.dubbel} had je al` : ''}{t.zonderGps ? ` · ${t.zonderGps} zonder GPS (loopband, binnen) overgeslagen` : ''}{t.fout ? ` · ${t.fout} niet gelukt` : ''}
			{#each t.fouten as f}<br /><span class="klein">{f}</span>{/each}
			{#if form.straten?.fout}<br /><span class="klein">Straten: {form.straten.fout}</span>{/if}
		</p>
	{/if}

	{#if data.sporen.length}
		<section class="stapel krap">
			{#each data.sporen as s (s.id)}
				<div class="kaart spoor">
					<svg viewBox="0 0 48 48" class="vorm" aria-hidden="true"><path d={s.vorm} /></svg>
					<a class="stapel krap" style="gap: 2px; min-width: 0; text-decoration: none" href="/hardlopen/{s.id}">
						<strong class="afkappen">{s.naam ?? NAMEN[s.soort] ?? s.soort}</strong>
						<span class="klein gedempt">{s.datum ? mooi(s.datum, { dag: true, jaar: true }) : 'zonder datum'} · {NAMEN[s.soort] ?? s.soort}</span>
						{#if s.nieuw >= 100}<span class="klein accent">+{km(s.nieuw)} nieuwe straat</span>{/if}
					</a>
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
	.groot { font-family: var(--letter-display); font-stretch: var(--breed); font-weight: 800; font-size: var(--maat-xl); }
	.fout-tekst { color: var(--fout); }
	nav .knop { justify-content: center; }
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
