<script>
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import Icoon from '#lib/Icoon.svelte';

	let { data, form } = $props();
	const bewaar = () => async ({ update }) => update({ reset: false });
	const apparaat = (ua) => {
		if (!ua) return 'Onbekend apparaat';
		const os = /iPhone|iPad/.test(ua) ? 'iPhone/iPad' : /Android/.test(ua) ? 'Android' : /Mac OS/.test(ua) ? 'Mac' : /Windows/.test(ua) ? 'Windows' : /Linux/.test(ua) ? 'Linux' : 'Apparaat';
		const browser = /Edg\//.test(ua) ? 'Edge' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : '';
		return `${os}${browser ? ' · ' + browser : ''}`;
	};
	const MELDING = { geweigerd: 'Je hebt Strava geen toestemming gegeven.', fout: 'Koppelen met Strava lukte niet. Probeer het opnieuw.' };
</script>

<main class="app stapel ruim">
	<header class="paginakop">
		<span class="label">{data.profiel.rol === 'beheerder' ? 'Beheerder' : 'Lid'}</span>
		<h1>Account</h1>
	</header>

	<form method="POST" action="?/profiel" class="kaart stapel" use:enhance={bewaar}>
		<h3>Profiel</h3>
		<label class="veld"><span>Naam</span><input name="naam" value={data.profiel.naam} autocomplete="name" /></label>
		<label class="veld"><span>E-mail</span><input name="email" type="email" value={data.profiel.email} autocomplete="email" /></label>
		{#if form?.profielFout}<p class="melding fout">{form.profielFout}</p>{/if}
		<button class="knop omlijnd">{form?.profielOk ? 'Opgeslagen ✓' : 'Opslaan'}</button>
	</form>

	<form method="POST" action="?/wachtwoord" class="kaart stapel" use:enhance>
		<h3>Wachtwoord</h3>
		<input type="text" name="gebruikersnaam" autocomplete="username" value={data.profiel.email} hidden />
		<label class="veld"><span>Huidig wachtwoord</span><input name="huidig" type="password" autocomplete="current-password" required /></label>
		<label class="veld"><span>Nieuw wachtwoord</span><input name="nieuw" type="password" autocomplete="new-password" minlength="10" required /><small>Minstens 10 tekens. Andere apparaten worden uitgelogd.</small></label>
		{#if form?.wwFout}<p class="melding fout">{form.wwFout}</p>{/if}
		{#if form?.wwOk}<p class="melding">Wachtwoord gewijzigd.</p>{/if}
		<button class="knop omlijnd">Wijzigen</button>
	</form>

	<section class="kaart stapel">
		<div class="rij uiteen"><h3>Ingelogd op</h3>
			{#if data.sessies.length > 1}<form method="POST" action="?/overal" use:enhance><button class="knop klein omlijnd">Overal anders uitloggen</button></form>{/if}
		</div>
		<ul class="lijst">
			{#each data.sessies as s}
				<li class="rij uiteen">
					<span class="stapel krap" style="gap: 0">
						<strong>{apparaat(s.apparaat)}{s.dit ? ' · dit apparaat' : ''}</strong>
						<span class="klein gedempt">laatst gebruikt {s.laatst.slice(0, 16).replace('T', ' ')}</span>
					</span>
					{#if !s.dit}<form method="POST" action="?/sessie" use:enhance><input type="hidden" name="id" value={s.id} /><button class="knop klein stil">Uitloggen</button></form>{/if}
				</li>
			{/each}
		</ul>
	</section>

	<section class="kaart stapel">
		<h3>Strava</h3>
		{#if page.url.searchParams.get('strava')}<p class="melding fout">{MELDING[page.url.searchParams.get('strava')]}</p>{/if}
		{#if !data.strava.aan}
			<p class="klein rustig" style="margin:0">Nog niet ingesteld op deze server (zie docs/strava.md).</p>
		{:else if data.strava.gekoppeld}
			<p class="rustig" style="margin:0">Gekoppeld{data.strava.naam ? ` als ${data.strava.naam}` : ''}. {data.strava.schrijven ? 'Fits mag trainingen plaatsen.' : 'Fits leest alleen.'}</p>
			<div class="rij">
				{#if !data.strava.schrijven}<a class="knop klein omlijnd" href="/strava/koppel?schrijven=1">Ook trainingen plaatsen</a>{/if}
				<form method="POST" action="?/ontkoppel" use:enhance><button class="knop klein gevaar">Ontkoppelen</button></form>
			</div>
		{:else}
			<a class="knop strava" href="/strava/koppel?schrijven=1">Verbinden met Strava</a>
		{/if}
	</section>

	<section class="kaart stapel">
		<h3>Je gegevens</h3>
		<a class="knop omlijnd" href="/account/export" download><Icoon naam="download" grootte={18} /> Alles downloaden (JSON)</a>
		<details>
			<summary class="klein gedempt">Schema terugzetten naar het begin</summary>
			<form method="POST" action="?/herstel" class="stapel krap" style="margin-top: var(--r-2)" use:enhance>
				<p class="klein rustig" style="margin:0">Je weekschema en gewichten gaan terug naar het startschema. Je logboek blijft staan.</p>
				<label class="vinkje"><input type="checkbox" name="zeker" value="ja" /> Ik weet het zeker</label>
				{#if form?.herstelFout}<p class="melding fout">{form.herstelFout}</p>{/if}
				{#if form?.herstelOk}<p class="melding">Schema teruggezet.</p>{/if}
				<button class="knop klein omlijnd">Terugzetten</button>
			</form>
		</details>
		<details>
			<summary class="klein" style="color: var(--fout)">Account verwijderen</summary>
			<form method="POST" action="?/verwijder" class="stapel krap" style="margin-top: var(--r-2)">
				<p class="klein rustig" style="margin:0">Alles gaat weg: schema, logboek, doelen en de Strava-koppeling. Dit kan niet terug.</p>
				<label class="veld"><span>Wachtwoord</span><input name="wachtwoord" type="password" autocomplete="current-password" /></label>
				{#if form?.weg}<p class="melding fout">{form.weg}</p>{/if}
				<button class="knop klein gevaar">Definitief verwijderen</button>
			</form>
		</details>
	</section>

	<form method="POST" action="/uitloggen"><button class="knop omlijnd vol-breed"><Icoon naam="uit" grootte={18} /> Uitloggen</button></form>
</main>

<style>
	.strava { --knop-vlak: var(--koraal); --knop-tekst: #160604; align-self: flex-start; }
</style>
