<script>
	// Lijngrafiek door de tijd. punten: [{ datum, waarde, tekst, record? }]; records zijn gevulde punten.; tekst verschijnt bij aanwijzen.
	let { punten = [], hoogte = 140, onderschrift = '', kleur = 'var(--grafiek)', decimalen = 0 } = $props();
	const B = 320;
	const marge = { l: 30, r: 8, b: 18, t: 10 };
	const waarden = $derived(punten.map((p) => p.waarde));
	const lo = $derived(Math.min(...waarden) - Math.max(0.5, (Math.max(...waarden) - Math.min(...waarden)) * 0.15));
	const hi = $derived(Math.max(...waarden) + Math.max(0.5, (Math.max(...waarden) - Math.min(...waarden)) * 0.1));
	const x = (i) => marge.l + (i / Math.max(1, punten.length - 1)) * (B - marge.l - marge.r);
	const y = (v) => marge.t + (1 - (v - lo) / Math.max(0.001, hi - lo)) * (hoogte - marge.t - marge.b);
	const lijn = $derived(punten.map((p, i) => `${i ? 'L' : 'M'}${x(i)},${y(p.waarde)}`).join(' '));
	const fmt = (v) => v.toLocaleString('nl-NL', { maximumFractionDigits: decimalen });
	let actief = $state(null);
</script>

<figure class="verloop" style="--k: {kleur}">
	<svg viewBox="0 0 {B} {hoogte}" role="img" aria-label={onderschrift}>
		{#each [lo, (lo + hi) / 2, hi] as v}
			<line x1={marge.l} x2={B - marge.r} y1={y(v)} y2={y(v)} class="raster" />
			<text x={marge.l - 6} y={y(v) + 3} class="as">{fmt(v)}</text>
		{/each}
		<path d="{lijn} L{x(punten.length - 1)},{hoogte - marge.b} L{x(0)},{hoogte - marge.b} Z" class="vlak" />
		<path d={lijn} class="lijn" />
		{#each punten as p, i}
			<circle cx={x(i)} cy={y(p.waarde)} r={actief === i ? 5 : p.record ? 4.2 : 3.2} class="punt" class:record={p.record} role="presentation"
				onpointerenter={() => (actief = i)} onpointerleave={() => (actief = null)} />
		{/each}
	</svg>
	<figcaption class="klein gedempt">{actief != null ? (punten[actief].tekst ?? `${punten[actief].datum} · ${fmt(punten[actief].waarde)}`) : onderschrift}</figcaption>
</figure>

<style>
	.verloop { margin: 0; display: grid; gap: var(--r-2); }
	svg { width: 100%; height: auto; overflow: visible; }
	.raster { stroke: var(--lijn); stroke-width: 1; }
	.as { fill: var(--tekst-gedempt); font-size: 9px; text-anchor: end; font-family: var(--letter-tekst); }
	.lijn { fill: none; stroke: var(--k); stroke-width: 2.5; stroke-linejoin: round; stroke-linecap: round; }
	.vlak { fill: color-mix(in srgb, var(--k) 14%, transparent); }
	.punt { fill: var(--achtergrond); stroke: var(--k); stroke-width: 2; cursor: pointer; }
	.punt.record { fill: var(--k); }
</style>
