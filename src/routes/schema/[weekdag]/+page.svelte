<script>
	import { untrack, tick } from 'svelte';
	import { enhance } from '$app/forms';
	import { DAGEN, mooi, hoeLang } from '#lib/datum.js';
	import { gewichtTekst } from '#lib/gewicht.js';
	import { oefening } from '#lib/oefeningen.js';
	import Figuur from '#lib/figuur/Figuur.svelte';
	import Icoon from '#lib/Icoon.svelte';
	import VervangKeuze from '#lib/VervangKeuze.svelte';
	import { groepVan } from '#lib/alternatieven.js';

	let { data, form } = $props();
	const d = $derived(data.dag);
	const bewaar = () => async ({ update }) => update({ reset: false });
	let open = $state(null); // id van de oefening waarvan gewicht/sets/reps open staan
	let vervang = $state(null); // de oefening die je aan het vervangen bent

	/* ---------- Slepen ---------- */
	// Pak een oefening bij het handvat (vinger of muis) en sleep hem naar een andere plek.
	let lijst = $state([]);
	let sleep = $state(null); // { id, grijp, y }: de oefening die je nu sleept
	// Volgt de server, behalve tijdens het slepen (dan is de lijst van jou).
	$effect.pre(() => {
		const items = data.dag.items;
		if (!untrack(() => sleep)) lijst = [...items];
	});
	const kaarten = {};
	let lijstEl;
	let volgordeForm;
	let idsVeld = $state('');
	let scrollLus = 0;

	function pak(e, id) {
		if (e.button !== undefined && e.button !== 0) return;
		e.preventDefault();
		const kaart = kaarten[id].getBoundingClientRect();
		const top = lijstEl.getBoundingClientRect().top;
		const ruimte = kaart.height + parseFloat(getComputedStyle(lijstEl).rowGap || '0');
		// Midden van elke andere kaart zoals de lijst zou zijn zonder de gesleepte kaart (ten opzichte van de lijst).
		const middens = lijst
			.filter((x) => x.id !== id)
			.map((x) => {
				const r = kaarten[x.id].getBoundingClientRect();
				return r.top - top - (r.top > kaart.top ? ruimte : 0) + r.height / 2;
			});
		sleep = { id, grijp: e.clientY - kaart.top, hoogte: kaart.height, middens, y: e.clientY, beginVolgorde: lijst.map((x) => x.id).join(',') };
		// Op de hele pagina luisteren: als de kaart in de lijst verhuist, raakt het handvat de vinger kwijt.
		addEventListener('pointermove', beweeg);
		addEventListener('pointerup', los);
		addEventListener('pointercancel', los);
		navigator.vibrate?.(15);
		scrollLus = requestAnimationFrame(autoScroll);
	}
	function beweeg(e) {
		if (!sleep) return;
		sleep.y = e.clientY;
		herschik();
	}
	function herschik() {
		// Nieuwe plek: hoeveel andere kaarten liggen (in de lijst zonder de gesleepte) boven het midden van de gesleepte kaart?
		const midden = sleep.y - sleep.grijp + sleep.hoogte / 2 - lijstEl.getBoundingClientRect().top;
		const plek = sleep.middens.filter((m) => m < midden).length;
		const anderen = lijst.filter((x) => x.id !== sleep.id);
		const gesleept = lijst.find((x) => x.id === sleep.id);
		const nieuw = [...anderen.slice(0, plek), gesleept, ...anderen.slice(plek)];
		if (nieuw.some((x, i) => x.id !== lijst[i].id)) lijst = nieuw;
	}
	function autoScroll() {
		if (!sleep) return;
		const rand = 80;
		const v = sleep.y < rand ? -(rand - sleep.y) / 6 : sleep.y > innerHeight - rand - 70 ? (sleep.y - (innerHeight - rand - 70)) / 6 : 0;
		if (v) {
			scrollBy(0, v);
			herschik();
		}
		scrollLus = requestAnimationFrame(autoScroll);
	}
	function los() {
		removeEventListener('pointermove', beweeg);
		removeEventListener('pointerup', los);
		removeEventListener('pointercancel', los);
		if (!sleep) return;
		cancelAnimationFrame(scrollLus);
		const ids = lijst.map((x) => x.id).join(',');
		const veranderd = ids !== sleep.beginVolgorde;
		sleep = null;
		if (veranderd) {
			idsVeld = ids;
			tick().then(() => volgordeForm.requestSubmit());
		}
	}
	// De gesleepte kaart volgt de vinger. Na het bijwerken van de lijst (zijn plek kan veranderd zijn) rekenen we opnieuw.
	$effect(() => {
		if (!sleep) return;
		const y = sleep.y;
		lijst; // opnieuw na elke verschuiving in de lijst
		const el = kaarten[sleep.id];
		const dy = y - sleep.grijp - (lijstEl.getBoundingClientRect().top + el.offsetTop);
		el.style.transform = `translateY(${dy}px) scale(1.02)`;
		return () => (el.style.transform = '');
	});
