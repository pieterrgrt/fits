<script>
	import '@fontsource-variable/archivo/wdth.css';
	import '@fontsource-variable/inter/wght.css';
	import '#lib/design/fits.css';
	import { onMount } from 'svelte';
	import { page, navigating } from '$app/state';
	import { onNavigate } from '$app/navigation';
	import Icoon from '#lib/Icoon.svelte';
	import Woordmerk from '#lib/Woordmerk.svelte';
	import { tabVan, richting, magBewegen, vervaag } from '#lib/beweging.js';

	let { children, data } = $props();

	const TABS = [
		{ href: '/', naam: 'Vandaag', icoon: 'vandaag' },
		{ href: '/schema', naam: 'Schema', icoon: 'schema' },
		{ href: '/eten', naam: 'Eten', icoon: 'eten' },
		{ href: '/logboek', naam: 'Logboek', icoon: 'logboek' },
		{ href: '/meer', naam: 'Meer', icoon: 'meer' }
	];
	const tab = $derived(tabVan(page.url.pathname));
	const kaal = $derived(!data.gebruiker || page.url.pathname.startsWith('/training/'));

	// Pagina-overgang: de nieuwe pagina schuift in vanaf de kant waar je heen gaat (dieper of een tab
	// naar rechts: van rechts). Terugvegen in Safari of Chrome heeft al een eigen overgang; dan niet nog een.
	let vegen = false;
	onMount(() => {
		const opVeeg = (e) => (vegen = !!e.hasUAVisualTransition);
		addEventListener('popstate', opVeeg);
		return () => removeEventListener('popstate', opVeeg);
	});
	onNavigate((nav) => {
		if (!document.startViewTransition || !magBewegen() || !nav.from || !nav.to) return;
		if (nav.type === 'popstate' && vegen) return;
		const html = document.documentElement;
		html.dataset.richting = richting(nav.from.url, nav.to.url);
		return new Promise((klaar) => {
			const vt = document.startViewTransition(async () => {
				klaar();
				await nav.complete;
			});
			vt.finished.finally(() => delete html.dataset.richting);
		});
	});
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

{#if navigating.to}<div class="laadbalk" aria-hidden="true" out:vervaag={{ duration: 160 }}></div>{/if}

{@render children()}

{#if !kaal}
	<nav class="tabbalk" aria-label="Hoofdmenu">
		{#if tab >= 0}<span class="tabstip" style="--tab: {tab}" aria-hidden="true"><i></i>&nbsp;</span>{/if}
		{#each TABS as t, i}
			<a href={t.href} aria-current={tab === i ? 'page' : undefined}>
				<span class="tabicoon"><Icoon naam={t.icoon} /></span>
				{t.naam}
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
		view-transition-name: bovenbalk;
	}
	.bovenbalk a:first-child { text-decoration: none; }
</style>
