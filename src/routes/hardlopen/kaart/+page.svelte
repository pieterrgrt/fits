<script>
	import Kaart from '#lib/hardlopen/Kaart.svelte';
	import Icoon from '#lib/Icoon.svelte';
	let { data } = $props();
	// Veel dunne, half doorzichtige lijnen over elkaar: waar je vaak loopt wordt het feller.
	const lijnen = $derived(data.lijnen.map((lijn) => ({ lijn, kleur: 'koraal', dik: 2.5, dekking: data.lijnen.length > 30 ? 0.35 : 0.7 })));
</script>

<main class="app stapel">
	<header class="paginakop">
		<a class="klein rustig terug" href="/hardlopen"><Icoon naam="terug" grootte={16} /> Hardlopen</a>
		<h1>Kaart van je loopjes</h1>
		<p class="rustig">{data.lijnen.length} loopjes. Waar de lijnen feller zijn, liep je vaker.</p>
	</header>
	{#if data.lijnen.length}
		<Kaart {lijnen} hoogte="70vh" />
	{:else}
		<p class="leeg">Nog geen loopjes. <a href="/hardlopen">Importeer er een paar.</a></p>
	{/if}
</main>

<style>
	.terug { display: inline-flex; gap: var(--r-1); align-items: center; text-decoration: none; }
</style>
