<script>
	import { enhance } from '$app/forms';
	import Icoon from '#lib/Icoon.svelte';
	import { mooi } from '#lib/datum.js';
	import { getal } from '#lib/gewicht.js';

	let { data, form } = $props();
	let gekopieerd = $state('');
	const kopieer = async (tekst, wat) => {
		await navigator.clipboard.writeText(tekst);
		gekopieerd = wat;
		setTimeout(() => (gekopieerd = ''), 1500);
	};
	const fasen = $derived(data.laatste?.slaap_fasen ? JSON.parse(data.laatste.slaap_fasen) : null);
	const FASE = { diep: 'Diep', kern: 'Kern', rem: 'REM', slaap: 'Slaap', wakker: 'Wakker' };
</script>

<main class="app stapel ruim">
	<header class="paginakop">
		<span class="label" style="color: var(--lila)">Slaap uit je iPhone en Apple Watch</span>
		<h1>Apple Gezondheid</h1>
		<p class="rustig">Apple Gezondheid heeft geen koppeling voor websites. Daarom stuurt een opdracht in de app <strong>Opdrachten</strong> (Shortcuts) elke ochtend je slaap van afgelopen nacht naar Fits. Eén keer instellen, daarna gaat het vanzelf.</p>
	</header>

	<section class="kaart stapel">
		<h2>Status</h2>
		{#if data.laatste}
			<p style="margin:0"><Icoon naam="vink" grootte={16} /> Laatst ontvangen: <strong>{getal(data.laatste.slaap)} uur</strong> op {mooi(data.laatste.datum, { dag: true })}.</p>
			{#if fasen}
				<div class="rij">{#each Object.entries(fasen) as [f, m]}<span class="chip lila">{FASE[f] ?? f} {Math.floor(m / 60)}:{String(m % 60).padStart(2, '0')}</span>{/each}</div>
			{/if}
		{:else}
			<p class="rustig" style="margin:0">Nog niets ontvangen. Volg de stappen hieronder.</p>
		{/if}
	</section>

	<section class="kaart stapel">
		<div class="rij"><span class="stap">1</span><h2>Sleutel maken</h2></div>
		<p class="rustig" style="margin:0">De opdracht gebruikt een eigen sleutel in plaats van je wachtwoord. Hij kan alleen slaap en gewicht doorgeven, verder niets.</p>
		{#if form?.sleutel}
			<div class="kaart hoog stapel krap">
				<span class="label">Je sleutel · je ziet hem maar één keer</span>
				<code class="sleutel">{form.sleutel}</code>
				<button class="knop primair" onclick={() => kopieer(form.sleutel, 'sleutel')}>{gekopieerd === 'sleutel' ? 'Gekopieerd' : 'Kopieer sleutel'}</button>
			</div>
		{:else}
			<form method="POST" action="?/maak" class="rij" use:enhance>
				<input class="invoer" name="naam" placeholder="Naam, bv. iPhone" style="flex: 1" />
				<button class="knop primair">Maak sleutel</button>
			</form>
		{/if}
		{#if data.sleutels.length}
			<ul class="lijst">
				{#each data.sleutels as s}
					<li class="rij uiteen">
						<span class="stapel krap" style="gap: 0"><strong>{s.naam}</strong><span class="klein gedempt">{s.begin}… · {s.laatst ? `laatst gebruikt ${s.laatst.slice(0, 16)}` : 'nog niet gebruikt'}</span></span>
						<form method="POST" action="?/intrekken" use:enhance><input type="hidden" name="id" value={s.id} /><button class="knop klein stil" style="color: var(--fout)">Intrekken</button></form>
					</li>
				{/each}
			</ul>
		{/if}
	</section>

	<section class="kaart stapel">
		<div class="rij"><span class="stap">2</span><h2>Opdracht maken</h2></div>
		<p class="rustig" style="margin:0">Op je iPhone, in de app <strong>Opdrachten</strong>: tik op <strong>+</strong> en voeg deze acties toe.</p>
		<ol class="stappen">
			<li>
				<strong>Zoek gezondheidsvoorbeelden</strong> (Find Health Samples)
				<span>Type: <em>Slaapanalyse</em>. Tik op <em>Voeg filter toe</em>: <em>Einddatum</em> · <em>valt in de afgelopen</em> · <em>18 uur</em>. Sorteer op <em>Startdatum</em>, oudste eerst.</span>
			</li>
			<li>
				<strong>Herhaal met elk</strong> (Repeat with Each), met de gezondheidsvoorbeelden uit stap 1.
			</li>
			<li>
				Binnen de herhaling: <strong>Tekst</strong>, met precies dit erin:
				<span><em>Herhaalonderdeel → Startdatum</em> <code>|</code> <em>Herhaalonderdeel → Einddatum</em> <code>|</code> <em>Herhaalonderdeel → Waarde</em></span>
				<span>Tik bij Startdatum en Einddatum op de variabele en kies <em>Datumnotatie: ISO 8601</em> (met tijd).</span>
			</li>
			<li>
				Na <em>Einde herhaling</em>: <strong>Combineer tekst</strong> (Combine Text): <em>Herhaalresultaten</em>, gescheiden door <em>Nieuwe regel</em>.
			</li>
			<li>
				<strong>Haal inhoud van URL op</strong> (Get Contents of URL)
				<span>URL: <code>{data.adres}</code> <button class="knop klein stil" onclick={() => kopieer(data.adres, 'adres')}>{gekopieerd === 'adres' ? 'Gekopieerd' : 'Kopieer'}</button></span>
				<span>Methode: <em>POST</em>. Headers: <code>Authorization</code> = <code>Bearer </code> + je sleutel uit stap 1 (met een spatie na Bearer).</span>
				<span>Verzoeklichaam: <em>JSON</em>, veld <code>slaap</code> (tekst) = <em>Gecombineerde tekst</em>.</span>
			</li>
			<li>
				Optioneel: <strong>Toon melding</strong> met <em>Inhoud van URL → bericht</em>, dan zie je "Fits: 7,4 uur slaap".
			</li>
		</ol>
		<p class="klein gedempt" style="margin:0">Eerste keer uitvoeren: de iPhone vraagt toestemming om slaapgegevens te lezen en verbinding te maken met fits.alduslab.eu. Sta beide toe.</p>
	</section>

	<section class="kaart stapel">
		<div class="rij"><span class="stap">3</span><h2>Elke ochtend vanzelf</h2></div>
		<ol class="stappen">
			<li>In Opdrachten: <strong>Automatisering</strong> → <strong>+</strong> → <strong>Tijdstip</strong>, bijvoorbeeld 10:00, dagelijks. Of: <strong>Wekker</strong> → <em>Wordt uitgezet</em>.</li>
			<li>Kies <em>Voer direct uit</em> (niet "Vraag voor uitvoering") en kies de opdracht uit stap 2.</li>
		</ol>
		<p class="klein gedempt" style="margin:0">Fits telt alleen echte slaap (kern, diep, REM), niet "in bed" en "wakker". Meten iPhone en Watch allebei, dan telt de overlap één keer. Stuur je de opdracht vaker, dan wordt de nacht gewoon overschreven.</p>
	</section>

	<details class="kaart">
		<summary><strong>Ook je gewicht meesturen</strong></summary>
		<p class="klein rustig">Voeg in dezelfde opdracht <strong>Zoek gezondheidsvoorbeelden</strong> toe met type <em>Gewicht</em>, gesorteerd op <em>Startdatum, nieuwste eerst</em>, limiet 1. Zet in het JSON-verzoeklichaam een extra veld <code>gewicht</code> (getal) met die waarde. Gebruik een weegschaal die met Gezondheid praat, dan staat je gewicht elke ochtend in Fits.</p>
	</details>
</main>

<style>
	.stap {
		width: 2rem; height: 2rem; border-radius: 50%; display: grid; place-items: center; flex: none;
		background: var(--lila); color: #0c0d10;
		font-family: var(--letter-display); font-stretch: var(--breed); font-weight: 800;
	}
	.stappen { margin: 0; padding-left: 1.25rem; display: grid; gap: var(--r-3); }
	.stappen li > span { display: block; color: var(--tekst-rustig); font-size: var(--maat-s); margin-top: 2px; }
	code { font-family: ui-monospace, Menlo, monospace; font-size: 0.85em; background: var(--vlak-hoog); padding: 1px 5px; border-radius: 4px; word-break: break-all; }
	.sleutel { font-size: 0.95rem; padding: var(--r-2); }
</style>
