<script>
	// Voor- en achteraanzicht met de spieren die een oefening traint.
	// Primair = volt, secundair = gedempt volt, de rest = rustig grijs.
	let { primair = [], secundair = [], compact = false } = $props();

	const sym = (x) => [x, 100 - x];
	// [spier, vorm-functie(x) → element-attributen], per aanzicht
	const VOOR = [
		['trapezius', [{ d: 'M42 30 L50 27 L58 30 L62 36 L50 34 L38 36 Z' }]],
		['schouder-voor', sym(31).map((x) => ({ e: [x, 45, 7, 7.5] }))],
		['schouder-zij', sym(26.5).map((x) => ({ e: [x, 47, 3.6, 7] }))],
		['borst', [{ d: 'M49 42 L49 62 C44 65 37 64 34 58 L34 48 C38 43 44 42 49 42 Z' }, { d: 'M51 42 L51 62 C56 65 63 64 66 58 L66 48 C62 43 56 42 51 42 Z' }]],
		['biceps', sym(26).map((x) => ({ e: [x, 68, 4.6, 10] }))],
		['onderarm', sym(22).map((x) => ({ e: [x, 95, 4.2, 12] }))],
		['buik', [{ d: 'M42 66 L58 66 L57 104 C54 108 46 108 43 104 Z' }]],
		['abductoren', sym(34.5).map((x) => ({ e: [x, 116, 4, 8] }))],
		['adductoren', sym(46).map((x) => ({ e: [x, 131, 3.4, 11] }))],
		['quadriceps', sym(40).map((x) => ({ e: [x, 140, 7.2, 21] }))],
		['kuiten', sym(40.5).map((x) => ({ e: [x, 182, 4.4, 12] }))]
	];
	const ACHTER = [
		['trapezius', [{ d: 'M50 26 L62 34 L56 54 L50 62 L44 54 L38 34 Z' }]],
		['schouder-achter', sym(31).map((x) => ({ e: [x, 46, 6.5, 7] }))],
		['schouder-zij', sym(26.5).map((x) => ({ e: [x, 47, 3.6, 7] }))],
		['midden-rug', [{ d: 'M43 50 L57 50 L56 66 L44 66 Z' }]],
		['lats', [{ d: 'M43 56 L43 84 C40 90 36 88 34 82 L33 56 C36 52 40 52 43 56 Z' }, { d: 'M57 56 L57 84 C60 90 64 88 66 82 L67 56 C64 52 60 52 57 56 Z' }]],
		['onderrug', [{ d: 'M44 82 L56 82 L57 104 L43 104 Z' }]],
		['triceps', sym(26).map((x) => ({ e: [x, 68, 4.6, 10] }))],
		['onderarm', sym(22).map((x) => ({ e: [x, 95, 4.2, 12] }))],
		['bil', sym(41.5).map((x) => ({ e: [x, 118, 8.2, 9.5] }))],
		['hamstrings', sym(41).map((x) => ({ e: [x, 148, 6.4, 18] }))],
		['kuiten', sym(40.5).map((x) => ({ e: [x, 180, 5.4, 13] }))]
	];
	const stand = (naam) => (primair.includes(naam) ? 'primair' : secundair.includes(naam) ? 'secundair' : 'rust');
</script>

{#snippet lijf(regio, titel)}
	<figure>
		<svg viewBox="0 0 100 205" aria-hidden="true">
			<!-- silhouet -->
			<g class="lijf">
				<circle cx="50" cy="14" r="9" />
				<rect x="45" y="21" width="10" height="9" rx="3" />
				<path d="M33 32 C40 28 60 28 67 32 L70 62 L64 108 L36 108 L30 62 Z" />
				{#each [20, 80] as x}<rect x={x - 6} y="38" width="12" height="70" rx="6" />{/each}
				<path d="M34 106 L66 106 L64 196 L53 196 L51 128 L49 128 L47 196 L36 196 Z" />
			</g>
			{#each regio as [naam, vormen]}
				{#each vormen as v}
					{#if v.d}<path d={v.d} class={stand(naam)} />{:else}<ellipse cx={v.e[0]} cy={v.e[1]} rx={v.e[2]} ry={v.e[3]} class={stand(naam)} />{/if}
				{/each}
			{/each}
		</svg>
		{#if !compact}<figcaption class="label">{titel}</figcaption>{/if}
	</figure>
{/snippet}

<div class="spierkaart" class:compact>
	{@render lijf(VOOR, 'Voor')}
	{@render lijf(ACHTER, 'Achter')}
</div>

<style>
	.spierkaart { display: grid; grid-template-columns: 1fr 1fr; gap: var(--r-3); }
	figure { margin: 0; display: flex; flex-direction: column; align-items: center; gap: var(--r-1); }
	svg { width: 100%; max-width: 9rem; height: auto; }
	.compact svg { max-width: 4.5rem; }
	.lijf > * { fill: var(--vlak-hoog); }
	.rust { fill: var(--lijn-sterk); opacity: 0.55; }
	.secundair { fill: color-mix(in srgb, var(--grafiek) 45%, var(--vlak-hoog)); }
	.primair { fill: var(--grafiek); }
</style>
