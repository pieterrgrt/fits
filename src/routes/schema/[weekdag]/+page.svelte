<script>
	import { enhance } from '$app/forms';
	import { DAGEN, mooi, hoeLang } from '#lib/datum.js';
	import { gewichtTekst } from '#lib/gewicht.js';
	import { oefening } from '#lib/oefeningen.js';
	import Figuur from '#lib/figuur/Figuur.svelte';
	import Icoon from '#lib/Icoon.svelte';

	let { data, form } = $props();
	const d = $derived(data.dag);
	const bewaar = () => async ({ update }) => update({ reset: false });
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

	{#each d.items as it, n (it.id)}
		{@const o = it.slug ? oefening(it.slug) : null}
		<details class="kaart item" open={form?.id === it.id}>
			<summary>
				<div class="kopregel">
					{#if o}<div class="mini"><Figuur anim={o.anim} klein speelt={false} label={o.naam} /></div>{/if}
					<div class="stapel krap" style="gap: 2px; min-width: 0">
						<span class="label">{it.wissel ? 'Wisselslot' : `Oefening ${n + 1}`}</span>
						<strong>{o?.naam ?? 'Nog niets gekozen'}</strong>
						<span class="klein rustig">{it.sets_tijdelijk ?? it.sets} × {it.reps_min}–{it.reps_max} · {gewichtTekst(it)}</span>
						{#if it.sinds}<span class="klein gedempt">sinds {mooi(it.sinds)} ({hoeLang(it.sinds)})</span>{:else if it.slug}<span class="klein gedempt">sinds ___</span>{/if}
					</div>
					<Icoon naam="bewerk" grootte={18} />
				</div>
			</summary>

			<div class="stapel bewerk">
				{#if it.advies && it.advies.soort !== 'doorgaan' && it.advies.soort !== 'kies'}
					<p class="melding" class:amber={it.advies.soort === 'vervang' || it.advies.soort === 'set-minder'}>{it.advies.tekst}</p>
				{/if}
				{#if it.slug}
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
				{/if}

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
				{:else}
					<details class="klein">
						<summary class="gedempt">Vervangen door een andere oefening</summary>
						<form method="POST" action="?/wissel" class="rij" style="margin-top: var(--r-2)" use:enhance={bewaar}>
							<input type="hidden" name="id" value={it.id} />
							<select name="slug" class="invoer" style="flex: 1">
								{#each data.bibliotheek as b}<option value={b.slug} selected={b.slug === it.slug}>{b.naam}</option>{/each}
							</select>
							<button class="knop omlijnd">Vervang</button>
						</form>
					</details>
				{/if}

				<div class="rij">
					<form method="POST" action="?/schuif" use:enhance><input type="hidden" name="id" value={it.id} /><input type="hidden" name="richting" value="op" /><button class="knop klein omlijnd" disabled={n === 0}>Omhoog</button></form>
					<form method="POST" action="?/schuif" use:enhance><input type="hidden" name="id" value={it.id} /><input type="hidden" name="richting" value="af" /><button class="knop klein omlijnd" disabled={n === d.items.length - 1}>Omlaag</button></form>
					<form method="POST" action="?/weg" use:enhance onsubmit={(e) => { if (!confirm('Uit het schema halen? Je logboek blijft bewaard.')) e.preventDefault(); }}>
						<input type="hidden" name="id" value={it.id} /><button class="knop klein gevaar">Weghalen</button>
					</form>
				</div>
			</div>
		</details>
	{/each}

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
	.item summary { list-style: none; }
	.kopregel { display: grid; grid-template-columns: auto 1fr auto; gap: var(--r-3); align-items: center; }
	.mini { width: 5.5rem; background: var(--vlak-hoog); border-radius: var(--hoek-m); padding: 2px; }
	.bewerk { margin-top: var(--r-4); padding-top: var(--r-4); border-top: 1px solid var(--lijn); }
	.opties { display: grid; grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr)); gap: var(--r-1); max-height: 16rem; overflow: auto; }
</style>
