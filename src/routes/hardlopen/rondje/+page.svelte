<script>
	import { enhance } from '$app/forms';
	import { onMount } from 'svelte';
	import Kaart from '#lib/hardlopen/Kaart.svelte';
	import Icoon from '#lib/Icoon.svelte';
	import { decodeer, schrijfGpx } from '#lib/spoor.js';

	let { data, form } = $props();

	let start = $state(null);
	let km = $state(8);
	let bezig = $state(false);
	let keuze = $state(0);
	let getoond = $state(null); // een bewaard rondje dat je bekijkt
	let locatieFout = $state('');
	let zoekForm = $state();
	let rondes = 0;

	onMount(() => {
		try {
			const s = JSON.parse(localStorage.getItem('fits-rondje') ?? 'null');
			if (s?.start) start = s.start;
			if (s?.km) km = s.km;
		} catch {}
		start ??= data.start;
	});
	$effect(() => {
		if (start) localStorage.setItem('fits-rondje', JSON.stringify({ start, km }));
	});

	// Het laatste resultaat vasthouden, ook nadat je een rondje bewaart (dan verandert `form`).
	let resultaat = $state(null);
	$effect(() => {
		if (form?.rondjes) resultaat = { rondjes: form.rondjes, lat: form.lat, lon: form.lon };
	});
	const rondjes = $derived(resultaat?.rondjes ?? []);
	const gekozen = $derived(rondjes[keuze] ?? null);

	// Het wegennet wordt nog opgehaald: vanzelf opnieuw vragen tot het er is.
	// Lukt het ophalen drie keer achter elkaar niet, dan stoppen (de Overpass-servers zijn dan even vol).
	let mislukt = 0;
	$effect(() => {
		if (!form?.laden || bezig) return;
		mislukt = form.laden.fout ? mislukt + 1 : 0;
		if (rondes < 60 && mislukt < 3) {
			rondes++;
			zoekForm?.requestSubmit();
		}
	});

	const lijnen = $derived.by(() => {
		if (getoond) return [{ lijn: getoond.lijn, kleur: 'accent', dik: 5, dekking: 0.95 }];
		if (!gekozen) return [];
		return gekozen.stukken.map((s) => (s.nieuw ? { lijn: s.lijn, kleur: 'accent', dik: 5, dekking: 0.95 } : { lijn: s.lijn, kleur: 'koraal', dik: 4, dekking: 0.75 }));
	});

	const kmTekst = (m) => (m / 1000).toLocaleString('nl-NL', { maximumFractionDigits: 1 }) + ' km';
	const procent = (r) => Math.round((r.nieuw / r.lengte) * 100);

	function hier() {
		locatieFout = '';
		if (!navigator.geolocation) return (locatieFout = 'Je browser geeft geen locatie.');
		navigator.geolocation.getCurrentPosition(
			(p) => (start = [+p.coords.latitude.toFixed(6), +p.coords.longitude.toFixed(6)]),
			() => (locatieFout = 'Locatie niet beschikbaar. Tik op de kaart om je startpunt te kiezen.'),
			{ enableHighAccuracy: true, timeout: 10_000 }
		);
	}

	function downloadGpx(naam, lijn) {
		const url = URL.createObjectURL(new Blob([schrijfGpx(naam, decodeer(lijn))], { type: 'application/gpx+xml' }));
		const a = Object.assign(document.createElement('a'), { href: url, download: `${naam.replace(/[^\p{L}\p{N} _-]/gu, '').trim().replace(/\s+/g, '-') || 'rondje'}.gpx` });
		a.click();
		setTimeout(() => URL.revokeObjectURL(url), 1000);
	}

	const zoeken = ({ cancel }) => {
		if (!start) {
			cancel();
			locatieFout = 'Tik eerst op de kaart om je startpunt te kiezen.';
			return;
		}
		bezig = true;
		getoond = null;
		return async ({ update, result }) => {
			if (result.type === 'success' && !result.data?.laden) rondes = 0;
			keuze = 0;
			await update({ reset: false });
			bezig = false;
		};
	};
	const naamVoorstel = $derived(gekozen ? `Rondje ${kmTekst(gekozen.lengte)}` : '');
</script>

