<script>
	import { enhance } from '$app/forms';
	import { mooi, hoeLang, weeknummer } from '#lib/datum.js';
	import { gewichtTekst, getal, repsTekst } from '#lib/gewicht.js';
	import { oefening } from '#lib/oefeningen.js';
	import Figuur from '#lib/figuur/Figuur.svelte';
	import Icoon from '#lib/Icoon.svelte';
	import Volume from '#lib/Volume.svelte';
	import { SPIERGROEPEN, BEREIK } from '#lib/volume.js';

	let { data, form } = $props();
	const bewaar = () => async ({ update }) => update({ reset: false });

	const alle = $derived(data.dagen.flatMap((d) => d.items.map((it) => ({ ...it, dag: d.titel }))));
	const acties = $derived(alle.filter((it) => ['zwaarder', 'zoek', 'set-minder', 'vervang'].includes(it.advies.soort) && !(it.advies.soort === 'zoek' && !it.advies.nieuw && !it.laatste.length)));
	const wissels = $derived(alle.filter((it) => it.wissel));
	const gem = (lijst, k) => {
		const w = lijst.map((r) => r[k]).filter((v) => v != null);
		return w.length ? w.reduce((a, b) => a + b, 0) / w.length : null;
	};
	const slaapGem = $derived(gem(data.week.dagregels, 'slaap'));
	const gewichtGem = $derived(gem(data.week.dagregels, 'gewicht'));
	const wr = $derived(data.week.weekregel ?? {});
	const tekort = $derived(Object.entries(data.volume.gepland).filter(([, n]) => n < BEREIK[0]).sort((a, b) => a[1] - b[1]));
	const naamVan = (id) => SPIERGROEPEN.find((g) => g.id === id)?.naam.toLowerCase();
</script>

