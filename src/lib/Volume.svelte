<script>
	// Harde sets per spiergroep: deze week gedaan, met het schema als streepje en 10–20 als band.
	import { SPIERGROEPEN, BEREIK, oordeel } from './volume.js';
	import { getal } from './gewicht.js';

	let { gedaan, gepland } = $props();
	const MAX = 26;
	const pct = (n) => `${(Math.min(n, MAX) / MAX) * 100}%`;
</script>

<div class="volume">
	<div class="kop klein gedempt"><span></span><span class="schaal"><span style="left: {pct(BEREIK[0])}">{BEREIK[0]}</span><span style="left: {pct(BEREIK[1])}">{BEREIK[1]}</span></span><span>sets</span></div>
	{#each SPIERGROEPEN as g (g.id)}
		{@const n = gedaan[g.id]}
		{@const p = gepland[g.id]}
		<div class="rij-v">
			<span class="naam">{g.naam}</span>
			<span class="baan" role="img" aria-label="{g.naam}: {getal(n)} sets gedaan, {getal(p)} gepland">
				<span class="band" style="left: {pct(BEREIK[0])}; width: calc({pct(BEREIK[1])} - {pct(BEREIK[0])})"></span>
				<span class="vulling {oordeel(n)}" style="width: {pct(n)}"></span>
				{#if p}<span class="plan" style="left: {pct(p)}" title="Gepland: {getal(p)}"></span>{/if}
			</span>
			<span class="getal tnum"><strong>{getal(n)}</strong><span class="gedempt">/{getal(p)}</span></span>
		</div>
	{/each}
	<p class="klein gedempt uitleg">
		<span class="stip" style="color: var(--grafiek)"></span> gedaan deze week · <span class="streep"></span> gepland in je schema · band: 10–20 sets, de richting voor groei.
		Een set telt 1 voor de spieren die het werk doen en ½ voor de spieren die meehelpen.
	</p>
</div>

<style>
	.volume { display: grid; gap: var(--r-2); }
	.kop, .rij-v { display: grid; grid-template-columns: 7.5rem 1fr 3.5rem; gap: var(--r-2); align-items: center; }
	.schaal { position: relative; height: 1rem; }
	.schaal span { position: absolute; transform: translateX(-50%); }
	.naam { font-size: var(--maat-s); font-weight: 600; }
	.baan { position: relative; height: 0.75rem; border-radius: var(--hoek-rond); background: var(--vlak-hoog); overflow: visible; }
	.band { position: absolute; top: 0; bottom: 0; background: var(--accent-tint); border-radius: 2px; }
	.vulling { position: absolute; left: 0; top: 0; bottom: 0; border-radius: var(--hoek-rond); }
	.vulling.goed { background: var(--grafiek); }
	.vulling.weinig { background: var(--amber); }
	.vulling.veel { background: var(--lila); }
	.plan { position: absolute; top: -3px; bottom: -3px; width: 2px; margin-left: -1px; background: var(--tekst); border-radius: 1px; }
	.getal { text-align: right; font-size: var(--maat-s); }
	.uitleg { margin: var(--r-2) 0 0; }
	.streep { display: inline-block; width: 2px; height: 0.8em; background: var(--tekst); vertical-align: -1px; margin-right: 2px; }
</style>