<main class="app stapel ruim">
	<header class="paginakop">
		<a class="klein rustig terug" href="/hardlopen"><Icoon naam="terug" grootte={16} /> Hardlopen</a>
		<h1>Ontdekrondje</h1>
		<p class="rustig">Een rondje vanaf je startpunt over zoveel mogelijk straten en paden waar je nog niet liep.</p>
	</header>

	<Kaart {lijnen} {start} onklik={(lat, lon) => { start = [+lat.toFixed(6), +lon.toFixed(6)]; getoond = null; }} hoogte="55vh" />
	<div class="rij uiteen">
		<span class="klein gedempt">{start ? 'Tik op de kaart om je startpunt te verplaatsen.' : 'Tik op de kaart om je startpunt te kiezen.'}</span>
		<button class="knop klein omlijnd" type="button" onclick={hier}>Mijn locatie</button>
	</div>
	{#if locatieFout}<p class="melding fout">{locatieFout}</p>{/if}

	<form method="POST" action="?/zoek" class="kaart stapel" use:enhance={zoeken} bind:this={zoekForm}>
		<input type="hidden" name="lat" value={start?.[0] ?? ''} />
		<input type="hidden" name="lon" value={start?.[1] ?? ''} />
		<label class="veld">
			<span>Afstand: <strong class="tnum">{km.toLocaleString('nl-NL')} km</strong></span>
			<input type="range" name="km" min="2" max="21" step="0.5" bind:value={km} />
		</label>
		<button class="knop primair" disabled={bezig}>
			{#if bezig && form?.laden}Wegennet laden… {form.laden.klaar}/{form.laden.totaal}{:else if bezig}Zoeken…{:else}Zoek rondjes{/if}
		</button>
		{#if form?.laden}
			<span class="klein rustig">Fits haalt het wegennet van dit gebied op ({form.laden.klaar} van {form.laden.totaal} vakken). Dat hoeft maar één keer.</span>
			{#if form.laden.fout && !bezig}<span class="klein" style="color: var(--fout)">{form.laden.fout} Probeer het straks nog eens; wat al binnen is, blijft bewaard.</span>{/if}
		{/if}
		{#if !data.heeftSporen}<span class="klein gedempt">Nog geen loopjes geïmporteerd: dan is alles nieuw.</span>{/if}
	</form>

	{#if form?.fout}<p class="melding fout">{form.fout}</p>{/if}
	{#if form?.bewaard}<p class="melding">"{form.bewaard}" bewaard.</p>{/if}

	{#if rondjes.length && !getoond}
		<section class="stapel">
			<div class="keuzes" role="tablist">
				{#each rondjes as r, i}
					<button type="button" role="tab" class="kaart keuze" aria-selected={i === keuze} onclick={() => (keuze = i)}>
						<strong class="tnum">{kmTekst(r.lengte)}</strong>
						<span class="klein accent">{procent(r)}% nieuw</span>
					</button>
				{/each}
			</div>
			{#if gekozen}
				<div class="kaart stapel krap">
					<div class="rij"><span class="stip" style="color: var(--accent)"></span><span class="klein">nieuw: {kmTekst(gekozen.nieuw)}</span><span class="stip" style="color: var(--koraal)"></span><span class="klein">al gelopen: {kmTekst(gekozen.lengte - gekozen.nieuw)}</span></div>
					{#if gekozen.dubbel > 200}<span class="klein gedempt">{kmTekst(gekozen.dubbel)} loop je twee keer (heen en terug).</span>{/if}
					<div class="rij">
						<button class="knop omlijnd" type="button" onclick={() => downloadGpx(naamVoorstel, gekozen.lijn)}><Icoon naam="download" /> GPX</button>
					</div>
					<form method="POST" action="?/bewaar" class="rij" use:enhance={() => async ({ update }) => update({ reset: false, invalidateAll: true })}>
						<input type="hidden" name="lijn" value={gekozen.lijn} />
						<input type="hidden" name="nieuw" value={gekozen.nieuw} />
						<input type="hidden" name="lat" value={resultaat?.lat ?? ''} />
						<input type="hidden" name="lon" value={resultaat?.lon ?? ''} />
						<label class="veld" style="flex: 1"><span class="verborgen">Naam</span><input name="naam" value={naamVoorstel} maxlength="80" /></label>
						<button class="knop">Bewaren</button>
					</form>
				</div>
			{/if}
		</section>
	{/if}

	{#if getoond}
		<div class="kaart rij uiteen">
			<span><strong>{getoond.naam}</strong> <span class="klein gedempt">{kmTekst(getoond.afstand)}</span></span>
			<button class="knop klein omlijnd" type="button" onclick={() => (getoond = null)}>Sluiten</button>
		</div>
	{/if}

	{#if data.routes.length}
		<section class="stapel krap">
			<h2>Bewaarde rondjes</h2>
			{#each data.routes as r (r.id)}
				<div class="kaart route">
					<button type="button" class="stil stapel krap" style="gap: 2px; text-align: left" onclick={() => { getoond = r; if (r.lat != null) start = [r.lat, r.lon]; }}>
						<strong>{r.naam}</strong>
						<span class="klein gedempt">{kmTekst(r.afstand)}{r.nieuw ? ` · ${Math.round((r.nieuw / r.afstand) * 100)}% nieuw toen` : ''}</span>
					</button>
					<a class="knop klein omlijnd" href="/hardlopen/routes/{r.id}" download><Icoon naam="download" grootte={16} /> GPX</a>
					<form method="POST" action="?/weg" use:enhance><input type="hidden" name="id" value={r.id} /><button class="knop klein stil" aria-label="Verwijderen"><Icoon naam="kruis" grootte={16} /></button></form>
				</div>
			{/each}
		</section>
	{/if}

	<p class="klein gedempt">Routes over het wegennet van OpenStreetMap. Kijk onderweg zelf of een pad open en veilig is.</p>
</main>

<style>
	.terug { display: inline-flex; gap: var(--r-1); align-items: center; text-decoration: none; }
	.keuzes { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--r-2); }
	.keuze { display: flex; flex-direction: column; gap: 2px; padding: var(--r-3); text-align: left; cursor: pointer; border: var(--rand) solid transparent; font: inherit; color: inherit; }
	.keuze[aria-selected='true'] { border-color: var(--accent); }
	.route { display: grid; grid-template-columns: 1fr auto auto; gap: var(--r-2); align-items: center; padding: var(--r-3); }
	.stil { background: none; border: 0; padding: 0; color: inherit; font: inherit; cursor: pointer; }
	input[type='range'] { accent-color: var(--volt-diep); width: 100%; }
</style>
