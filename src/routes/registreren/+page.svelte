<script>
	import { verzend } from '#lib/verzend.js';
	import Beeldmerk from '#lib/Beeldmerk.svelte';
	let { data, form } = $props();
</script>

<main class="deur">
	<div class="merk">
		<Beeldmerk grootte={64} />
		<h1>{data.eerste ? 'Welkom bij Fits' : 'Account maken'}</h1>
		<p class="rustig">
			{#if data.eerste}Je bent de eerste. Jouw account wordt beheerder; anderen kun je later uitnodigen.{:else}Met een uitnodigingscode van de beheerder.{/if}
		</p>
	</div>
	<form method="POST" class="kaart stapel" use:verzend>
		{#if form?.fout}<p class="melding fout" role="alert">{form.fout}</p>{/if}
		<label class="veld"><span>Naam</span><input name="naam" autocomplete="name" required value={form?.naam ?? ''} /></label>
		<label class="veld"><span>E-mail</span><input name="email" type="email" autocomplete="email" required value={form?.email ?? ''} /></label>
		<label class="veld"><span>Wachtwoord</span><input name="wachtwoord" type="password" autocomplete="new-password" minlength="10" required /><small>Minstens 10 tekens.</small></label>
		{#if !data.eerste}
			<label class="veld"><span>Uitnodigingscode</span><input name="code" autocomplete="off" required value={form?.code ?? data.code} style="text-transform: uppercase; letter-spacing: 0.1em" /></label>
		{/if}
		<button class="knop primair groot vol-breed">Account maken</button>
		<p class="klein gedempt" style="margin:0">Je krijgt meteen het schema Push/Pull/Legs met je startgewichten. Alles is daarna aan te passen.</p>
	</form>
	<p class="klein gedempt" style="text-align:center">Al een account? <a href="/inloggen">Inloggen</a></p>
</main>

<style>
	.deur { max-width: 26rem; margin: 0 auto; padding: var(--r-7) var(--r-4); display: flex; flex-direction: column; gap: var(--r-5); }
	.merk { display: flex; flex-direction: column; align-items: center; gap: var(--r-3); text-align: center; }
</style>