<main class="app stapel ruim">
	<header class="paginakop">
		<span class="label">Week {weeknummer(data.datum)} · 10 minuten</span>
		<h1>Zondag-check</h1>
		<p class="rustig">Hier verander je gewichten. In de gym niet.</p>
	</header>
	{#if form?.fout}<p class="melding fout">{form.fout}</p>{/if}

	{#if data.licht.nu}
		<p class="melding lila"><span><strong>Dit is een lichte week.</strong> Zelfde gewichten, de helft van de sets. Volgende week ga je weer vol.</span></p>
	{/if}
	{#if data.licht.volgende}
		<form method="POST" action="?/licht" class="melding lila rij uiteen" use:enhance={bewaar}>
			<span><strong>Volgende week is een lichte week.</strong> Je trainingen tonen vanzelf de helft van de sets.</span>
			<input type="hidden" name="aan" value="0" />
			<button class="knop klein stil">Toch niet</button>
		</form>
	{:else if data.licht.advies.voorstel && !data.licht.nu}
		<section class="kaart stapel licht">
			<div class="rij uiteen"><span class="label">Voorstel</span><span class="chip lila">lichte week</span></div>
			<h2>Tijd voor een lichte week</h2>
			<p class="rustig" style="margin:0">{data.licht.advies.reden} Eén week met de helft van de sets (zelfde gewichten, 3 reps over) laat je lichaam bijkomen. Daarna til je meestal meer dan ervoor.</p>
			<form method="POST" action="?/licht" use:enhance={bewaar}>
				<input type="hidden" name="aan" value="1" />
				<button class="knop primair vol-breed">Maak volgende week licht</button>
			</form>
		</section>
	{/if}

	{#if !data.laatsteFoto || (Date.parse(data.datum) - Date.parse(data.laatsteFoto)) / 86400000 >= 28}
		<a class="kaart rij uiteen herinnering" href="/fotos">
			<span class="stapel krap" style="gap: 2px">
				<strong>{data.laatsteFoto ? 'Tijd voor nieuwe foto’s' : 'Begin je fotoverloop'}</strong>
				<span class="klein gedempt">{data.laatsteFoto ? `Vorige keer ${mooi(data.laatsteFoto)}.` : 'Elke 4 weken voor, zij en achter.'} De weegschaal laat spieren slecht zien; foto's wel.</span>
			</span>
			<Icoon naam="pijl" />
		</a>
	{/if}

	<!-- 1 + 2: per oefening de laatste 2 sessies → nieuw gewicht -->
	<section class="stapel">
		<div class="rij"><span class="stap">1</span><h2>Gewichten</h2></div>
		<p class="rustig" style="margin:0">Bovenkant van de range in alle sets gehaald, met 1–2 reps over? Dan gaat het gewicht omhoog en staat "sinds" op vandaag.</p>
		{#each acties as it (it.id)}
			<article class="kaart actie" class:af={form?.gedaan === it.id}>
				<div class="rij uiteen">
					<div class="stapel krap" style="gap: 2px">
						<span class="label">{it.dag}</span>
						<strong>{it.naam}</strong>
						<span class="klein gedempt">{gewichtTekst(it)}{it.sinds ? ` · sinds ${mooi(it.sinds)} (${hoeLang(it.sinds)})` : ''}</span>
					</div>
					{#if it.advies.soort === 'zwaarder'}<span class="chip volt"><Icoon naam="omhoog" grootte={14} /> zwaarder</span>
					{:else if it.advies.soort === 'zoek'}<span class="chip omlijnd">gewicht vastzetten</span>
					{:else if it.advies.soort === 'set-minder'}<span class="chip amber">set minder</span>
					{:else}<span class="chip amber">vervangen</span>{/if}
				</div>
				{#if it.laatste.length}
					<div class="sessies tnum">
						{#each it.laatste as s}<span class="klein"><span class="gedempt">{mooi(s.datum)}</span> {s.sets[0]?.gewicht != null ? getal(s.sets[0].gewicht) + ':' : ''} <strong>{repsTekst(s.sets)}</strong></span>{/each}
					</div>
				{/if}
				<p class="klein" style="margin:0">{it.advies.tekst}</p>

				{#if form?.gedaan === it.id}
					<p class="melding"><Icoon naam="vink" grootte={16} /> Aangepast</p>
				{:else if (it.advies.soort === 'zwaarder' || it.advies.soort === 'zoek') && it.advies.nieuw != null}
					<form method="POST" action="?/gewicht" class="rij" use:enhance={bewaar}>
						<input type="hidden" name="item" value={it.id} />
						<label class="veld" style="flex: 1"><span class="verborgen">Nieuw gewicht</span><input name="gewicht" inputmode="decimal" value={getal(it.advies.nieuw)} /></label>
						<button class="knop primair">Zet vast ({it.eenheid})</button>
					</form>
				{:else if it.advies.nieuwReps}
					<form method="POST" action="?/reps" use:enhance={bewaar}>
						<input type="hidden" name="item" value={it.id} /><input type="hidden" name="min" value={it.advies.nieuwReps[0]} /><input type="hidden" name="max" value={it.advies.nieuwReps[1]} />
						<button class="knop primair">Maak het {it.advies.nieuwReps[1]} sec</button>
					</form>
				{:else if it.advies.soort === 'set-minder'}
					<form method="POST" action="?/setMinder" use:enhance={bewaar}><input type="hidden" name="item" value={it.id} /><button class="knop omlijnd">Eén set minder deze week</button></form>
				{:else if it.advies.soort === 'vervang'}
					{@const dag = data.dagen.find((d) => d.items.some((x) => x.id === it.id))}
					{@const opties = dag.items.find((x) => x.wissel)?.opties ?? []}
					<form method="POST" action="?/vervang" class="rij" use:enhance={bewaar}>
						<input type="hidden" name="item" value={it.id} />
						<select name="slug" class="invoer" style="flex: 1" aria-label="Vervangen door">
							{#each opties as o}<option value={o.slug}>{oefening(o.slug).naam}</option>{/each}
						</select>
						<button class="knop omlijnd">Vervang</button>
					</form>
				{/if}
			</article>
		{:else}
			<div class="leeg stapel krap">
				<Icoon naam="vink" grootte={28} />
				<strong>Niets aan te passen</strong>
				<span class="klein">Nergens de bovenkant gehaald. Volgende week per set één rep meer.</span>
			</div>
		{/each}
	</section>

	<!-- 4: wisselslot -->
	<section class="stapel">
		<div class="rij"><span class="stap">2</span><h2>Wisselslot</h2></div>
		<p class="rustig" style="margin:0">Kies per dag één nieuw apparaat voor komende week. Bevalt het na 2–3 weken beter dan een vaste oefening? Wissel ze om in het schema.</p>
		{#if tekort.length}
			<p class="klein" style="margin:0"><span class="gedempt">Onder de 10 sets per week:</span> {tekort.map(([g, n]) => `${naamVan(g)} (${getal(n)})`).join(', ')}. Opties met <span class="vult">+</span> vullen dat aan en staan bovenaan.</p>
		{/if}
		{#each wissels as it (it.id)}
			<div class="kaart stapel krap">
				<div class="rij uiteen"><strong>{it.dag}</strong>{#if it.slug}<span class="klein gedempt">nu: {oefening(it.slug).kort}{it.sinds ? ` · ${hoeLang(it.sinds)}` : ''}</span>{/if}</div>
				<form method="POST" action="?/wissel" class="opties" use:enhance={bewaar}>
					<input type="hidden" name="item" value={it.id} />
					{#each it.opties as o}
						{@const oef = oefening(o.slug)}
						<button name="slug" value={o.slug} class="optie" aria-pressed={it.slug === o.slug}>
							<Figuur anim={oef.anim} klein speelt={false} label={oef.naam} />
							<span class="klein">{oef.kort}{o.hint ? ` · ${o.hint}` : ''}</span>
							{#if o.vult.length}<span class="vult klein">+ {o.vult.map((v) => v.naam.toLowerCase()).join(', ')}</span>{/if}
						</button>
					{/each}
				</form>
			</div>
		{/each}
	</section>

	<!-- volume -->
	<section class="stapel">
		<div class="rij"><span class="stap">3</span><h2>Sets per spiergroep</h2></div>
		<p class="rustig" style="margin:0">Groeit een spiergroep niet en zit hij onder de 10? Geef hem in het wisselslot of met een extra set wat meer.</p>
		<div class="kaart"><Volume gedaan={data.volume.gedaan} gepland={data.volume.gepland} /></div>
	</section>

	<!-- 5: weekregel -->
	<section class="stapel">
		<div class="rij"><span class="stap">4</span><h2>Weekregel</h2></div>
		<form method="POST" action="?/weekregel" class="kaart raster twee" use:enhance={bewaar}>
			<label class="veld"><span>Slaap gem. (uur)</span><input name="slaap" inputmode="decimal" value={wr.slaap ?? (slaapGem ? getal(Math.round(slaapGem * 10) / 10) : '')} placeholder="8" /></label>
			<label class="veld"><span>Energie (1–10)</span><input name="energie" inputmode="numeric" value={wr.energie ?? ''} placeholder="7" /></label>
			<label class="veld"><span>Gewicht (kg)</span><input name="gewicht" inputmode="decimal" value={wr.gewicht ?? (gewichtGem ? getal(Math.round(gewichtGem * 10) / 10) : '')} /></label>
			<label class="veld"><span>Gemist</span><input name="gemist" value={wr.gemist ?? ''} placeholder="bv. do (ziek)" /></label>
			<label class="veld" style="grid-column: 1 / -1"><span>Notitie</span><input name="notitie" value={wr.notitie ?? ''} /></label>
			<button class="knop primair" style="grid-column: 1 / -1">{form?.weekOk ? 'Opgeslagen ✓' : 'Weekregel opslaan'}</button>
			{#if data.trend}
				<a href="/voeding#trend" class="klein trendregel" style="grid-column: 1 / -1">
					<span class="gedempt">Gewichtstrend:</span> {data.trend.advies.tekst} →
				</a>
			{/if}
			{#if form?.weekFout}<p class="melding fout" style="grid-column: 1 / -1">{form.weekFout}</p>{/if}
			<p class="klein gedempt" style="grid-column: 1 / -1; margin: 0">
				Deze week: {data.week.trainingen.length} trainingen · {data.week.activiteiten.length}× cardio{#if slaapGem} · slaap gem. {getal(Math.round(slaapGem * 10) / 10)} u{/if}
			</p>
		</form>
	</section>
</main>

<style>
	.stap {
		width: 2rem; height: 2rem; border-radius: 50%; display: grid; place-items: center;
		background: var(--accent); color: var(--op-accent);
		font-family: var(--letter-display); font-stretch: var(--breed); font-weight: 800;
	}
	.actie { display: flex; flex-direction: column; gap: var(--r-3); }
	.actie.af { border-color: var(--accent); }
	.sessies { display: flex; flex-wrap: wrap; gap: var(--r-1) var(--r-4); }
	.opties { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--r-2); }
	@media (max-width: 30rem) { .opties { grid-template-columns: repeat(2, 1fr); } }
	.optie {
		all: unset; box-sizing: border-box; cursor: pointer;
		display: flex; flex-direction: column; gap: var(--r-1); padding: var(--r-2);
		border-radius: var(--hoek-m); background: var(--vlak-hoog); border: 1px solid var(--lijn); text-align: center;
	}
	.optie[aria-pressed='true'] { border-color: var(--accent); box-shadow: 0 0 0 1px var(--accent) inset; }
	.optie:focus-visible { outline: 2px solid var(--accent); }
	.vult { color: var(--accent-tekst); font-weight: 650; }
	.licht { border-color: color-mix(in srgb, var(--lila) 50%, var(--lijn)); }
	.herinnering, .trendregel { color: inherit; text-decoration: none; }
</style>
