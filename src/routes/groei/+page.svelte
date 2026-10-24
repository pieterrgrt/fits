<script>
	import { enhance } from '$app/forms';
	import Icoon from '#lib/Icoon.svelte';
	import Verloop from '#lib/Verloop.svelte';
	import { mooi } from '#lib/datum.js';
	import { getal } from '#lib/gewicht.js';
	import { schijvenPerKant } from '#lib/groei.js';

	let { data, form } = $props();
	let kies = $state(0);
	const k = $derived(data.kracht[kies]);
	const punten = $derived(
		(k?.verloop ?? []).map((v) => ({
			datum: v.datum,
			waarde: v.e1rm,
			record: v.record,
			tekst: `${mooi(v.datum)} · ${getal(v.gewicht)} × ${v.reps} · ≈ ${getal(Math.round(v.e1rm))} kg${v.record ? ' · record' : ''}`
		}))
	);

	// Rekenhulp voor de schijven
	let totaal = $state('');
	const kg = $derived(Number(String(totaal).replace(',', '.')));
	const plan = $derived(totaal === '' || !Number.isFinite(kg) ? null : schijvenPerKant(kg, data.stang));
	const s = $derived(data.slaap);
</script>

<main class="app stapel ruim">
	<header class="paginakop">
		<span class="label">Wordt het echt meer?</span>
		<h1>Groei</h1>
		<p class="rustig">Kracht is het beste teken dat je spieren groeien. Hier zie je per hoofdoefening of je sterker wordt.</p>
	</header>

	{#if data.lichteWeek}<p class="melding lila">Deze week is een lichte week. Die telt niet mee in de grafieken.</p>{/if}

	<!-- Kracht -->
	<section class="stapel">
		<h2>Krachtverloop</h2>
		{#if data.kracht.some((x) => x.verloop.length)}
			<div class="keuzes" role="tablist" aria-label="Oefening">
				{#each data.kracht as x, i (x.slug)}
					<button class="chip" role="tab" aria-selected={kies === i} class:gekozen={kies === i} onclick={() => (kies = i)} disabled={!x.verloop.length}>
						{x.naam}
					</button>
				{/each}
			</div>
			{#if k?.verloop.length}
				<div class="kaart stapel">
					<div class="raster drie krachtstats">
						<div class="stat"><span class="label">Nu ≈ 1RM</span><span class="waarde">{getal(Math.round(k.verloop[k.verloop.length - 1].e1rm))}<small> kg</small></span></div>
						<div class="stat"><span class="label">Sinds begin</span><span class="waarde" class:volt={k.groei > 0}>{k.groei != null ? (k.groei > 0 ? '+' : '') + getal(k.groei) + '%' : '–'}</span></div>
						<div class="stat"><span class="label">Records</span><span class="waarde">{k.records}</span></div>
					</div>
					{#if punten.length > 1}
						<Verloop {punten} onderschrift="Geschat maximum voor 1 herhaling, uit je beste set per training. Gevulde punten zijn records." />
					{:else}
						<p class="klein gedempt" style="margin:0">Na je tweede training zie je hier een lijn.</p>
					{/if}
				</div>
			{/if}
		{:else}
			<p class="leeg">Nog geen trainingen gelogd. Na een paar weken zie je hier hoe je sterker wordt.</p>
		{/if}
	</section>

	<!-- Records -->
	<section class="stapel">
		<h2>Records, laatste 8 weken</h2>
		{#if data.recenteRecords.length}
			<div class="kaart">
				<ul class="lijst">
					{#each data.recenteRecords as r}
						<li class="record-rij">
							<span class="stapel krap" style="gap: 0"><strong>{r.naam}</strong><span class="klein gedempt">{mooi(r.datum)} · {getal(r.gewicht)} kg × {r.reps}</span></span>
							<span class="chip volt"><Icoon naam="omhoog" grootte={14} /> ≈ {getal(Math.round(r.e1rm))} kg</span>
						</li>
					{/each}
				</ul>
			</div>
		{:else}
			<p class="klein gedempt" style="margin:0">Een record is een set waarmee je geschatte maximum hoger is dan ooit: meer gewicht, of meer reps op hetzelfde gewicht. Je ziet ze ook meteen tijdens je training.</p>
		{/if}
	</section>

	<!-- Slaap -->
	<section class="stapel">
		<h2>Slaap en prestaties</h2>
		{#if s.genoeg}
			{@const verschil = Math.round((s.goed.score - s.kort.score) * 10) / 10}
			<div class="kaart stapel">
				<div class="raster twee">
					<div class="stat"><span class="label">Na 7,5+ uur</span><span class="waarde" style="color: var(--lila)">{getal(s.goed.score)}<small>%</small></span><span class="klein gedempt">{s.goed.n} trainingen</span></div>
					<div class="stat"><span class="label">Na minder dan 7 uur</span><span class="waarde">{getal(s.kort.score)}<small>%</small></span><span class="klein gedempt">{s.kort.n} trainingen</span></div>
				</div>
				<p class="klein" style="margin:0">
					{#if verschil >= 1}Na een goede nacht til je gemiddeld <strong>{getal(verschil)}% meer</strong> dan na een korte nacht.
					{:else if verschil <= -1}Bij jou maakt een korte nacht (nog) geen verschil in kracht. Voor herstel en groei blijft 8 uur wel het doel.
					{:else}Nog weinig verschil tussen korte en goede nachten.{/if}
				</p>
				<p class="klein gedempt" style="margin:0">100% = je beste prestatie op die oefening in de 4 weken ervoor.</p>
			</div>
		{:else}
			<p class="klein gedempt" style="margin:0">
				Als je slaap bijhoudt (op Vandaag of via <a href="/gezondheid">Apple Gezondheid</a>), vergelijkt Fits hier je trainingen na korte en goede nachten. Daar zijn minstens 3 van elk voor nodig
				(nu {s.kort.n} kort, {s.goed.n} goed).
			</p>
		{/if}
	</section>

	<!-- Schijven -->
	<section class="stapel">
		<h2>Schijven rekenen</h2>
		<div class="kaart stapel">
			<div class="stapel">
				<label class="veld"><span>Totaal op de stang (kg)</span><input inputmode="decimal" bind:value={totaal} placeholder="bv. 52,5" /></label>
				<form method="POST" action="?/stang" class="veld stang" use:enhance={() => async ({ update }) => update({ reset: false })}>
					<label for="stang">Lege stang (kg)</label>
					<div class="rij" style="gap: var(--r-1)">
						<input id="stang" name="stang" inputmode="decimal" value={getal(data.stang)} />
						<button class="knop omlijnd">{form?.stangOk ? 'Ok ✓' : 'Bewaar'}</button>
					</div>
				</form>
			</div>
			{#if form?.fout}<p class="melding fout" style="margin:0">{form.fout}</p>{/if}
			{#if totaal !== ''}
				{#if plan}
					<div class="stang-beeld" aria-label="Per kant: {plan.map(getal).join(' + ')} kg">
						<span class="klein gedempt">Per kant:</span>
						{#each plan as p}<span class="schijf" style="--d: {1.4 + Math.sqrt(p) * 0.45}rem">{getal(p)}</span>{/each}
						{#if !plan.length}<span class="klein">alleen de stang</span>{/if}
					</div>
				{:else}
					<p class="klein gedempt" style="margin:0">Dat lukt niet precies met schijven van 25 tot 1,25 kg (op een stang van {getal(data.stang)} kg).</p>
				{/if}
			{/if}
			<p class="klein gedempt" style="margin:0">Tijdens je training staat dit ook onder elke oefening met een halterstang.</p>
		</div>
	</section>
</main>

<style>
	.keuzes { display: flex; gap: var(--r-1); overflow-x: auto; padding-bottom: 2px; scrollbar-width: none; }
	.keuzes .chip { cursor: pointer; white-space: nowrap; border: 0; font: inherit; font-size: var(--maat-s); }
	.keuzes .chip.gekozen { background: var(--accent); color: var(--op-accent); }
	.keuzes .chip:disabled { opacity: 0.4; cursor: default; }
	.waarde.volt { color: var(--accent-tekst); }
	.krachtstats .waarde { font-size: 1.5rem; }
	.record-rij { display: grid; grid-template-columns: 1fr auto; gap: var(--r-2); align-items: center; }
	.record-rij .chip { white-space: nowrap; }
	.stang label { font-size: var(--maat-s); color: var(--tekst-rustig); }
	.stang input { flex: 1; min-width: 0; }
	.stang-beeld { display: flex; flex-wrap: wrap; align-items: center; gap: var(--r-2); }
	.schijf {
		display: inline-grid; place-items: center; min-width: var(--d); height: var(--d); padding: 0 0.35rem;
		border-radius: 999px; background: var(--vlak-hoog); border: 3px solid var(--lijn-sterk);
		font-family: var(--letter-display); font-weight: 800; font-size: var(--maat-s);
	}
</style>