</script>

<main class="app stapel">
	<a href="/schema" class="knop stil klein" style="align-self: flex-start"><Icoon naam="terug" grootte={16} /> Schema</a>
	<header class="paginakop">
		<span class="label">{DAGEN[d.weekdag - 1]}</span>
		<h1>{d.titel}{#if d.focus}<span class="accent"> · {d.focus}</span>{/if}</h1>
		{#if d.warmup}<p class="rustig"><Icoon naam="vlam" grootte={16} /> {d.warmup.tekst}</p>{/if}
		{#if d.alternatief}<p class="klein gedempt">{d.alternatief}</p>{/if}
	</header>
	{#if form?.fout}<p class="melding fout">{form.fout}</p>{/if}

	<form method="POST" action="?/volgorde" bind:this={volgordeForm} use:enhance={bewaar} hidden>
		<input type="hidden" name="ids" value={idsVeld} />
	</form>

	<div class="lijst-items" bind:this={lijstEl} class:sleept={!!sleep}>
	{#each lijst as it, n (it.id)}
		{@const o = it.slug ? oefening(it.slug) : null}
		<article class="kaart item" class:wissel={it.wissel} class:gesleept={sleep?.id === it.id} bind:this={kaarten[it.id]}>
			<div class="kopregel">
				<button class="greep" aria-label="{o?.naam ?? 'Wisselslot'} verslepen" title="Sleep om te verplaatsen"
					onpointerdown={(e) => pak(e, it.id)}>
					<Icoon naam="greep" grootte={22} />
				</button>
				{#if o}<div class="mini"><Figuur anim={o.anim} klein speelt={false} label={o.naam} /></div>{:else}<div class="mini leeg-mini"><Icoon naam="wissel" /></div>{/if}
				<div class="stapel krap" style="gap: 2px; min-width: 0">
					<span class="label">{it.wissel ? 'Wisselslot' : `Oefening ${n + 1}`}{o ? ` · ${groepVan(o.slug)}` : ''}</span>
					<strong>{o?.naam ?? 'Nog niets gekozen'}</strong>
					<span class="klein rustig">{it.sets_tijdelijk ?? it.sets} × {it.reps_min}–{it.reps_max} · {gewichtTekst(it)}</span>
					{#if it.sinds}<span class="klein gedempt">sinds {mooi(it.sinds)} ({hoeLang(it.sinds)})</span>{:else if it.slug}<span class="klein gedempt">sinds ___</span>{/if}
				</div>
				<div class="pijlen">
					<form method="POST" action="?/schuif" use:enhance={bewaar}><input type="hidden" name="id" value={it.id} /><input type="hidden" name="richting" value="op" /><button class="knop stil vierkant" disabled={n === 0} aria-label="{o?.naam ?? 'Wisselslot'} omhoog"><Icoon naam="omhoog" grootte={20} /></button></form>
					<form method="POST" action="?/schuif" use:enhance={bewaar}><input type="hidden" name="id" value={it.id} /><input type="hidden" name="richting" value="af" /><button class="knop stil vierkant omlaag" disabled={n === lijst.length - 1} aria-label="{o?.naam ?? 'Wisselslot'} omlaag"><Icoon naam="omhoog" grootte={20} /></button></form>
				</div>
			</div>

			{#if ['zwaarder', 'falen', 'wacht', 'set-minder', 'vervang'].includes(it.advies?.soort)}
				<p class="melding" class:amber={it.advies.soort === 'vervang' || it.advies.soort === 'set-minder'}>{it.advies.tekst}</p>
			{/if}

			<div class="rij acties">
				{#if it.slug && !it.wissel}
					<button class="knop klein omlijnd" onclick={() => (vervang = it)}><Icoon naam="wissel" grootte={16} /> Vervang</button>
				{/if}
				{#if it.slug}
					<button class="knop klein stil" aria-expanded={open === it.id} onclick={() => (open = open === it.id ? null : it.id)}><Icoon naam="bewerk" grootte={16} /> Gewicht, sets, reps</button>
				{/if}
			</div>

			{#if it.wissel}
				<form method="POST" action="?/wissel" class="stapel krap" use:enhance={bewaar}>
					<input type="hidden" name="id" value={it.id} />
					<span class="label">Deze week in het wisselslot</span>
					<div class="raster twee">
						{#each it.opties as optie}
							<button name="slug" value={optie.slug} class="chip" aria-pressed={it.slug === optie.slug} style="justify-content: flex-start; height: auto; padding: 0.5rem 0.75rem; white-space: normal">
								{oefening(optie.slug)?.naam}{optie.hint ? ` · ${optie.hint}` : ''}
							</button>
						{/each}
					</div>
				</form>
				<details class="klein">
					<summary class="gedempt">Opties van dit wisselslot aanpassen</summary>
					<form method="POST" action="?/opties" class="stapel krap" style="margin-top: var(--r-2)" use:enhance={bewaar}>
						<input type="hidden" name="id" value={it.id} />
						<div class="opties">
							{#each data.bibliotheek as b}
								<label class="vinkje"><input type="checkbox" name="optie" value={b.slug} checked={it.opties.some((x) => x.slug === b.slug)} /> {b.naam}</label>
							{/each}
						</div>
						<button class="knop omlijnd klein">Opties opslaan</button>
					</form>
				</details>
			{/if}

			{#if open === it.id || form?.id === it.id}
				<div class="stapel bewerk">
					<form method="POST" action="?/item" class="raster drie" use:enhance={bewaar}>
						<input type="hidden" name="id" value={it.id} />
						<label class="veld"><span>Sets</span><input name="sets" inputmode="numeric" value={it.sets} /></label>
						<label class="veld"><span>Reps van</span><input name="reps_min" inputmode="numeric" value={it.reps_min} /></label>
						<label class="veld"><span>tot</span><input name="reps_max" inputmode="numeric" value={it.reps_max} /></label>
						<label class="veld"><span>Gewicht</span><input name="gewicht" inputmode="decimal" value={it.gewicht ?? ''} placeholder="zoek" /></label>
						<label class="veld"><span>Eenheid</span><select name="eenheid"><option value="kg" selected={it.eenheid === 'kg'}>kg</option><option value="lbs" selected={it.eenheid === 'lbs'}>lbs</option></select></label>
						<label class="veld"><span>Sinds</span><input name="sinds" type="date" value={it.sinds ?? ''} /><small>Wordt vandaag als je het gewicht wijzigt</small></label>
						<label class="vinkje" style="grid-column: 1 / -1"><input type="checkbox" name="per_stuk" checked={it.per_stuk} /> Dumbbells: gewicht per stuk (2×)</label>
						<label class="veld" style="grid-column: 1 / -1"><span>Notitie</span><input name="notitie" value={it.notitie ?? ''} /></label>
						<button class="knop primair" style="grid-column: 1 / -1">{form?.ok === it.id ? 'Opgeslagen ✓' : 'Opslaan'}</button>
					</form>
					<form method="POST" action="?/weg" use:enhance onsubmit={(e) => { if (!confirm('Uit het schema halen? Je logboek blijft bewaard.')) e.preventDefault(); }}>
						<input type="hidden" name="id" value={it.id} /><button class="knop klein stil" style="color: var(--fout)">Uit het schema halen</button>
					</form>
				</div>
			{/if}
		</article>
	{/each}
	</div>

	{#if vervang}
		<VervangKeuze slug={vervang.slug} actie="?/wissel" velden={{ id: vervang.id }} sluit={() => (vervang = null)} />
	{/if}

	<form method="POST" action="?/nieuw" class="kaart rij" use:enhance>
		<select name="slug" class="invoer" style="flex: 1" aria-label="Oefening toevoegen">
			<option value="">Oefening toevoegen…</option>
			{#each data.bibliotheek as b}<option value={b.slug}>{b.naam}</option>{/each}
		</select>
		<button class="knop omlijnd"><Icoon naam="plus" grootte={18} /> Toevoegen</button>
	</form>

	<details class="kaart">
		<summary><strong>Dag bewerken</strong></summary>
		<form method="POST" action="?/dag" class="stapel" style="margin-top: var(--r-3)" use:enhance={bewaar}>
			<label class="veld"><span>Naam</span><input name="titel" value={d.titel} /></label>
			<label class="veld"><span>Focus</span><input name="focus" value={d.focus ?? ''} /></label>
			<label class="veld"><span>Warming-up</span><input name="warmup" value={d.warmup?.tekst ?? ''} /></label>
			<label class="veld"><span>Soort dag</span><select name="soort"><option value="gym" selected={d.soort === 'gym'}>Gym</option><option value="rust" selected={d.soort === 'rust'}>Rust</option></select></label>
			<button class="knop omlijnd">Opslaan</button>
		</form>
	</details>
</main>

<style>
	.item { display: flex; flex-direction: column; gap: var(--r-3); }
	.item.wissel { border-style: dashed; }
	.kopregel { display: grid; grid-template-columns: auto auto 1fr auto; gap: var(--r-3); align-items: center; }
	.lijst-items { display: flex; flex-direction: column; gap: var(--r-4); position: relative; }
	.greep {
		all: unset;
		box-sizing: border-box;
		display: grid;
		place-items: center;
		width: 1.75rem;
		height: 3rem;
		margin-left: calc(-1 * var(--r-2));
		color: var(--tekst-gedempt);
		cursor: grab;
		touch-action: none;
		border-radius: var(--hoek-s);
	}
	.greep:hover { color: var(--tekst); }
	.greep:focus-visible { outline: 2px solid var(--accent); }
	.sleept, .sleept * { cursor: grabbing; user-select: none; -webkit-user-select: none; }
	.item.gesleept { position: relative; z-index: 5; border-color: var(--accent); box-shadow: 0 24px 48px -16px rgb(0 0 0 / 0.6); transition: none; }
	.sleept .item:not(.gesleept) { transition: transform var(--gewoon) var(--veer); }
	.pijlen { display: flex; flex-direction: column; gap: var(--r-1); }
	.pijlen .knop { width: 2.5rem; min-height: 2.5rem; }
	.omlaag :global(svg) { transform: rotate(180deg); }
	.leeg-mini { display: grid; place-items: center; aspect-ratio: 4 / 3; color: var(--tekst-gedempt); }
	.acties:empty { display: none; }
	.mini { width: 5.5rem; background: var(--vlak-hoog); border-radius: var(--hoek-m); padding: 2px; }
	.bewerk { padding-top: var(--r-4); border-top: 1px solid var(--lijn); }
	.opties { display: grid; grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr)); gap: var(--r-1); max-height: 16rem; overflow: auto; }
</style>
