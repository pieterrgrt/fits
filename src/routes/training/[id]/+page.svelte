<script>
	import { enhance } from '$app/forms';
	import { onMount } from 'svelte';
	import { invalidateAll } from '$app/navigation';
	import { wachtrij } from '#lib/training/wachtrij.svelte.js';
	import Icoon from '#lib/Icoon.svelte';
	import Figuur from '#lib/figuur/Figuur.svelte';
	import SetRij from '#lib/training/SetRij.svelte';
	import Rusttimer from '#lib/training/Rusttimer.svelte';
	import VervangKeuze from '#lib/VervangKeuze.svelte';
	import { oefening } from '#lib/oefeningen.js';
	import { gewichtTekst, repsTekst, getal } from '#lib/gewicht.js';
	import { mooi } from '#lib/datum.js';
	import { schijvenPerKant, gebruiktStang } from '#lib/groei.js';
	import { glijd, magBewegen } from '#lib/beweging.js';
	import { verzend } from '#lib/verzend.js';

	let { data, form } = $props();
	let timer;
	let open = $state(null); // id van het uitgeklapte item
	let uitleg = $state({}); // item-id → animatie tonen
	let vervang = $state(null); // item dat je aan het vervangen bent
	let afrondFout = $state('');
	let verstreken = $state('0:00');
	let vers = $state(''); // "item-nr" van de set die je net opsloeg: die tikt even op

	const items = $derived(data.items.map((it) => ({ ...it, oef: it.slug ? oefening(it.slug) : null })));
	const volgende = $derived(items.find((it) => it.gedaan.length < (it.sets_tijdelijk ?? it.sets)));
	const klaarAantal = $derived(items.filter((it) => it.gedaan.length >= (it.sets_tijdelijk ?? it.sets)).length);
	const totaalSets = $derived(items.reduce((a, it) => a + it.gedaan.length, 0));
	$effect(() => {
		if (open == null && volgende) open = volgende.id;
	});

	// Sets die zonder bereik op de telefoon zijn bewaard, gaan vanzelf naar de server.
	const wachtend = $derived(wachtrij.aantal(data.training.id));
	onMount(() => wachtrij.start(() => invalidateAll()));

	// Scherm aan houden tijdens de training (waar de telefoon dat toestaat).
	onMount(() => {
		let slot = null;
		const vraag = async () => {
			try {
				if (document.visibilityState === 'visible') slot = await navigator.wakeLock?.request('screen');
			} catch {}
		};
		vraag();
		document.addEventListener('visibilitychange', vraag);
		return () => {
			document.removeEventListener('visibilitychange', vraag);
			slot?.release().catch(() => {});
		};
	});

	onMount(() => {
		const begin = new Date(data.training.begin.replace(' ', 'T') + 'Z').getTime();
		const tik = () => {
			const s = Math.max(0, Math.floor((Date.now() - begin) / 1000));
			verstreken = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
		};
		tik();
		const i = setInterval(tik, 1000);
		return () => clearInterval(i);
	});

	// Een oefening openklappen en, als het inklappen van de vorige klaar is, in beeld brengen.
	// altijd: ook als de kop al zichtbaar is (na de laatste set ga je door naar de volgende oefening).
	function klap(id, altijd = false) {
		open = open === id ? null : id;
		if (open == null) return;
		setTimeout(() => {
			const el = document.getElementById(`oefening-${id}`);
			if (!el) return;
			const kop = document.querySelector('.kop')?.getBoundingClientRect().bottom ?? 0;
			const boven = el.getBoundingClientRect().top;
			if (altijd || boven < kop || boven > innerHeight * 0.6) el.scrollIntoView({ behavior: magBewegen() ? 'smooth' : 'auto', block: 'start' });
		}, 260);
	}
	function rustNa(it, nr) {
		const [a, b] = it.oef?.rust ?? [60, 60];
		const laatste = nr >= (it.sets_tijdelijk ?? it.sets);
		vers = `${it.id}-${nr}`;
		setTimeout(() => vers === `${it.id}-${nr}` && (vers = ''), 700);
		navigator.vibrate?.(12);
		timer?.start(b, a === b ? `${a} sec` : `${a}–${b} sec`);
		if (laatste) {
			const i = items.findIndex((x) => x.id === it.id);
			const nieuw = items.slice(i + 1).find((x) => x.gedaan.length < (x.sets_tijdelijk ?? x.sets));
			if (nieuw) klap(nieuw.id, true);
		}
	}
	const schijven = (it) => {
		if (!it.slug || !gebruiktStang(it.slug) || it.eenheid !== 'kg' || !(it.gewicht > data.stang)) return null;
		return schijvenPerKant(it.gewicht, data.stang);
	};
	const standaard = (it) => (it.gewicht === 0 && it.oef?.stap !== 'machine' ? '' : it.gewicht);
