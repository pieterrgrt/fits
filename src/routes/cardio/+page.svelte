<script>
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import { mooi, weekdag, plusDagen, maandag } from '#lib/datum.js';
	import Icoon from '#lib/Icoon.svelte';
	import Ring from '#lib/Ring.svelte';

	let { data, form } = $props();
	const NAMEN = { Run: 'Hardlopen', TrailRun: 'Trail', Swim: 'Zwemmen', Ride: 'Fietsen', VirtualRide: 'Fietsen (binnen)', Walk: 'Wandelen', Hike: 'Hiken', Rowing: 'Roeien', WeightTraining: 'Kracht', Workout: 'Workout' };
	const duur = (s) => (s ? `${Math.floor(s / 3600) ? Math.floor(s / 3600) + ':' : ''}${String(Math.floor((s % 3600) / 60)).padStart(Math.floor(s / 3600) ? 2 : 1, '0')}:${String(s % 60).padStart(2, '0')}` : '–');
	const km = (m) => (m ? (m / 1000).toLocaleString('nl-NL', { maximumFractionDigits: 1 }) + ' km' : '');
	const tempo = (a) => (a.soort?.includes('Run') && a.afstand ? `${Math.floor(a.duur / (a.afstand / 1000) / 60)}:${String(Math.round((a.duur / (a.afstand / 1000)) % 60)).padStart(2, '0')}/km` : '');
	// Cardio de dag voor of na legs = botst met herstel
	const botst = (datum) => data.beenDagen.some((b) => [plusDagen(datum, 1), plusDagen(datum, -1)].some((x) => weekdag(x) === b));
	const perWeek = $derived.by(() => {
		const m = new Map();
		for (const a of data.activiteiten) {
			const w = maandag(a.datum);
			m.set(w, [...(m.get(w) ?? []), a]);
		}
		return [...m.entries()];
	});
</script>

<main class="app stapel ruim">
	<header class="paginakop">
		<span class="label">Extra, niet de hoofdzaak</span>
		<h1>Cardio</h1>
		<p class="rustig">Max 2–3 keer per week zolang groei het doel is. Niet op de dag voor of na legs.</p>
	</header>

	<section class="kaart rij" style="gap: var(--r-4)">
		<Ring waarde={data.week.activiteiten.length / 3} kleur="koraal" grootte={72} dik={8}>
			<span class="groot">{data.week.activiteiten.length}</span>
		</Ring>
		<div class="stapel krap">
			<strong>Deze week {data.week.activiteiten.length} van max 3</strong>
			<span class="klein rustig">{data.week.activiteiten.length >= 3 ? 'Genoeg voor deze week.' : data.week.activiteiten.length === 2 ? 'Nog hooguit één.' : 'Ruimte voor zwemmen of zone 2.'}</span>
		</div>
	</section>

	{#if !data.strava.aan}
		<p class="melding amber">Strava is nog niet ingesteld op de server. Zie <code>docs/strava.md</code>: één keer een Strava API-app aanmaken en twee sleutels invullen.</p>
	{:else if !data.strava.gekoppeld}
		<section class="kaart stapel">
			<h2>Koppel Strava</h2>
			<p class="rustig" style="margin:0">Fits leest je loop-, zwem- en fietsritten en telt ze mee. Je kunt ook je gymsessies op Strava zetten.</p>
			<a class="knop strava" href="/strava/koppel?schrijven=1">Verbinden met Strava</a>
		</section>
	{:else}
		<div class="rij uiteen">
			<span class="klein gedempt">Strava: {data.strava.naam || 'gekoppeld'}{data.strava.laatst ? ` · bijgewerkt ${data.strava.laatst.slice(11, 16)}` : ''}</span>
			<form method="POST" action="?/sync" use:enhance><button class="knop klein omlijnd"><Icoon naam="sync" grootte={16} /> Bijwerken</button></form>
		</div>
		{#if page.url.searchParams.has('gekoppeld')}<p class="melding">Strava is gekoppeld.</p>{/if}
		{#if form?.fout}<p class="melding fout">{form.fout}</p>{/if}
		{#if form?.nieuw != null}<p class="melding">{form.nieuw} activiteiten bijgewerkt.</p>{/if}
	{/if}

	{#each perWeek as [week, lijst]}
		<section class="stapel krap">
			<div class="rij uiteen"><span class="label">week van {mooi(week)}</span><span class="chip" class:koraal={lijst.length > 3}>{lijst.length}×</span></div>
			{#each lijst as a (a.id)}
				<a class="kaart act" href="https://www.strava.com/activities/{a.id}" target="_blank" rel="noopener">
					<span class="soort"><Icoon naam="cardio" /></span>
					<span class="stapel krap" style="gap: 2px; min-width: 0">
						<strong class="afkappen">{a.naam}</strong>
						<span class="klein gedempt">{mooi(a.datum, { dag: true })} · {NAMEN[a.soort] ?? a.soort}{a.hartslag ? ` · ♥ ${Math.round(a.hartslag)}` : ''}</span>
						{#if botst(a.datum)}<span class="klein" style="color: var(--amber)">Dag voor of na legs</span>{/if}
					</span>
					<span class="stapel krap tnum" style="gap: 2px; text-align: right">
						<strong>{km(a.afstand) || duur(a.duur)}</strong>
						<span class="klein gedempt">{km(a.afstand) ? duur(a.duur) : ''} {tempo(a)}</span>
					</span>
				</a>
			{/each}
		</section>
	{:else}
		{#if data.strava.gekoppeld}<p class="leeg">Geen activiteiten in de afgelopen acht weken.</p>{/if}
	{/each}

	<section class="stapel">
		<h2>Bouwsteen B</h2>
		<p class="rustig" style="margin:0">Twee-uursoptie: altijd eerst de gymsessie, daarna +30–40 min cardio.</p>
		<div class="raster twee">
			<div class="kaart stapel krap">
				<span class="label" style="color: var(--koraal)">Zwemmen · 30 min</span>
				<ol class="klein rustig protocol">
					<li>5 min inzwemmen, rustig</li>
					<li>8× 50 m borstcrawl, 30 sec rust</li>
					<li>5 min uitzwemmen</li>
				</ol>
			</div>
			<div class="kaart stapel krap">
				<span class="label" style="color: var(--koraal)">Hardlopen · 35 min</span>
				<p class="klein rustig" style="margin:0">Zone 2: je kunt nog in hele zinnen praten. Zaterdag mag ook 60 min zone 2 in plaats van Legs B; dan doe je woensdag de RDL erbij.</p>
			</div>
		</div>
	</section>
</main>

<style>
	.groot { font-family: var(--letter-display); font-stretch: var(--breed); font-weight: 800; font-size: var(--maat-xl); }
	.act { display: grid; grid-template-columns: 2.5rem 1fr auto; gap: var(--r-3); align-items: center; padding: var(--r-3); text-decoration: none; }
	.soort { width: 2.5rem; height: 2.5rem; border-radius: var(--hoek-m); display: grid; place-items: center; background: var(--koraal-tint); color: var(--koraal); }
	.afkappen { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	.strava { --knop-vlak: var(--koraal); --knop-tekst: #160604; align-self: flex-start; }
	.protocol { margin: 0; padding-left: 1.1rem; }
</style>
