<script>
	import { mooi } from '#lib/datum.js';
	import { getal } from '#lib/gewicht.js';
	import Verloop from '#lib/Verloop.svelte';
	import Icoon from '#lib/Icoon.svelte';

	import { enhance } from '$app/forms';

	let { data, form } = $props();
	const d = $derived(data.doelen);
	const week = $derived(data.dagen.slice(0, 7));
	const gem = (lijst, k) => {
		const w = lijst.map((r) => r[k]).filter((v) => v != null && v !== 0);
		return w.length ? w.reduce((a, b) => a + b, 0) / w.length : null;
	};
	const eiwitDagen = $derived(week.filter((r) => r.eiwit >= d.eiwit[0]).length);
	const kcalDagen = $derived(week.filter((r) => r.kcal >= d.bereik[0] && r.kcal <= d.bereik[1] + 200).length);
	const slaapNachten = $derived(week.filter((r) => r.slaap >= 8).length);
	const punten = $derived(data.gewicht.map((r) => ({ datum: r.datum, waarde: r.gewicht, tekst: `${mooi(r.datum)} · ${getal(r.gewicht)} kg` })));
	const toename = $derived(punten.length > 1 ? Math.round((punten[punten.length - 1].waarde - punten[0].waarde) * 10) / 10 : null);
	const FASE = { diep: 'diep', kern: 'kern', rem: 'REM' };
</script>

