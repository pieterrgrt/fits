<script>
	import { enhance } from '$app/forms';
	import { onMount } from 'svelte';
	import Icoon from '#lib/Icoon.svelte';
	import Ring from '#lib/Ring.svelte';
	import { mooi, plusDagen, DAGEN, weekdag } from '#lib/datum.js';
	import { getal } from '#lib/gewicht.js';

	let { data, form } = $props();
	const d = $derived(data.doelen);
	const t = $derived(data.dag.totaal);
	const over = $derived(Math.round(d.kcal - t.kcal));
	const isVandaag = $derived(data.datum === data.vandaag);
	const dagNaam = $derived(isVandaag ? 'Vandaag' : data.datum === plusDagen(data.vandaag, -1) ? 'Gisteren' : `${DAGEN[weekdag(data.datum) - 1]} ${mooi(data.datum)}`);
	const glazen = $derived(Math.max(8, Math.ceil(d.water / 250)));
	const MACRO = $derived([
		{ naam: 'Eiwit', g: t.eiwit, doel: d.eiwit[0], kleur: 'var(--amber)' },
		{ naam: 'Koolh.', g: t.koolh, doel: d.koolh, kleur: 'var(--tekst-rustig)' },
		{ naam: 'Vet', g: t.vet, doel: d.vet, kleur: 'var(--tekst-gedempt)' }
	]);
	const bewaar = () => async ({ update }) => update({ reset: false });
	let bewaarOpen = $state(null);

	// Vasten-klok
	let nu = $state(Date.now());
	onMount(() => {
		const i = setInterval(() => (nu = Date.now()), 30_000);
		return () => clearInterval(i);
	});
	const vastUren = $derived(data.vasten ? (nu - Date.parse(data.vasten.begin)) / 3600_000 : 0);
	const uurMin = (u) => `${Math.floor(u)}:${String(Math.floor((u % 1) * 60)).padStart(2, '0')}`;
</script>

