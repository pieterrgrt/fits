<script>
	import { onMount } from 'svelte';
	import { houdingOp, teken } from './figuur.js';

	/** @type {{ anim: any, label?: string, klein?: boolean, speelt?: boolean }} */
	let { anim, label = '', klein = false, speelt = true } = $props();

	let t = $state(0);
	let element;
	let rustig = $state(false);

	const stand = $derived(houdingOp(anim, t));
	const vormen = $derived(teken(anim, stand.pose));
	// Bij "liever geen beweging": begin- en eindstand tegelijk, de begin-stand als schim.
	const schim = $derived(rustig ? teken(anim, anim.a) : null);
	const eind = $derived(rustig ? teken(anim, anim.b) : null);

	onMount(() => {
		const media = matchMedia('(prefers-reduced-motion: reduce)');
		rustig = media.matches;
		let zichtbaar = false;
		let vorige = 0;
		let frame = 0;
		const stap = (nu) => {
			if (vorige) t += Math.min(0.05, (nu - vorige) / 1000);
			vorige = nu;
			frame = requestAnimationFrame(stap);
		};
		const kijker = new IntersectionObserver(([e]) => {
			zichtbaar = e.isIntersecting;
			if (zichtbaar && speelt && !rustig) {
				vorige = 0;
				frame = requestAnimationFrame(stap);
			} else cancelAnimationFrame(frame);
		});
		kijker.observe(element);
		return () => {
			kijker.disconnect();
			cancelAnimationFrame(frame);
		};
	});
</script>

<figure class="figuur" class:klein bind:this={element}>
	<svg viewBox={(anim.kader ?? [0, 0, 240, 180]).join(' ')} role="img" aria-label={label || 'Uitleg van de beweging'}>
		{#snippet tekening(lijst, extra = '')}
			<g class={extra}>
				{#each lijst as v, i (i)}
					{#if v.soort === 'lijn'}
						<line x1={v.x1} y1={v.y1} x2={v.x2} y2={v.y2} stroke-width={v.dik} class={v.rol} />
					{:else if v.soort === 'cirkel'}
						<circle cx={v.cx} cy={v.cy} r={v.r} class={v.rol} />
					{:else}
						<rect x={v.x} y={v.y} width={v.b} height={v.h} rx={v.r} class={v.rol} />
					{/if}
				{/each}
			</g>
		{/snippet}
		{#if rustig}
			{@render tekening(schim, 'schim')}
			{@render tekening(eind)}
		{:else}
			{@render tekening(vormen)}
		{/if}
	</svg>
	{#if !klein && anim.fasen}
		<figcaption>
			<span class:aan={stand.fase === 'heen' || stand.fase === 'vast'}>{anim.fasen[0]}</span>
			<span class="balkje"><span style="--f: {stand.f}"></span></span>
			<span class:aan={stand.fase === 'terug' || stand.fase === 'rust'}>{anim.fasen[1]}</span>
		</figcaption>
	{/if}
</figure>

<style>
	.figuur {
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: var(--r-2);
	}
	svg {
		width: 100%;
		height: auto;
		aspect-ratio: 4 / 3;
		stroke-linecap: round;
		overflow: visible;
	}
	line { fill: none; }
	.lichaam { stroke: var(--tekst); fill: var(--tekst); }
	.lichaam-achter { stroke: color-mix(in srgb, var(--tekst) 38%, var(--achtergrond)); fill: color-mix(in srgb, var(--tekst) 38%, var(--achtergrond)); }
	.accent { stroke: var(--grafiek); fill: var(--grafiek); }
	.accent-achter { stroke: color-mix(in srgb, var(--grafiek) 45%, var(--achtergrond)); fill: color-mix(in srgb, var(--grafiek) 45%, var(--achtergrond)); }
	.apparaat { stroke: var(--lijn-sterk); fill: var(--lijn-sterk); }
	.apparaat-licht { stroke: var(--lijn-sterk); fill: var(--vlak-hoog); stroke-width: 2; }
	.gewicht { stroke: var(--tekst-gedempt); fill: var(--tekst-gedempt); }
	.gat { fill: var(--vlak); stroke: none; }
	.kabel { stroke: var(--tekst-gedempt); stroke-dasharray: 0; }
	.vloer { stroke: var(--lijn); }
	circle.lichaam, circle.accent { stroke: none; }
	.schim { opacity: 0.22; }

	figcaption {
		display: grid;
		grid-template-columns: auto 1fr auto;
		align-items: center;
		gap: var(--r-2);
		font-size: var(--maat-xs);
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--tekst-gedempt);
	}
	figcaption .aan { color: var(--accent-tekst); }
	.balkje { height: 3px; border-radius: 3px; background: var(--vlak-hoog); overflow: hidden; }
	.balkje span { display: block; height: 100%; width: calc(var(--f) * 100%); background: var(--grafiek); }
	.klein svg { aspect-ratio: 4 / 3; }
</style>
