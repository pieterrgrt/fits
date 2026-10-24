<script>
	import { oefening, SPIEREN, STAPPEN } from '#lib/oefeningen.js';
	import Figuur from '#lib/figuur/Figuur.svelte';
	import Spierkaart from '#lib/Spierkaart.svelte';
	import Icoon from '#lib/Icoon.svelte';
	import Verloop from '#lib/Verloop.svelte';
	import { DAGEN, mooi, hoeLang } from '#lib/datum.js';
	import { gewichtTekst, getal } from '#lib/gewicht.js';

	let { data } = $props();
	const o = $derived(oefening(data.slug));
	const punten = $derived(
		[...data.geschiedenis].reverse().map((s) => {
			const beste = s.sets.reduce((a, b) => ((b.gewicht ?? 0) * (1 + b.reps / 30) > (a.gewicht ?? 0) * (1 + a.reps / 30) ? b : a), s.sets[0]);
			return { datum: s.datum, gewicht: beste.gewicht ?? 0, reps: beste.reps, e1rm: (beste.gewicht ?? 0) * (1 + beste.reps / 30) };
		})
	);
</script>

<main class="app stapel ruim">
	<a href="/oefeningen" class="knop stil klein" style="align-self: flex-start"><Icoon naam="terug" grootte={16} /> Oefeningen</a>
	<header class="paginakop">
		<span class="label">{o.soort === 'compound' ? 'Compound' : o.soort === 'isolatie' ? 'Isolatie' : o.soort === 'core' ? 'Core' : 'Warming-up'} · {o.apparaat}</span>
		<h1>{o.naam}</h1>
	</header>

	<section class="kaart buhne">
		<Figuur anim={o.anim} label={o.naam} />
	</section>

	<div class="raster drie">
		<div class="kaart stat"><span class="label">Rust</span><span class="waarde">{o.rust[0]}{o.rust[0] !== o.rust[1] ? '–' + o.rust[1] : ''}<small>sec</small></span></div>
		<div class="kaart stat"><span class="label">Zwaarder</span><span class="klein" style="font-weight: 650">{STAPPEN[o.stap].tekst}</span></div>
		<div class="kaart stat"><span class="label">Tot</span><span class="klein" style="font-weight: 650">{o.soort === 'compound' ? '1–2 reps over, altijd' : o.soort === 'isolatie' ? 'laatste set mag tot 0' : 'goede vorm'}</span></div>
	</div>

	<section class="stapel">
		<h2>Zo doe je het</h2>
		<ol class="stappen">{#each o.uitvoering as s, n}<li><span class="nr">{n + 1}</span><span>{s}</span></li>{/each}</ol>
	</section>

	<div class="raster twee tipsfouten">
		<section class="kaart stapel krap">
			<h3 class="accent">Let op</h3>
			<ul class="punten">{#each o.tips as t}<li>{t}</li>{/each}</ul>
		</section>
		{#if o.fouten.length}
			<section class="kaart stapel krap">
				<h3 style="color: var(--fout)">Te zwaar als…</h3>
				<ul class="punten">{#each o.fouten as f}<li>{f}</li>{/each}</ul>
			</section>
		{/if}
	</div>

	<section class="kaart stapel">
		<h2>Spieren</h2>
		<div class="spieren">
			<Spierkaart primair={o.spieren.primair} secundair={o.spieren.secundair} />
			<div class="stapel krap">
				{#each o.spieren.primair as s}<span class="rij klein"><span class="stip" style="color: var(--accent)"></span><strong>{SPIEREN[s]}</strong></span>{/each}
				{#each o.spieren.secundair as s}<span class="rij klein rustig"><span class="stip" style="color: color-mix(in srgb, var(--accent) 45%, var(--vlak-hoog))"></span>{SPIEREN[s]}</span>{/each}
			</div>
		</div>
	</section>

	{#if data.inSchema.length}
		<section class="stapel">
			<h2>In jouw schema</h2>
			{#each data.inSchema as s}
				<a class="kaart rij uiteen" href="/schema/{s.weekdag}" style="text-decoration: none">
					<span><strong>{DAGEN[s.weekdag - 1]}</strong> · {s.titel}{s.wissel ? ' (wisselslot)' : ''}</span>
					<span class="klein rustig">{s.sets} × {s.reps_min}–{s.reps_max} · {gewichtTekst(s)}{s.sinds ? ` · ${hoeLang(s.sinds)}` : ''}</span>
				</a>
			{/each}
		</section>
	{/if}

	<section class="stapel">
		<h2>Jouw verloop</h2>
		{#if punten.length > 1}
			<div class="kaart"><Verloop {punten} /></div>
		{/if}
		{#if data.geschiedenis.length}
			<ul class="lijst kaart">
				{#each data.geschiedenis.slice(0, 10) as s}
					<li class="rij uiteen tnum">
						<span class="gedempt">{mooi(s.datum, { dag: true })}</span>
						<span>{s.sets[0].gewicht != null ? `${s.sets[0].per_stuk ? '2× ' : ''}${getal(s.sets[0].gewicht)} ${s.sets[0].eenheid} · ` : ''}<strong>{s.sets.map((x) => x.reps).join('/')}</strong></span>
					</li>
				{/each}
			</ul>
		{:else}
			<p class="leeg">Nog niet gedaan. Na je eerste training zie je hier je verloop.</p>
		{/if}
	</section>
</main>

<style>
	.buhne { padding: var(--r-5); background: radial-gradient(120% 80% at 50% 100%, var(--accent-tint), transparent 60%), var(--vlak); }
	.stappen { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--r-3); }
	.stappen li { display: grid; grid-template-columns: 2rem 1fr; gap: var(--r-3); align-items: start; }
	.stappen .nr {
		width: 2rem; height: 2rem; border-radius: 50%; display: grid; place-items: center;
		background: var(--accent-tint); color: var(--accent-tekst);
		font-family: var(--letter-display); font-stretch: var(--breed); font-weight: 800;
	}
	.punten { margin: 0; padding-left: 1.1rem; display: grid; gap: var(--r-1); color: var(--tekst-rustig); font-size: var(--maat-s); }
	.spieren { display: grid; grid-template-columns: minmax(0, 1.4fr) 1fr; gap: var(--r-4); align-items: center; }
	@media (max-width: 30rem) { .tipsfouten { grid-template-columns: 1fr; } }
</style>
