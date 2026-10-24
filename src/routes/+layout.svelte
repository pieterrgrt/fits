<script>
	import '@fontsource-variable/archivo/wdth.css';
	import '@fontsource-variable/inter/wght.css';
	import '#lib/design/fits.css';
	import { page } from '$app/state';
	import Icoon from '#lib/Icoon.svelte';
	import Woordmerk from '#lib/Woordmerk.svelte';

	let { children, data } = $props();

	const TABS = [
		{ href: '/', naam: 'Vandaag', icoon: 'vandaag' },
		{ href: '/schema', naam: 'Schema', icoon: 'schema' },
		{ href: '/eten', naam: 'Eten', icoon: 'eten' },
		{ href: '/logboek', naam: 'Logboek', icoon: 'logboek' },
		{ href: '/meer', naam: 'Meer', icoon: 'meer' }
	];
	const MEER = ['/meer', '/zondag', '/doelen', '/cardio', '/account', '/beheer', '/uitleg', '/voeding', '/oefeningen', '/gezondheid'];
	const actief = (href) => {
		const p = page.url.pathname;
		if (href === '/') return p === '/' || p.startsWith('/training');
		if (href === '/meer') return MEER.some((m) => p.startsWith(m));
		return p.startsWith(href);
	};
	const kaal = $derived(!data.gebruiker || page.url.pathname.startsWith('/training/'));
</script>

<svelte:head>
	<title>{page.data.titel ? `${page.data.titel} · Fits` : 'Fits'}</title>
</svelte:head>

{#if data.gebruiker && !page.url.pathname.startsWith('/training/')}
	<header class="bovenbalk">
		<a href="/" aria-label="Fits, naar vandaag"><Woordmerk grootte={28} /></a>
		<a class="knop stil klein" href="/account"><Icoon naam="account" grootte={18} />{data.gebruiker.naam.split(' ')[0]}</a>
	</header>
{/if}

{@render children()}

{#if !kaal}
	<nav class="tabbalk" aria-label="Hoofdmenu">
		{#each TABS as tab}
			<a href={tab.href} aria-current={actief(tab.href) ? 'page' : undefined}>
				<Icoon naam={tab.icoon} />
				{tab.naam}
			</a>
		{/each}
	</nav>
{/if}

<style>
	.bovenbalk {
		max-width: var(--breedte-app);
		margin-inline: auto;
		padding: var(--r-4) var(--r-4) 0;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	.bovenbalk a:first-child { text-decoration: none; }
</style>
