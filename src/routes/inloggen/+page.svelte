<script>
	import { enhance } from '$app/forms';
	import { onMount } from 'svelte';
	// Op de inlogpagina: geen bewaarde pagina's van een vorige sessie laten staan.
	onMount(() => navigator.serviceWorker?.controller?.postMessage('uitgelogd'));
	import Beeldmerk from '#lib/Beeldmerk.svelte';
	let { form } = $props();
	let bezig = $state(false);
</script>

<main class="deur">
	<div class="merk">
		<Beeldmerk grootte={72} />
		<h1>Fits</h1>
		<p class="rustig">Gym, eten, slaap. Elke week een beetje sterker.</p>
	</div>

	<form method="POST" class="kaart stapel" use:enhance={() => { bezig = true; return async ({ update }) => { await update(); bezig = false; }; }}>
		{#if form?.fout}<p class="melding fout" role="alert">{form.fout}</p>{/if}
		<label class="veld"><span>E-mail</span><input name="email" type="email" autocomplete="username" required value={form?.email ?? ''} /></label>
		<label class="veld"><span>Wachtwoord</span><input name="wachtwoord" type="password" autocomplete="current-password" required /></label>
		<button class="knop primair groot vol-breed" disabled={bezig}>{bezig ? 'Even kijken…' : 'Inloggen'}</button>
	</form>
	<p class="klein gedempt midden">Nog geen account? Je hebt een <a href="/registreren">uitnodigingscode</a> nodig.</p>
	<p class="klein gedempt midden">Fits is een project van <a href="https://alduslab.eu">Aldus</a>.</p>
</main>

<style>
	.deur {
		max-width: 26rem;
		margin: 0 auto;
		padding: var(--r-8) var(--r-4) var(--r-6);
		display: flex;
		flex-direction: column;
		gap: var(--r-5);
		min-height: 100dvh;
		justify-content: center;
	}
	.merk { display: flex; flex-direction: column; align-items: center; gap: var(--r-3); text-align: center; }
	.merk h1 { font-size: var(--maat-3xl); font-stretch: var(--breed); transform: skewX(-8deg); text-transform: lowercase; letter-spacing: -0.05em; }
	.midden { text-align: center; margin: 0; }
</style>
