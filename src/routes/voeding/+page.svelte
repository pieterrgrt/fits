<script>
	import { enhance } from '$app/forms';
	import { mooi } from '#lib/datum.js';
	import { getal } from '#lib/gewicht.js';
	import Icoon from '#lib/Icoon.svelte';

	let { data, form } = $props();
	const p = $derived(data.profiel);
	const eiwit = $derived(p.gewicht ? [Math.round(p.gewicht * 1.8), Math.round(p.gewicht * 2)] : null);
	const kcal = $derived(p.onderhoud ? [p.onderhoud + 300, p.onderhoud + 500] : null);
	const gem = (k) => {
		const w = data.regels.map((r) => r[k]).filter((v) => v != null);
		return w.length ? w.reduce((a, b) => a + b, 0) / w.length : null;
	};
</script>

<main class="app stapel ruim">
	<header class="paginakop">
		<span class="label">Groei komt uit gym + eten + slaap</span>
		<h1>Eten en slaap</h1>
	</header>

	<div class="raster drie">
		<div class="kaart stat" style="--accent: var(--amber)">
			<span class="label">Eiwit per dag</span>
			<span class="waarde" style="color: var(--amber)">{eiwit ? `${eiwit[0]}–${eiwit[1]}` : '?'}<small>g</small></span>
			<span class="klein gedempt">1,8–2 g per kg</span>
		</div>
		<div class="kaart stat">
			<span class="label">Calorieën</span>
			<span class="waarde" style="color: var(--amber)">{kcal ? `${kcal[0]}–${kcal[1]}` : '+300–500'}</span>
			<span class="klein gedempt">boven onderhoud</span>
		</div>
		<div class="kaart stat">
			<span class="label">Slaap</span>
			<span class="waarde" style="color: var(--lila)">8+<small>uur</small></span>
			<span class="klein gedempt">elke nacht</span>
		</div>
	</div>

	<form method="POST" action="?/profiel" class="kaart raster twee" use:enhance={() => async ({ update }) => update({ reset: false })}>
		<label class="veld"><span>Lichaamsgewicht (kg)</span><input name="gewicht" inputmode="decimal" value={p.gewicht ? getal(p.gewicht) : ''} /><small>Je laatst gelogde gewicht telt.</small></label>
		<label class="veld"><span>Onderhoud (kcal per dag)</span><input name="onderhoud" inputmode="numeric" value={p.onderhoud ?? ''} placeholder="bv. 2600" /><small>Weet je het niet? Begin met gewicht × 33.</small></label>
		<button class="knop omlijnd" style="grid-column: 1 / -1">{form?.ok ? 'Opgeslagen ✓' : 'Opslaan'}</button>
		{#if form?.fout}<p class="melding fout" style="grid-column: 1 / -1">{form.fout}</p>{/if}
	</form>

	<section class="stapel">
		<div class="rij uiteen">
			<h2>Twee weken</h2>
			<span class="klein gedempt">gem. {gem('eiwit') ? Math.round(gem('eiwit')) + ' g eiwit' : '–'} · {gem('slaap') ? getal(Math.round(gem('slaap') * 10) / 10) + ' u slaap' : '–'}</span>
		</div>
		{#if data.regels.length}
			<div class="kaart">
				<ul class="lijst">
					{#each data.regels as r}
						<li class="regel">
							<span class="klein gedempt">{mooi(r.datum, { dag: true })}</span>
							<div class="balk" title="Eiwit" style="--balk-kleur: var(--amber)"><span style="--waarde: {eiwit && r.eiwit ? Math.min(100, (r.eiwit / eiwit[0]) * 100) : 0}%"></span></div>
							<span class="klein tnum">{r.eiwit ?? '–'} g</span>
							<div class="balk" title="Slaap" style="--balk-kleur: var(--lila)"><span style="--waarde: {r.slaap ? Math.min(100, (r.slaap / 8) * 100) : 0}%"></span></div>
							<span class="klein tnum">{r.slaap != null ? getal(r.slaap) + ' u' : '–'}</span>
						</li>
					{/each}
				</ul>
			</div>
		{:else}
			<p class="leeg">Vul elke dag je dagregel in op <a href="/">Vandaag</a>: slaap, eiwit en (af en toe) je gewicht.</p>
		{/if}
	</section>

	{#if data.weken.length}
		<section class="stapel">
			<h2>Weekregels</h2>
			<div class="kaart">
				<ul class="lijst tnum klein">
					{#each data.weken as w}
						<li class="rij uiteen"><span class="gedempt">week van {mooi(w.week)}</span><span>slaap {w.slaap != null ? getal(w.slaap) : '–'} u · energie {w.energie ?? '–'}/10 · {w.gewicht != null ? getal(w.gewicht) + ' kg' : '–'}{w.gemist ? ` · gemist: ${w.gemist}` : ''}</span></li>
					{/each}
				</ul>
			</div>
		</section>
	{/if}
</main>

<style>
	.stat .waarde { font-size: var(--maat-l); }
	.regel { display: grid; grid-template-columns: 5.5rem 1fr 3.25rem 1fr 3rem; gap: var(--r-2); align-items: center; }
</style>
