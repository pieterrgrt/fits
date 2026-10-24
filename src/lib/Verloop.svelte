<script>
	// Lijn van je beste set per sessie (geschatte 1RM, Epley). Stippen = gewicht dat je gebruikte.
	let { punten = [], hoogte = 140 } = $props();
	const B = 320;
	const marge = { l: 30, r: 8, b: 18, t: 10 };
	const waarden = $derived(punten.map((p) => p.e1rm));
	const lo = $derived(Math.floor(Math.min(...waarden) * 0.95));
	const hi = $derived(Math.ceil(Math.max(...waarden) * 1.03));
	const x = (i) => marge.l + (i / Math.max(1, punten.length - 1)) * (B - marge.l - marge.r);
	const y = (v) => marge.t + (1 - (v - lo) / Math.max(1, hi - lo)) * (hoogte - marge.t - marge.b);
	const lijn = $derived(punten.map((p, i) => `${i ? 'L' : 'M'}${x(i)},${y(p.e1rm)}`).join(' '));
	let actief = $state(null);
</script>

<figure class="verloop">
	<svg viewBox="0 0 {B} {hoogte}" role="img" aria-label="Verloop van je beste set">
		{#each [lo, (lo + hi) / 2, hi] as v}
			<line x1={marge.l} x2={B - marge.r} y1={y(v)} y2={y(v)} class="raster" />
			<text x={marge.l - 6} y={y(v) + 3} class="as">{Math.round(v)}</text>
		{/each}
		<path d="{lijn} L{x(punten.length - 1)},{hoogte - marge.b} L{x(0)},{hoogte - marge.b} Z" class="vlak" />
		<path d={lijn} class="lijn" />
		{#each punten as p, i}
			<circle cx={x(i)} cy={y(p.e1rm)} r={actief === i ? 5 : 3.2} class="punt" role="presentation"
				onpointerenter={() => (actief = i)} onpointerleave={() => (actief = null)} />
		{/each}
	</svg>
	<figcaption class="klein gedempt">
		{#if actief != null}
			{punten[actief].datum} · {punten[actief].gewicht} × {punten[actief].reps} · ≈ {Math.round(punten[actief].e1rm)} kg 1RM
		{:else}
			Geschatte 1RM van je beste set per sessie
		{/if}
	</figcaption>
</figure>

<style>
	.verloop { margin: 0; display: grid; gap: var(--r-2); }
	svg { width: 100%; height: auto; overflow: visible; }
	.raster { stroke: var(--lijn); stroke-width: 1; }
	.as { fill: var(--tekst-gedempt); font-size: 9px; text-anchor: end; font-family: var(--letter-tekst); }
	.lijn { fill: none; stroke: var(--grafiek); stroke-width: 2.5; stroke-linejoin: round; stroke-linecap: round; }
	.vlak { fill: var(--accent-tint); }
	.punt { fill: var(--achtergrond); stroke: var(--grafiek); stroke-width: 2; cursor: pointer; }
</style>