</script>

<header class="kop">
	<a href="/" class="knop stil vierkant" aria-label="Terug naar vandaag"><Icoon naam="terug" /></a>
	<div class="stapel krap midden">
		<span class="label">{klaarAantal}/{items.length} oefeningen · {totaalSets} sets</span>
		<strong class="display">{data.training.titel}</strong>
	</div>
	<span class="klok tnum" aria-label="Verstreken tijd">{verstreken}</span>
</header>

<main class="app stapel">
	{#if form?.fout}<p class="melding fout">{form.fout}</p>{/if}
	{#if wachtend}
		<p class="melding amber">{wachtend} {wachtend === 1 ? 'set staat' : 'sets staan'} op je telefoon en {wachtend === 1 ? 'gaat' : 'gaan'} naar de server zodra je bereik hebt.{#if wachtrij.bezig} Bezig…{/if}</p>
	{/if}
	{#if wachtrij.fout}<p class="melding fout">{wachtrij.fout}</p>{/if}

	{#if data.training.licht}
		<p class="melding lila"><span><strong>Lichte week.</strong> Zelfde gewichten, de helft van de sets, en hou in elke set 3 reps over. Zo herstellen je gewrichten en zenuwstelsel; volgende week ga je sterker verder.</span></p>
	{/if}

	{#if data.dag?.warmup}
		<details class="kaart warmup">
			<summary class="rij uiteen"><span class="rij"><Icoon naam="vlam" /> <strong>Warming-up</strong></span><span class="klein gedempt">5 min</span></summary>
			<p class="rustig" style="margin-top: var(--r-3)">{data.dag.warmup.tekst}</p>
			<div class="raster twee">
				{#each data.dag.warmup.items as w}
					{@const o = oefening(w.slug)}
					<a href="/oefeningen/{w.slug}" class="kaart hoog" style="padding: var(--r-2)">
						<Figuur anim={o.anim} klein label={o.naam} />
						<span class="klein"><strong>{o.kort}</strong> · {w.tekst}</span>
					</a>
				{/each}
			</div>
		</details>
	{/if}

	{#each items as it, n (it.id + (it.slug ?? ""))}
		{@const sets = it.sets_tijdelijk ?? it.sets}
		{@const af = it.gedaan.length >= sets}
		{@const sec = it.oef?.meet === 'sec'}
		<section class="kaart oefening" id="oefening-{it.id}" class:af class:open={open === it.id}>
			<button class="koptekst" onclick={() => klap(it.id)} aria-expanded={open === it.id}>
				<span class="nummer" class:volt={af} class:plop={af && vers.startsWith(`${it.id}-`)}>{#if af}<Icoon naam="vink" grootte={18} />{:else}{n + 1}{/if}</span>
				<span class="stapel krap" style="gap: 2px; text-align: left">
					<span class="naam">{it.wissel ? 'Wisselslot' : ''}{it.wissel && it.oef ? ' · ' : ''}{it.oef?.naam ?? ''}</span>
					<span class="klein gedempt">
						{sets} × {it.reps_min}{it.reps_max !== it.reps_min ? '–' + it.reps_max : ''}{sec ? ' sec' : ''} ·
						{it.gewicht ? gewichtTekst(it) : it.gewicht === 0 ? 'lichaamsgewicht' : 'zoek gewicht'}
						{#if it.gedaan.length}· {repsTekst(it.gedaan)}{/if}
					</span>
				</span>
				<svg class="klapper gedempt" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14" /><path class="staand" d="M12 5v14" /></svg>
			</button>

			{#if open === it.id}
				<div class="stapel inhoud" transition:glijd>
					{#if it.wissel && !it.slug}
						<p class="rustig" style="margin:0">Probeer een nieuw apparaat. Kies er één voor deze week:</p>
						<div class="raster twee">
							{#each it.opties as optie}
								{@const o = oefening(optie.slug)}
								<form method="POST" action="?/kies" use:enhance>
									<input type="hidden" name="item" value={it.id} />
									<input type="hidden" name="slug" value={optie.slug} />
									<button class="kaart hoog keuze">
										<Figuur anim={o.anim} klein speelt={false} label={o.naam} />
										<span class="klein"><strong>{o.naam}</strong>{optie.hint ? ` · ${optie.hint}` : ''}</span>
									</button>
								</form>
							{/each}
						</div>
					{:else}
						<div class="rij uiteen info">
							<div class="stapel krap" style="gap: 2px">
								{#if it.vorige}
									<span class="klein"><span class="gedempt">Vorige keer ({mooi(it.vorige.datum)}):</span> <strong class="tnum">{repsTekst(it.vorige.sets)}</strong>{it.vorige.sets[0]?.gewicht != null ? ` op ${getal(it.vorige.sets[0].gewicht)}` : ''}</span>
								{:else}
									<span class="klein gedempt">Eerste keer op dit schema.</span>
								{/if}
								<span class="klein"><span class="gedempt">Doel vandaag:</span> <strong class="accent tnum">{it.doel.join('/')}</strong></span>
							</div>
							<div class="rij" style="gap: var(--r-1); justify-content: flex-end">
								<button class="knop klein omlijnd" onclick={() => (uitleg[it.id] = !uitleg[it.id])}><Icoon naam="uitleg" grootte={16} /> Hoe?</button>
								{#if !it.wissel}<button class="knop klein omlijnd" onclick={() => (vervang = it)}><Icoon naam="wissel" grootte={16} /> Vervang</button>{/if}
							</div>
						</div>

						{#if uitleg[it.id]}
							<div class="uitleg kaart hoog" transition:glijd>
								<Figuur anim={it.oef.anim} label={it.oef.naam} />
								<ol class="klein stappen">{#each it.oef.uitvoering as s}<li>{s}</li>{/each}</ol>
								<a class="klein" href="/oefeningen/{it.slug}">Alles over {it.oef.kort} →</a>
							</div>
						{/if}

						{#if schijven(it)}
							{@const p = schijven(it)}
							<p class="klein schijven" style="margin:0">
								<span class="gedempt">Per kant op de stang van {getal(data.stang)} kg:</span>
								{#each p as kg}<span class="schijf" style="--d: {0.9 + Math.sqrt(kg) * 0.18}rem">{getal(kg)}</span>{/each}
							</p>
						{/if}

						{#if it.gewicht == null}
							<p class="melding">Zoek je gewicht: begin licht en bouw per set op tot je in de eerste set ongeveer {it.reps_min} haalt. Zondag zet je dat gewicht vast.</p>
						{:else if it.advies?.soort === 'zwaarder'}
							<p class="melding"><span><strong>Klaar voor zwaarder.</strong> Zondag pas je het gewicht aan, niet nu in de gym.</span></p>
						{/if}
						{#if it.vervangt}
							<form method="POST" action="?/terug" class="melding amber rij uiteen" use:enhance>
								<span>Vandaag in plaats van <strong>{oefening(it.vervangt)?.naam}</strong>. Je schema blijft zoals het was.</span>
								<input type="hidden" name="id" value={it.id} />
								<button class="knop klein stil">Terugzetten</button>
							</form>
						{/if}
						{#if it.notitie}<p class="klein gedempt" style="margin:0">{it.notitie}</p>{/if}

						<div>
							{#each Array.from({ length: Math.max(sets, it.gedaan.length) }, (_, i) => i + 1) as nr (nr + '-' + (it.gedaan.find((s) => s.nr === nr)?.id ?? 'x'))}
								<SetRij
									training={data.training.id}
									item={it}
									{nr}
									{sec}
									gedaan={it.gedaan.find((s) => s.nr === nr)}
									doelReps={it.doel[nr - 1]}
									beste={it.beste}
									standaardGewicht={it.gedaan.find((s) => s.nr === nr - 1)?.gewicht ?? standaard(it)}
									vers={vers === `${it.id}-${nr}`}
									onopgeslagen={() => rustNa(it, nr)}
								/>
							{/each}
						</div>
						<p class="klein gedempt" style="margin:0">
							Rust {it.oef.rust[0]}{it.oef.rust[0] !== it.oef.rust[1] ? '–' + it.oef.rust[1] : ''} sec ·
							{it.oef.soort === 'compound' ? 'altijd 1–2 reps over, ook in de laatste set' : 'laatste set mag tot 0 over'}
						</p>
					{/if}
				</div>
			{/if}
		</section>
	{/each}

	<section class="kaart stapel">
		<h2>Afronden</h2>
		<form method="POST" action="?/afronden" class="stapel" use:verzend={{ voor: () => {
			if (wachtend || !navigator.onLine) {
				afrondFout = 'Wacht tot je bereik hebt: eerst moeten je sets naar de server. Daarna kun je afronden.';
				wachtrij.verstuur();
				return false;
			}
		} }}>
			{#if afrondFout}<p class="melding amber" style="margin:0">{afrondFout}</p>{/if}
			<label class="veld"><span>Notitie</span><textarea name="notitie" placeholder="Bv. bench bovenkant gehaald → zondag naar 52,5"></textarea></label>
			<fieldset class="stapel krap tweeuur">
				<legend class="label">Twee-uursoptie (na de gym)</legend>
				<label class="vinkje"><input type="radio" name="extra" value="" checked /> Geen</label>
				<label class="vinkje"><input type="radio" name="extra" value="A" /> <span><strong>A</strong> · +30 min volume: 2 extra oefeningen uit het wisselslot, 3 sets (max 2× per week)</span></label>
				<label class="vinkje"><input type="radio" name="extra" value="B" /> <span><strong>B</strong> · +30–40 min cardio: zwemmen of zone 2 (niet de dag voor of na legs)</span></label>
				<label class="vinkje"><input type="radio" name="extra" value="C" /> <span><strong>C</strong> · +20 min core en mobility</span></label>
			</fieldset>
			<button class="knop primair groot vol-breed">Training afronden <Icoon naam="vink" /></button>
		</form>
		{#if totaalSets === 0}
			<form method="POST" action="?/stoppen" use:verzend><button class="knop stil vol-breed">Toch niet trainen</button></form>
		{/if}
	</section>
</main>

<Rusttimer bind:this={timer} />

{#if vervang}
	<VervangKeuze slug={vervang.slug} actie="?/vervang" velden={{ id: vervang.id }} vandaag sluit={() => (vervang = null)} />
{/if}

<style>
	.kop {
		position: sticky;
		top: 0;
		z-index: 10;
		display: grid;
		grid-template-columns: 2.75rem 1fr auto;
		align-items: center;
		gap: var(--r-3);
		padding: var(--r-3) var(--r-4);
		background: color-mix(in srgb, var(--achtergrond) 85%, transparent);
		backdrop-filter: blur(14px);
		-webkit-backdrop-filter: blur(14px);
		border-bottom: 1px solid var(--lijn);
	}
	.kop .midden { align-items: center; text-align: center; }
	.kop .display { font-size: var(--maat-l); }
	.klok { font-family: var(--letter-display); font-stretch: var(--breed); font-weight: 800; font-size: var(--maat-l); color: var(--accent-tekst); min-width: 3.5rem; text-align: right; }
	.app { padding-top: var(--r-4); padding-bottom: 8rem; }
	.oefening { padding: 0; overflow: hidden; scroll-margin-top: 5rem; transition: opacity var(--gewoon), border-color var(--gewoon); }
	.oefening.af:not(.open) { opacity: 0.72; }
	.oefening.open { border-color: var(--lijn-sterk); }
	.klapper { fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; transition: transform var(--gewoon) var(--veer); }
	.klapper .staand { transform-box: fill-box; transform-origin: center; transition: transform var(--gewoon) var(--veer); }
	.open .klapper { transform: rotate(180deg); }
	.open .klapper .staand { transform: scaleY(0); }
	.koptekst {
		all: unset;
		box-sizing: border-box;
		width: 100%;
		display: grid;
		grid-template-columns: 2.25rem 1fr auto;
		gap: var(--r-3);
		align-items: center;
		padding: var(--r-4);
		cursor: pointer;
		transition: background var(--snel);
	}
	.koptekst:active { background: var(--vlak-hoog); }
	.koptekst:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; }
	.nummer {
		width: 2.25rem; height: 2.25rem; border-radius: 50%;
		display: grid; place-items: center;
		background: var(--vlak-hoog);
		font-family: var(--letter-display); font-stretch: var(--breed); font-weight: 800;
	}
	.nummer { transition: background var(--gewoon), color var(--gewoon); }
	.nummer.volt { background: var(--accent); color: var(--op-accent); }
	.nummer.plop { animation: plop 420ms var(--veer); }
	@keyframes plop { 40% { transform: scale(1.18); } }
	.naam { font-weight: 700; }
	.inhoud { padding: 0 var(--r-4) var(--r-4); }
	.info { align-items: flex-start; }
	.uitleg { display: grid; gap: var(--r-3); }
	.stappen { margin: 0; padding-left: 1.2rem; display: grid; gap: var(--r-1); color: var(--tekst-rustig); }
	.keuze { all: unset; box-sizing: border-box; display: flex; flex-direction: column; gap: var(--r-2); padding: var(--r-2); border-radius: var(--hoek-m); background: var(--vlak-hoog); border: 1px solid var(--lijn); cursor: pointer; width: 100%; }
	.keuze:hover { border-color: var(--accent); }
	.warmup summary { list-style: none; }
	.schijven { display: flex; flex-wrap: wrap; align-items: center; gap: var(--r-1); }
	.schijf {
		display: inline-grid; place-items: center; min-width: var(--d); height: var(--d); padding: 0 0.3rem;
		border-radius: 999px; background: var(--vlak-hoog); border: 2px solid var(--lijn-sterk);
		font-family: var(--letter-display); font-weight: 800; font-size: var(--maat-xs);
	}
	.tweeuur { border: 0; padding: 0; margin: 0; }
	.tweeuur .vinkje { align-items: flex-start; }
</style>
