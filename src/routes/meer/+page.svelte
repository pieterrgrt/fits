<script>
	import Icoon from '#lib/Icoon.svelte';
	let { data } = $props();
	const LINKS = [
		{ href: '/zondag', icoon: 'zondag', naam: 'Zondag-check', uitleg: 'Gewichten bijstellen, wisselslot, weekregel' },
		{ href: '/doelen', icoon: 'doel', naam: 'Doelen', uitleg: 'Je doelen voor de komende maanden' },
		{ href: '/voeding', icoon: 'eten', naam: 'Eten en slaap', uitleg: 'Eiwit, calorieën en slaap' },
		{ href: '/cardio', icoon: 'cardio', naam: 'Cardio', uitleg: 'Hardlopen, zwemmen, zone 2' },
		{ href: '/uitleg', icoon: 'uitleg', naam: 'Hoe het werkt', uitleg: 'Dubbele progressie, rust, RIR' },
		{ href: '/account', icoon: 'account', naam: 'Account', uitleg: 'Wachtwoord, apparaten, Strava, export' },
		{ href: '/ontwerp', icoon: 'info', naam: 'Designsysteem', uitleg: 'Logo, kleuren, letters en onderdelen' }
	];
</script>

<main class="app stapel">
	<header class="paginakop"><h1>Meer</h1></header>
	<nav class="stapel krap">
		{#each LINKS as l}
			<a class="kaart link" href={l.href}>
				<span class="icoon"><Icoon naam={l.icoon} /></span>
				<span class="stapel krap" style="gap: 0"><strong>{l.naam}</strong><span class="klein gedempt">{l.uitleg}</span></span>
				<Icoon naam="pijl" grootte={18} />
			</a>
		{/each}
		{#if data.gebruiker.rol === 'beheerder'}
			<a class="kaart link" href="/beheer">
				<span class="icoon"><Icoon naam="slot" /></span>
				<span class="stapel krap" style="gap: 0"><strong>Beheer</strong><span class="klein gedempt">Gebruikers en uitnodigingen</span></span>
				<Icoon naam="pijl" grootte={18} />
			</a>
		{/if}
	</nav>
</main>

<style>
	.link { display: grid; grid-template-columns: 2.75rem 1fr auto; align-items: center; gap: var(--r-3); padding: var(--r-3) var(--r-4); text-decoration: none; }
	.icoon { width: 2.75rem; height: 2.75rem; border-radius: var(--hoek-m); background: var(--vlak-hoog); display: grid; place-items: center; color: var(--accent-tekst); }
</style>