<main class="app stapel ruim">
	<header class="paginakop">
		<span class="label">Groei komt uit gym + eten + slaap</span>
		<h1>Eten en slaap</h1>
	</header>

	<section class="stapel">
		<div class="rij uiteen"><h2>Afgelopen 7 dagen</h2><a class="klein" href="/eten/doelen">Doelen</a></div>
		<div class="raster twee">
			<div class="kaart stat"><span class="label">Eiwitdoel gehaald</span><span class="waarde" style="color: var(--amber)">{eiwitDagen}<small>/7 dagen</small></span><span class="klein gedempt">gem. {gem(week, 'eiwit') ? Math.round(gem(week, 'eiwit')) : '–'} g · doel {d.eiwit[0]}+</span></div>
			<div class="kaart stat"><span class="label">Calorieën op doel</span><span class="waarde" style="color: var(--amber)">{kcalDagen}<small>/7 dagen</small></span><span class="klein gedempt">gem. {gem(week, 'kcal') ? Math.round(gem(week, 'kcal')) : '–'} · doel {d.bereik[0]}–{d.bereik[1]}</span></div>
			<div class="kaart stat"><span class="label">8+ uur slaap</span><span class="waarde" style="color: var(--lila)">{slaapNachten}<small>/7 nachten</small></span><span class="klein gedempt">gem. {gem(week, 'slaap') ? getal(Math.round(gem(week, 'slaap') * 10) / 10) : '–'} u</span></div>
			<div class="kaart stat"><span class="label">Water</span><span class="waarde" style="color: var(--water)">{gem(week, 'water') ? getal(Math.round(gem(week, 'water') / 100) / 10) : '–'}<small>L gem.</small></span><span class="klein gedempt">doel {getal(d.water / 1000)} L</span></div>
		</div>
	</section>

	<section class="stapel" id="trend">
		<div class="rij uiteen"><h2>Gewicht</h2>{#if toename != null}<span class="chip" class:volt={toename > 0}>{toename > 0 ? '+' : ''}{getal(toename)} kg</span>{/if}</div>
		{#if data.trend}
			{@const t = data.trend}
			<div class="kaart stapel">
				<div class="raster twee">
					<div class="stat"><span class="label">Trend (3 weken)</span><span class="waarde" class:volt={t.perWeek >= 0.1 && t.perWeek <= 0.4}>{t.perWeek > 0 ? '+' : ''}{getal(t.perWeek)}<small> kg/week</small></span></div>
					<div class="stat"><span class="label">Gemiddeld 7 dagen</span><span class="waarde">{t.gemiddeld != null ? getal(t.gemiddeld) : '–'}<small> kg</small></span></div>
				</div>
				<p class="klein" style="margin:0">{t.advies.tekst} <span class="gedempt">Doel: ongeveer 0,2 kg per week. Eén weging zegt weinig (water, eten); de trend over {t.metingen} wegingen wel.</span></p>
				{#if form?.kcalOk}
					<p class="melding"><Icoon naam="vink" grootte={16} /> Caloriedoel is nu {form.kcalOk} kcal per dag.</p>
				{:else if t.advies.stap}
					<form method="POST" action="?/kcal" use:enhance>
						<input type="hidden" name="kcal" value={d.kcal + t.advies.stap} />
						<button class="knop primair vol-breed">Caloriedoel naar {d.kcal + t.advies.stap} kcal ({t.advies.stap > 0 ? '+' : ''}{t.advies.stap})</button>
					</form>
				{/if}
			</div>
		{:else}
			<p class="klein gedempt" style="margin:0">Weeg je een paar keer per week ('s ochtends, na het toilet). Na 10 dagen met 4+ wegingen zie je hier of je genoeg eet om aan te komen.</p>
		{/if}
		{#if punten.length > 1}
			<div class="kaart"><Verloop {punten} decimalen={1} onderschrift="Lichaamsgewicht, laatste 6 maanden. Doel: +2 tot +3 kg in 3 maanden." /></div>
		{:else}
			<p class="leeg">Vul af en toe je gewicht in op Vandaag, of laat het meekomen uit <a href="/gezondheid">Apple Gezondheid</a>.</p>
		{/if}
	</section>

	<section class="stapel">
		<h2>Per dag</h2>
		<div class="kaart">
			<ul class="lijst">
				{#each data.dagen.slice(0, 14) as r (r.datum)}
					<li class="dag">
						<a href="/eten?datum={r.datum}" class="klein gedempt">{mooi(r.datum, { dag: true })}</a>
						<div class="stapel krap">
							<div class="regel">
								<div class="balk" style="--balk-kleur: var(--amber)"><span style="--waarde: {r.eiwit ? Math.min(100, (r.eiwit / d.eiwit[0]) * 100) : 0}%"></span></div>
								<span class="klein tnum">{r.eiwit != null ? Math.round(r.eiwit) + ' g' : '–'}</span>
							</div>
							<div class="regel">
								<div class="balk" style="--balk-kleur: var(--lila)"><span style="--waarde: {r.slaap ? Math.min(100, (r.slaap / 8) * 100) : 0}%"></span></div>
								<span class="klein tnum">{r.slaap != null ? getal(r.slaap) + ' u' : '–'}</span>
							</div>
							{#if r.fasen && Object.keys(r.fasen).some((f) => FASE[f])}
								<span class="klein gedempt">{Object.entries(r.fasen).filter(([f]) => FASE[f]).map(([f, m]) => `${FASE[f]} ${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`).join(' · ')}</span>
							{/if}
						</div>
						<span class="klein tnum gedempt kcal">{r.kcal != null ? Math.round(r.kcal) : '–'}<br />kcal</span>
					</li>
				{/each}
			</ul>
		</div>
		<p class="klein gedempt"><span style="color: var(--amber)">■</span> eiwit t.o.v. {d.eiwit[0]} g · <span style="color: var(--lila)">■</span> slaap t.o.v. 8 uur</p>
	</section>

	<a class="kaart rij uiteen" href="/gezondheid" style="text-decoration: none">
		<span class="stapel krap" style="gap: 0"><strong>Slaap automatisch uit Apple Gezondheid</strong><span class="klein gedempt">Met een opdracht op je iPhone, elke ochtend.</span></span>
		<Icoon naam="pijl" />
	</a>
</main>

<style>
	.dag { display: grid; grid-template-columns: 5.5rem 1fr 3rem; gap: var(--r-3); align-items: center; }
	.dag a { text-decoration: none; }
	.regel { display: grid; grid-template-columns: 1fr 2.75rem; gap: var(--r-2); align-items: center; }
	.kcal { text-align: right; line-height: 1.2; }
	.stat .waarde.volt { color: var(--accent-tekst); }
</style>
