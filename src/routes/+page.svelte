<script>
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import Icoon from '#lib/Icoon.svelte';
	import Ring from '#lib/Ring.svelte';
	import { DAGEN, DAGEN_KORT, mooi, weeknummer, weekdag, hoeLang, plusDagen } from '#lib/datum.js';
	import { gewichtTekst, getal } from '#lib/gewicht.js';

	let { data, form } = $props();

	const wd = $derived(weekdag(data.datum));
	const gymDagen = $derived(data.weekschema.filter((d) => d.soort === 'gym').length);
	const eiwitDoel = $derived(data.etenDoelen.eiwit);
	// Eiwit uit het eetdagboek; oude dagen zonder dagboek: wat je toen met de hand invulde.
	const eiwitVandaag = $derived(data.eten.eiwit || data.dagregel.eiwit || 0);
	const cardio = $derived(data.week.activiteiten.length);
	const isBeen = (d) => d?.code?.startsWith('legs');
	const geenCardio = $derived(isBeen(data.gisteren) || isBeen(data.morgen));
	let opgeslagen = $state(false);
</script>

<main class="app stapel ruim">
	<header class="paginakop">
		<span class="label">{DAGEN[wd - 1]} {mooi(data.datum)} · week {weeknummer(data.datum)}</span>
		{#if page.url.searchParams.has('welkom')}
			<h1>Welkom, {page.data.gebruiker.naam.split(' ')[0]}</h1>
			<p class="rustig">Je schema staat klaar met je startgewichten. Vul hieronder je lichaamsgewicht in, dan rekent Fits je eiwit uit.</p>
		{:else if data.dag?.soort === 'rust'}
			<h1>Rustdag</h1>
		{:else}
			<h1>{data.dag?.titel ?? 'Vrij'}<span class="accent"> · {data.dag?.focus}</span></h1>
		{/if}
	</header>

	<!-- Hoofdkaart: wat je vandaag doet -->
	{#if data.open}
		<a class="kaart vol held" href="/training/{data.open.id}">
			<span class="label">Bezig</span>
			<span class="display groot">{data.open.titel}</span>
			<span class="rij">Ga verder met je training <Icoon naam="pijl" /></span>
		</a>
	{:else if data.dag?.soort === 'rust'}
		<a class="kaart vol held" href="/zondag">
			<span class="label">10 minuten</span>
			<span class="display groot">Progressiecheck</span>
			<span class="rij">Gewichten bijstellen, wisselslot kiezen, weekregel <Icoon naam="pijl" /></span>
		</a>
	{:else if data.dag}
		<section class="kaart held-gym">
			<div class="rij uiteen">
				<div class="stapel krap">
					<span class="label">{data.dag.items.length} oefeningen · ±{data.dag.items.reduce((a, i) => a + (i.sets_tijdelijk ?? i.sets), 0)} werksets · 55–65 min</span>
					{#if data.gedaanVandaag}<span class="chip volt"><Icoon naam="vink" grootte={14} /> Vandaag al gedaan</span>{/if}
				</div>
			</div>
			<ol class="lijst oefenlijst">
				{#each data.dag.items as it, n}
					<li>
						<span class="nr">{n + 1}</span>
						<span class="stapel krap" style="gap: 2px">
							<span class="naam">{it.wissel ? `Wisselslot${it.slug ? ' · ' + it.naam : ''}` : it.naam}</span>
							<span class="klein gedempt">
								{it.sets_tijdelijk ?? it.sets} × {it.reps_min}{it.reps_max !== it.reps_min ? '–' + it.reps_max : ''}{it.slug === 'plank' ? ' sec' : ''}
								{#if it.gewicht != null && it.gewicht !== 0}· {gewichtTekst(it)}{:else if it.gewicht == null && it.slug}· zoek gewicht{/if}
								{#if it.sinds}· sinds {mooi(it.sinds)}{/if}
							</span>
						</span>
						{#if it.advies.soort === 'zwaarder'}<span class="chip volt"><Icoon naam="omhoog" grootte={14} /> zwaarder</span>
						{:else if it.advies.soort === 'vervang'}<span class="chip amber">vervangen?</span>
						{:else if it.advies.soort === 'zoek'}<span class="chip omlijnd">zoek</span>{/if}
					</li>
				{/each}
			</ol>
			<form method="POST" action="?/start">
				<input type="hidden" name="dag" value={data.dag.id} />
				<button class="knop primair groot vol-breed">Start {data.dag.titel} <Icoon naam="pijl" /></button>
			</form>
			{#if data.dag.alternatief}<p class="klein gedempt" style="margin:0">{data.dag.alternatief}</p>{/if}
		</section>
	{/if}

	<!-- Groei = gym + eten + slaap (+ cardio) -->
	<section class="stapel">
		<div class="rij uiteen"><h2>Deze week</h2><span class="klein gedempt">Groei = gym + eten + slaap</span></div>
		<div class="raster vier pijlers">
			<a class="kaart pijler" href="/logboek">
				<Ring waarde={data.week.trainingen.length / gymDagen} kleur="volt"><Icoon naam="oefeningen" grootte={20} /></Ring>
				<span class="stat"><span class="label">Gym</span><span class="waarde">{data.week.trainingen.length}<small>/{gymDagen}</small></span></span>
			</a>
			<a class="kaart pijler" href="/eten">
				<Ring waarde={eiwitVandaag / eiwitDoel[0]} kleur="amber"><Icoon naam="eten" grootte={20} /></Ring>
				<span class="stat"><span class="label">Eiwit vandaag</span><span class="waarde">{Math.round(eiwitVandaag) || '–'}<small>/{eiwitDoel[0]} g</small></span></span>
			</a>
			<a class="kaart pijler" href="/voeding">
				<Ring waarde={(data.dagregel.slaap ?? 0) / 8} kleur="lila"><Icoon naam="slaap" grootte={20} /></Ring>
				<span class="stat"><span class="label">Slaap vannacht</span><span class="waarde">{getal(data.dagregel.slaap ?? null) || '–'}<small>/8+ u</small></span></span>
			</a>
			<a class="kaart pijler" href="/cardio">
				<Ring waarde={cardio / 3} kleur="koraal"><Icoon naam="cardio" grootte={20} /></Ring>
				<span class="stat"><span class="label">Cardio</span><span class="waarde">{cardio}<small>/2–3</small></span></span>
			</a>
		</div>
		{#if cardio >= 3}<p class="melding amber">Je zit op 3 keer cardio deze week. Zolang groei het doel is: niet meer.</p>{/if}
		{#if geenCardio && data.dag?.soort !== 'rust'}<p class="klein gedempt" style="margin:0"><Icoon naam="info" grootte={14} /> Geen extra cardio vandaag: het is de dag voor of na legs.</p>{/if}
	</section>

	<!-- Week -->
	<section class="weekstrook" aria-label="Weekschema">
		{#each data.weekschema as d}
			{@const datum = plusDagen(data.week.maandag, d.weekdag - 1)}
			{@const gedaan = data.week.trainingen.some((t) => t.datum === datum)}
			{@const run = data.week.activiteiten.some((a) => a.datum === datum)}
			<a href="/schema/{d.weekdag}" class="dagje" class:vandaag={d.weekdag === wd} class:gedaan>
				<span class="label">{DAGEN_KORT[d.weekdag - 1]}</span>
				<span class="bol">{#if gedaan}<Icoon naam="vink" grootte={16} />{:else}{d.soort === 'rust' ? '·' : d.titel.split(' ')[1] ?? d.titel[0]}{/if}</span>
				<span class="soort">{d.soort === 'rust' ? 'rust' : d.titel.split(' ')[0].toLowerCase()}</span>
				{#if run}<span class="stip" style="color: var(--koraal)"></span>{/if}
			</a>
		{/each}
	</section>

	<!-- Eten vandaag -->
	<a class="kaart eten-kaart" href="/eten">
		<div class="stapel krap" style="gap: 2px">
			<span class="label" style="color: var(--amber)">Eten vandaag</span>
			<span class="tnum"><strong class="groot">{Math.round(data.eten.kcal)}</strong><span class="gedempt"> / {data.etenDoelen.kcal} kcal</span></span>
			<span class="klein rustig tnum">{Math.round(data.eten.eiwit)} g eiwit · {Math.round(data.eten.koolh)} g koolh. · {Math.round(data.eten.vet)} g vet</span>
		</div>
		<span class="knop primair vierkant" aria-hidden="true"><Icoon naam="plus" /></span>
	</a>

	<!-- Dagregel -->
	<section class="kaart stapel">
		<div class="rij uiteen"><h2>Dagregel</h2><span class="klein gedempt">{mooi(data.datum, { dag: true })}</span></div>
		<form
			method="POST"
			action="?/dagregel"
			class="raster twee"
			use:enhance={() => async ({ update, result }) => {
				await update({ reset: false });
				opgeslagen = result.type === 'success';
				setTimeout(() => (opgeslagen = false), 2000);
			}}
		>
			<input type="hidden" name="datum" value={data.datum} />
			<label class="veld">
				<span>Slaap vannacht (uur)</span>
				<input name="slaap" inputmode="decimal" placeholder="8" value={data.dagregel.slaap != null ? getal(data.dagregel.slaap) : ''} />
				{#if data.dagregel.slaap_bron === 'gezondheid'}<small style="color: var(--lila)">uit Apple Gezondheid</small>{:else}<small><a href="/gezondheid">Automatisch uit Gezondheid?</a></small>{/if}
			</label>
			<label class="veld"><span>Gewicht (kg)</span><input name="gewicht" inputmode="decimal" placeholder={data.gewicht ? getal(data.gewicht) : '75'} value={data.dagregel.gewicht != null ? getal(data.dagregel.gewicht) : ''} /><small>Af en toe, nuchter</small></label>
			<button class="knop omlijnd" style="grid-column: 1 / -1">{#if opgeslagen}<Icoon naam="vink" /> Opgeslagen{:else}Opslaan{/if}</button>
			{#if form?.dagFout}<p class="melding fout" style="grid-column: 1 / -1">{form.dagFout}</p>{/if}
		</form>
	</section>
</main>

<style>
	.held { display: flex; flex-direction: column; gap: var(--r-2); padding: var(--r-5); }
	.held .display.groot, .display.groot { font-size: var(--maat-2xl); }
	.held-gym { display: flex; flex-direction: column; gap: var(--r-4); }
	.oefenlijst li { display: grid; grid-template-columns: 1.75rem 1fr auto; gap: var(--r-3); align-items: center; }
	.nr { font-family: var(--letter-display); font-stretch: var(--breed); font-weight: 800; color: var(--tekst-gedempt); font-size: var(--maat-l); }
	.naam { font-weight: 650; }
	.pijler { display: flex; align-items: center; gap: var(--r-3); padding: var(--r-3); text-decoration: none; }
	.pijler .waarde { font-size: var(--maat-l); }
	@media (max-width: 30rem) { .pijler { flex-direction: column; align-items: flex-start; } }
	.weekstrook { display: grid; grid-template-columns: repeat(7, 1fr); gap: var(--r-1); }
	.dagje { display: flex; flex-direction: column; align-items: center; gap: var(--r-1); text-decoration: none; padding: var(--r-2) 0; border-radius: var(--hoek-m); }
	.dagje.vandaag { background: var(--vlak); box-shadow: inset 0 0 0 1px var(--lijn); }
	.dagje.vandaag .label { color: var(--accent-tekst); }
	.bol {
		width: 2.4rem; height: 2.4rem; border-radius: 50%; display: grid; place-items: center;
		background: var(--vlak-hoog); font-weight: 700; font-size: var(--maat-xs); color: var(--tekst-rustig);
	}
	.eten-kaart { display: flex; justify-content: space-between; align-items: center; gap: var(--r-3); text-decoration: none; }
	.eten-kaart .groot { font-family: var(--letter-display); font-stretch: var(--breed); font-weight: 800; font-size: var(--maat-xl); }
	.soort { font-size: 0.625rem; color: var(--tekst-gedempt); font-weight: 600; }
	.gedaan .bol { background: var(--accent); color: var(--op-accent); }
</style>
