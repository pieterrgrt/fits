<script>
	// Voortgangsring voor de pijlers. waarde 0–1; kleur is een token-naam (volt, amber, lila, koraal).
	let { waarde = 0, kleur = 'volt', grootte = 56, dik = 6, children } = $props();
	const r = $derived((grootte - dik) / 2);
	const omtrek = $derived(2 * Math.PI * r);
	const deel = $derived(Math.max(0, Math.min(1, waarde || 0)));
</script>

<div class="ring" style="--g: {grootte}px; --k: var(--{kleur === 'volt' ? 'grafiek' : kleur})">
	<svg width={grootte} height={grootte} viewBox="0 0 {grootte} {grootte}" aria-hidden="true">
		<circle cx={grootte / 2} cy={grootte / 2} {r} stroke-width={dik} class="baan" />
		{#if deel > 0}<circle
			cx={grootte / 2}
			cy={grootte / 2}
			{r}
			stroke-width={dik}
			class="vulling"
			stroke-dasharray="{omtrek * deel} {omtrek}"
			transform="rotate(-90 {grootte / 2} {grootte / 2})"
		/>{/if}
	</svg>
	<div class="midden">{@render children?.()}</div>
</div>

<style>
	.ring { position: relative; width: var(--g); height: var(--g); flex: none; }
	circle { fill: none; stroke-linecap: round; }
	.baan { stroke: color-mix(in srgb, var(--k) 16%, transparent); }
	.vulling { stroke: var(--k); transition: stroke-dasharray var(--traag) var(--veer); }
	.midden { position: absolute; inset: 0; display: grid; place-items: center; color: var(--k); }
</style>