<main class="app stapel ruim">
	<header class="datumbalk">
		<a class="knop stil vierkant" href="?datum={plusDagen(data.datum, -1)}" aria-label="Vorige dag" data-sveltekit-reset="false"><Icoon naam="terug" /></a>
		<div class="stapel krap midden">
			<span class="label">Eten</span>
			<h1>{dagNaam}</h1>
		</div>
		<a class="knop stil vierkant" href="?datum={plusDagen(data.datum, 1)}" aria-label="Volgende dag" aria-disabled={isVandaag} data-sveltekit-reset="false"><Icoon naam="pijl" /></a>
	</header>

	<!-- Overzicht van de dag -->
	<section class="kaart overzicht">
		<div class="kern">
			<div class="stat zij"><span class="label">Gegeten</span><span class="waarde">{Math.round(t.kcal)}</span></div>
			<Ring waarde={t.kcal / d.kcal} kleur="amber" grootte={150} dik={12}>
				<div class="stapel krap" style="align-items: center; gap: 0; color: var(--tekst)">
					<span class="groot-cijfer" style="font-size: 2.5rem">{Math.abs(over)}</span>
					<span class="label">{over >= 0 ? 'kcal over' : 'kcal te veel'}</span>
				</div>
			</Ring>
			<div class="stat zij"><span class="label">Doel</span><span class="waarde">{d.kcal}</span></div>
		</div>
		<div class="raster drie macros">
			{#each MACRO as m}
				<div class="stapel krap">
					<span class="label">{m.naam}</span>
					<div class="balk" style="--balk-kleur: {m.kleur}"><span style="--waarde: {Math.min(100, (m.g / m.doel) * 100)}%"></span></div>
					<span class="klein tnum"><strong>{Math.round(m.g)}</strong><span class="gedempt"> / {m.doel} g</span></span>
				</div>
			{/each}
		</div>
		{#if d.geschat}<p class="klein gedempt" style="margin:0">Doel geschat uit je gewicht. <a href="/eten/doelen">Stel je onderhoud in</a> voor een preciezer doel.</p>{/if}
	</section>

	{#if form?.fout}<p class="melding fout">{form.fout}</p>{/if}
	{#if form?.bewaard}<p class="melding"><Icoon naam="vink" grootte={16} /> "{form.bewaard}" staat bij Mijn maaltijden.</p>{/if}

	<!-- Maaltijden -->
	{#each data.dag.maaltijden as m (m.id)}
		<section class="kaart maaltijd">
			<div class="rij uiteen">
				<div class="stapel krap" style="gap: 0">
					<h2>{m.naam}</h2>
					<span class="klein gedempt tnum">{Math.round(m.totaal.kcal)} kcal{m.regels.length ? ` · ${Math.round(m.totaal.eiwit)} g eiwit` : ''}</span>
				</div>
				<a class="knop primair vierkant" href="/eten/toevoegen?maaltijd={m.id}&datum={data.datum}" aria-label="Toevoegen aan {m.naam}"><Icoon naam="plus" /></a>
			</div>
			{#if m.regels.length}
				<ul class="lijst regels">
					{#each m.regels as r (r.id)}
						<li>
							<a class="stapel krap regel-link" style="gap: 0" href={r.product_id ? `/eten/product/${encodeURIComponent(r.product_id)}?maaltijd=${m.id}&datum=${data.datum}` : undefined}>
								<span class="naam">{r.naam}</span>
								<span class="klein gedempt">{r.portie ?? (r.product_id ? `${getal(r.hoeveelheid)} g` : 'snel toegevoegd')}</span>
							</a>
							<span class="tnum klein">{Math.round(r.kcal)}</span>
							<form method="POST" action="?/weg" use:enhance={bewaar}>
								<input type="hidden" name="id" value={r.id} />
								<button class="knop stil vierkant klein weg" aria-label="{r.naam} verwijderen"><Icoon naam="kruis" grootte={16} /></button>
							</form>
						</li>
					{/each}
				</ul>
			{/if}
			<div class="rij acties">
				{#if !m.regels.length && data.gisteren[m.id]}
					<form method="POST" action="?/kopieer" use:enhance={bewaar}>
						<input type="hidden" name="datum" value={data.datum} /><input type="hidden" name="maaltijd" value={m.id} />
						<button class="knop klein omlijnd"><Icoon naam="wissel" grootte={16} /> Zelfde als gisteren</button>
					</form>
				{/if}
				{#if m.regels.length}
					{#if bewaarOpen === m.id}
						<form method="POST" action="?/bewaar" class="rij" style="flex: 1" use:enhance={() => async ({ update }) => { await update({ reset: false }); bewaarOpen = null; }}>
							<input type="hidden" name="datum" value={data.datum} /><input type="hidden" name="maaltijd" value={m.id} />
							<input class="invoer" name="naam" placeholder="Naam, bv. Vast ontbijt" style="flex: 1; min-height: 2.25rem" />
							<button class="knop klein primair">Bewaar</button>
						</form>
					{:else}
						<button class="knop klein stil" onclick={() => (bewaarOpen = m.id)}>Bewaar als maaltijd</button>
					{/if}
				{/if}
			</div>
		</section>
	{/each}

	<!-- Water -->
	<section class="kaart stapel">
		<div class="rij uiteen">
			<h2>Water</h2>
			<span class="klein tnum"><strong>{getal(data.water / 1000)}</strong><span class="gedempt"> / {getal(d.water / 1000)} L</span></span>
		</div>
		<div class="glazen" aria-label="{data.water} ml van {d.water} ml">
			{#each Array.from({ length: glazen }) as _, i}
				<span class="glas" class:vol={i < Math.round(data.water / 250)}></span>
			{/each}
		</div>
		<div class="rij">
			<form method="POST" action="?/water" use:enhance={bewaar}><input type="hidden" name="datum" value={data.datum} /><input type="hidden" name="ml" value="-250" /><button class="knop omlijnd vierkant" aria-label="Glas eraf" disabled={!data.water}><Icoon naam="min" /></button></form>
			<form method="POST" action="?/water" use:enhance={bewaar} style="flex: 1"><input type="hidden" name="datum" value={data.datum} /><input type="hidden" name="ml" value="250" /><button class="knop vol-breed water-knop"><Icoon naam="plus" grootte={18} /> Glas (250 ml)</button></form>
		</div>
	</section>

	<!-- Vasten -->
	{#if isVandaag}
		<section class="kaart stapel">
			<div class="rij uiteen">
				<h2>Vasten</h2>
				{#if data.vasten}<span class="chip lila">{data.vasten.doel_uren}:{24 - data.vasten.doel_uren}</span>{/if}
			</div>
			{#if data.vasten}
				<div class="rij" style="gap: var(--r-4)">
					<Ring waarde={vastUren / data.vasten.doel_uren} kleur="lila" grootte={84} dik={8}><span class="tnum" style="font-weight: 800">{uurMin(vastUren)}</span></Ring>
					<div class="stapel krap">
						<strong>{vastUren >= data.vasten.doel_uren ? 'Doel gehaald' : `Nog ${uurMin(data.vasten.doel_uren - vastUren)}`}</strong>
						<span class="klein gedempt">Begonnen {new Date(data.vasten.begin).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}</span>
					</div>
				</div>
				<form method="POST" action="?/vasten" use:enhance={bewaar}><button class="knop omlijnd vol-breed">Stoppen met vasten</button></form>
			{:else}
				<p class="klein rustig" style="margin:0">Optioneel. Let op: met weinig eetmomenten is 1,8–2 g eiwit per kg lastiger te halen.</p>
				<form method="POST" action="?/vasten" class="rij" use:enhance={bewaar}>
					{#each [12, 14, 16] as u}<button class="knop klein omlijnd" name="uren" value={u}>{u}:{24 - u}</button>{/each}
				</form>
			{/if}
		</section>
	{/if}

	<nav class="rij">
		<a class="knop omlijnd" href="/eten/maaltijden">Mijn maaltijden</a>
		<a class="knop omlijnd" href="/eten/doelen">Doelen</a>
		<a class="knop omlijnd" href="/voeding">Overzicht</a>
	</nav>
</main>

<style>
	.datumbalk { display: grid; grid-template-columns: 2.75rem 1fr 2.75rem; align-items: center; }
	.datumbalk .midden { align-items: center; text-align: center; }
	.datumbalk .label { color: var(--amber); }
	.overzicht { display: flex; flex-direction: column; gap: var(--r-5); padding: var(--r-5) var(--r-4); }
	.kern { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: var(--r-2); }
	.zij { align-items: center; text-align: center; }
	.zij .waarde { font-size: var(--maat-l); }
	.maaltijd { display: flex; flex-direction: column; gap: var(--r-2); }
	.regels li { display: grid; grid-template-columns: 1fr auto 2rem; gap: var(--r-2); align-items: center; padding: var(--r-2) 0; }
	.regel-link { text-decoration: none; min-width: 0; }
	.regel-link .naam { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 550; }
	.weg { width: 2rem; min-height: 2rem; color: var(--tekst-gedempt); }
	.acties:empty { display: none; }
	.glazen { display: grid; grid-template-columns: repeat(auto-fill, minmax(1.75rem, 1fr)); gap: var(--r-1); }
	.glas { height: 2.25rem; border-radius: 4px 4px 8px 8px; border: 2px solid var(--lijn-sterk); }
	.glas.vol { background: color-mix(in srgb, var(--water) 70%, transparent); border-color: var(--water); }
	.water-knop { --knop-vlak: color-mix(in srgb, var(--water) 18%, var(--vlak-hoog)); }
</style>
