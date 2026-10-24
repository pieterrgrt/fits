<script>
	import Beeldmerk from './Beeldmerk.svelte';
	let { grootte = 32 } = $props();
</script>

<span class="woordmerk" style="--g: {grootte}px">
	<Beeldmerk grootte={grootte} />
	<span>fits</span>
</span>

<style>
	.woordmerk {
		display: inline-flex;
		align-items: center;
		gap: calc(var(--g) * 0.22);
		color: var(--tekst);
		text-decoration: none;
	}
	span span {
		font-family: var(--letter-display);
		font-stretch: 112%;
		font-weight: 900;
		font-size: calc(var(--g) * 0.95);
		line-height: 1;
		letter-spacing: -0.045em;
		transform: skewX(-8deg);
		padding-right: 0.08em;
	}
</style>
