<script>
	import Beeldmerk from '#lib/Beeldmerk.svelte';
	import Woordmerk from '#lib/Woordmerk.svelte';
	import Icoon from '#lib/Icoon.svelte';
	import Ring from '#lib/Ring.svelte';
	import Figuur from '#lib/figuur/Figuur.svelte';
	import Spierkaart from '#lib/Spierkaart.svelte';
	import { OEFENINGEN, oefening } from '#lib/oefeningen.js';

	let thema = $state('auto');
	$effect(() => {
		if (thema === 'auto') document.documentElement.removeAttribute('data-thema');
		else document.documentElement.dataset.thema = thema;
		return () => document.documentElement.removeAttribute('data-thema');
	});

	const BASIS = [
		['--achtergrond', 'Achtergrond', 'pagina'],
		['--vlak', 'Vlak', 'kaarten'],
		['--vlak-hoog', 'Vlak hoog', 'invoer, verhoogd'],
		['--lijn', 'Lijn', 'randen'],
		['--lijn-sterk', 'Lijn sterk', 'apparatuur in figuren'],
		['--tekst', 'Tekst', ''],
		['--tekst-rustig', 'Tekst rustig', ''],
		['--tekst-gedempt', 'Tekst gedempt', 'labels']
	];
	const PIJLERS = [
		['--volt', 'Volt', 'Gym, voortgang, primaire actie', '#d7ff3a'],
		['--amber', 'Amber', 'Eten', '#ffc24a'],
		['--lila', 'Lila', 'Slaap en herstel', '#a99bff'],
		['--koraal', 'Koraal', 'Cardio en Strava', '#ff6b4a']
	];
	const ICONEN = ['vandaag', 'schema', 'logboek', 'oefeningen', 'meer', 'zondag', 'doel', 'cardio', 'eten', 'slaap', 'timer', 'vlam', 'wissel', 'omhoog', 'vink', 'plus', 'bewerk', 'sync', 'account', 'slot', 'download', 'uit', 'uitleg', 'info'];
	let reps = $state(10);
</script>

<svelte:head><title>Designsysteem · Fits</title></svelte:head>

<main class="app breed stapel ruim">
	<header class="ds-kop">
		<Woordmerk grootte={44} />
		<div class="rij">
			<span class="klein gedempt">Thema</span>
			{#each [['auto', 'Systeem'], ['donker', 'Donker'], ['licht', 'Licht']] as [w, n]}
				<button class="chip" aria-pressed={thema === w} onclick={() => (thema = w)}>{n}</button>
			{/each}
		</div>
	</header>

	<section class="intro">
		<span class="label accent">Designsysteem · IJzer</span>
		<h1 class="mega">Donker als een sportschool om zes uur 's ochtends. Eén felle kleur voor alles wat vooruitgang is.</h1>
		<p class="rustig">Fits is een losse app onder alduslab.eu, met een eigen merk. Dit is het hele systeem: merk, kleur, letters, maten, iconen, onderdelen en de bewegende figuren. Alle waarden staan als tokens in <code>src/lib/design/tokens.css</code> en <code>design/tokens.json</code>.</p>
	</section>

	<!-- Merk -->
	<section class="stapel">
		<h2>01 · Merk</h2>
		<div class="raster">
			<div class="kaart merkvlak donker"><Beeldmerk grootte={120} /><span class="label">Beeldmerk</span></div>
			<div class="kaart merkvlak volt"><Beeldmerk grootte={120} mono /><span class="label">Mono, op volt</span></div>
			<div class="kaart merkvlak licht"><Woordmerk grootte={56} /><span class="label">Woordmerk</span></div>
		</div>
		<div class="raster">
			<div class="kaart stapel krap">
				<h3>Het idee</h3>
				<p class="rustig" style="margin:0">Een kleine <em>f</em> waarvan de dwarsbalk een geladen halterstang is: twee schijven per kant. Schuin (8°) voor beweging. Het woordmerk is Archivo Black, breed, met dezelfde helling.</p>
			</div>
			<div class="kaart stapel krap">
				<h3>Zo gebruik je het</h3>
				<ul class="klein rustig punten">
					<li>Vrije ruimte rondom: minstens een kwart van de breedte van het beeldmerk.</li>
					<li>Kleinste maat: 16 px (favicon). Daaronder vallen de kleine schijven weg.</li>
					<li>Niet draaien, niet uitrekken, niet in een andere kleur dan volt, inkt of wit.</li>
					<li>Bestanden: <code>static/merk/</code> (SVG, PNG 192/512, maskable voor Android).</li>
				</ul>
			</div>
		</div>
		<div class="rij">
			{#each [16, 24, 32, 48, 64] as g}<div class="stapel krap" style="align-items: center"><Beeldmerk grootte={g} /><span class="klein gedempt">{g}</span></div>{/each}
		</div>
	</section>

	<!-- Kleur -->
	<section class="stapel">
		<h2>02 · Kleur</h2>
		<p class="rustig">Vier pijlers, elk een eigen kleur. Zo zie je in één oogopslag waar iets over gaat. Componenten gebruiken alleen rollen (<code>--vlak</code>, <code>--accent</code>), nooit losse hexwaarden.</p>
		<div class="raster vier">
			{#each PIJLERS as [token, naam, rol, hex]}
				<div class="staal groot" style="--k: var({token})">
					<span class="vlakje"></span>
					<strong>{naam}</strong>
					<span class="klein gedempt">{rol}</span>
					<code class="klein">{token} · {hex}</code>
				</div>
			{/each}
		</div>
		<div class="raster vier">
			{#each BASIS as [token, naam, rol]}
				<div class="staal" style="--k: var({token})">
					<span class="vlakje"></span>
					<span class="klein"><strong>{naam}</strong>{rol ? ` · ${rol}` : ''}</span>
					<code class="klein gedempt">{token}</code>
				</div>
			{/each}
		</div>
		<p class="klein gedempt">Donker is de standaard. In licht worden volt-teksten olijfgroen (<code>--volt-tekst</code>) zodat ze leesbaar blijven; volle volt-vlakken houden donkere tekst.</p>
	</section>

	<!-- Letter -->
	<section class="stapel">
		<h2>03 · Letter</h2>
		<div class="raster">
			<div class="kaart stapel">
				<span class="label">Display · Archivo, smal 72%, 800</span>
				<span class="display" style="font-size: 3.5rem">Push A · Borst</span>
				<span class="groot-cijfer accent">52,5<small style="font-size: 0.4em"> kg</small></span>
				<span class="label">Cijfers · Archivo, breed 118%, tabular</span>
			</div>
			<div class="kaart stapel">
				<span class="label">Tekst · Inter, 400–700</span>
				<p style="font-size: 1.125rem; margin: 0">Laat de stang gecontroleerd zakken naar je onderste borst, ellebogen ca. 45° van je lichaam.</p>
				<p class="rustig" style="margin:0">Rustige tekst voor uitleg, gedempte tekst voor labels en meta.</p>
				<span class="label">Label · 12 px, hoofdletters, 0,08 em</span>
			</div>
		</div>
		<div class="kaart schaal">
			{#each [['4xl', '5.5rem', 'Timer'], ['3xl', '3.75rem', 'Groot cijfer'], ['2xl', '2.5rem', 'Paginakop'], ['xl', '1.75rem', 'Kop'], ['l', '1.25rem', 'Tussenkop'], ['m', '1rem', 'Tekst'], ['s', '0.875rem', 'Hulp'], ['xs', '0.75rem', 'Label']] as [n, m, w]}
				<div class="rij uiteen"><span style="font-size: {m}; font-family: var(--letter-display); font-stretch: var(--smal); font-weight: 800; line-height: 1">{w}</span><code class="klein gedempt">--maat-{n} · {m}</code></div>
			{/each}
		</div>
	</section>

	<!-- Ruimte -->
	<section class="stapel">
		<h2>04 · Ruimte en vorm</h2>
		<div class="raster">
			<div class="kaart stapel krap">
				{#each [1, 2, 3, 4, 5, 6, 7, 8] as r}
					<div class="rij"><span class="ruimte" style="width: var(--r-{r})"></span><code class="klein gedempt">--r-{r}</code></div>
				{/each}
			</div>
			<div class="kaart rij" style="align-items: flex-end">
				{#each [['s', '6px'], ['m', '12px'], ['l', '20px'], ['rond', '999px']] as [n, w]}
					<div class="stapel krap" style="align-items: center"><span class="hoek" style="border-radius: var(--hoek-{n})"></span><code class="klein gedempt">--hoek-{n}</code></div>
				{/each}
			</div>
		</div>
		<p class="klein gedempt">Stappen van 4 px. Aanraakvlakken minstens 44 px (knoppen 2,75 rem). Beweging: 120 / 200 / 360 ms met een veer-curve; uit bij "liever geen beweging".</p>
	</section>

	<!-- Iconen -->
	<section class="stapel">
		<h2>05 · Iconen</h2>
		<div class="iconen kaart">
			{#each ICONEN as i}<div class="stapel krap" style="align-items: center"><Icoon naam={i} /><code class="klein gedempt">{i}</code></div>{/each}
		</div>
		<p class="klein gedempt">Eigen set: 24 × 24, lijn 2, ronde uiteinden en hoeken. <code>&lt;Icoon naam="…" /&gt;</code></p>
	</section>

	<!-- Onderdelen -->
	<section class="stapel">
		<h2>06 · Onderdelen</h2>
		<div class="raster">
			<div class="kaart stapel">
				<span class="label">Knoppen</span>
				<div class="rij"><button class="knop primair">Primair</button><button class="knop">Standaard</button><button class="knop omlijnd">Omlijnd</button><button class="knop stil">Stil</button></div>
				<div class="rij"><button class="knop gevaar">Gevaar</button><button class="knop klein omlijnd">Klein</button><button class="knop vierkant primair" aria-label="Opslaan"><Icoon naam="vink" /></button></div>
				<button class="knop primair groot vol-breed">Start Push A <Icoon naam="pijl" /></button>
			</div>
			<div class="kaart stapel">
				<span class="label">Chips</span>
				<div class="rij">
					<span class="chip">Neutraal</span><span class="chip volt"><Icoon naam="omhoog" grootte={14} /> zwaarder</span><span class="chip amber">vervangen?</span><span class="chip lila">8,2 u</span><span class="chip koraal">Strava</span><span class="chip omlijnd">zoek</span>
				</div>
				<span class="label">Velden</span>
				<label class="veld"><span>Gewicht (kg)</span><input value="52,5" /></label>
				<span class="label">Reps-stepper</span>
				<div class="stepper" style="max-width: 12rem"><button onclick={() => reps--}>−</button><input type="number" bind:value={reps} aria-label="Reps" /><button onclick={() => reps++}>+</button></div>
			</div>
			<div class="kaart stapel">
				<span class="label">Pijlers en voortgang</span>
				<div class="rij">
					<Ring waarde={0.66} kleur="volt"><Icoon naam="oefeningen" grootte={20} /></Ring>
					<Ring waarde={0.8} kleur="amber"><Icoon naam="eten" grootte={20} /></Ring>
					<Ring waarde={0.9} kleur="lila"><Icoon naam="slaap" grootte={20} /></Ring>
					<Ring waarde={0.33} kleur="koraal"><Icoon naam="cardio" grootte={20} /></Ring>
				</div>
				<div class="balk"><span style="--waarde: 72%"></span></div>
				<div class="raster drie">
					<div class="stat"><span class="label">Sets</span><span class="waarde">18</span></div>
					<div class="stat"><span class="label">Volume</span><span class="waarde">8,4<small>ton</small></span></div>
					<div class="stat"><span class="label">Tijd</span><span class="waarde">58<small>min</small></span></div>
				</div>
			</div>
			<div class="kaart stapel">
				<span class="label">Meldingen</span>
				<p class="melding"><span><strong>Klaar voor zwaarder.</strong> Zondag pas je het gewicht aan, niet nu in de gym.</span></p>
				<p class="melding amber">Al 5 weken op 60 kg en er komen geen reps bij.</p>
				<p class="melding lila">Slaap gemiddeld 6,4 u deze week.</p>
				<p class="melding fout">Dat e-mailadres en wachtwoord horen niet bij elkaar.</p>
				<div class="kaart vol stapel krap"><span class="label">Kaart, vol</span><span class="display" style="font-size: var(--maat-xl)">Progressiecheck</span></div>
			</div>
		</div>
	</section>

	<!-- Figuren -->
	<section class="stapel">
		<h2>07 · Bewegende figuren</h2>
		<p class="rustig">Elke oefening wordt voorgedaan door een pictogram-figuur. Geen video's of foto's: één stijl, licht, en in donker en licht even goed. Een figuur is twee houdingen (begin en eind) plus apparatuur; de app beweegt ertussen in het tempo van de oefening. Volt = de spieren die werken. Het balkje eronder toont de fase.</p>
		<div class="raster">
			{#each ['bench-press', 'lat-pulldown', 'leg-press', 'lateral-raise', 'romanian-deadlift', 'face-pull'] as s}
				{@const o = oefening(s)}
				<div class="kaart stapel krap"><Figuur anim={o.anim} label={o.naam} /><strong class="klein">{o.naam}</strong></div>
			{/each}
		</div>
		<div class="raster">
			<div class="kaart stapel krap">
				<h3>Bouwstenen</h3>
				<ul class="klein rustig punten">
					<li>Lichaam: romp 15, dij 11, bovenarm 8,5 px dik; ronde uiteinden. Kleur <code>--tekst</code>.</li>
					<li>Achterste arm en been: 38% van de tekstkleur, zodat diepte leesbaar blijft.</li>
					<li>Apparatuur: <code>--lijn-sterk</code>. Gewichten en grepen: <code>--tekst-gedempt</code>.</li>
					<li>Handen en voeten kunnen aan een punt vastzitten (handvat, plateau); de engine rekent de gewrichten uit.</li>
				</ul>
			</div>
			<div class="kaart stapel krap">
				<h3>Spierkaart</h3>
				<Spierkaart primair={['borst', 'triceps']} secundair={['schouder-voor']} />
			</div>
		</div>
		<p class="klein gedempt">{OEFENINGEN.length} oefeningen, elk met eigen animatie. Code: <code>src/lib/figuur/</code> en <code>src/lib/oefeningen.js</code>.</p>
	</section>

	<!-- Toon -->
	<section class="stapel">
		<h2>08 · Toon</h2>
		<div class="raster">
			<div class="kaart stapel krap">
				<h3 class="accent">Zo</h3>
				<ul class="punten rustig">
					<li>Kort en direct, je-vorm. Zoals een goede trainer praat.</li>
					<li>Concreet: "Volgende keer 52,5 kg" in plaats van "Overweeg progressie".</li>
					<li>Zeg ook wat normaal is: "Reps zakken terug naar 8. Dat is de bedoeling."</li>
				</ul>
			</div>
			<div class="kaart stapel krap">
				<h3 style="color: var(--fout)">Niet zo</h3>
				<ul class="punten rustig">
					<li>Uitroeptekens, "Let's go!", badges en confetti.</li>
					<li>Schuldgevoel bij een gemiste dag.</li>
					<li>Engelse vakjargon waar Nederlands kan; oefeningnamen blijven zoals ze in de gym heten.</li>
				</ul>
			</div>
		</div>
	</section>

	<footer class="klein gedempt" style="padding-bottom: var(--r-6)">Fits · een project van <a href="https://alduslab.eu">Aldus</a></footer>
</main>

<style>
	.ds-kop { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: var(--r-3); }
	.intro { display: grid; gap: var(--r-4); padding: var(--r-6) 0 var(--r-4); }
	.mega { font-size: clamp(2.25rem, 5vw + 1rem, 4.5rem); max-width: 20ch; }
	h2 { font-size: var(--maat-xl); border-top: 1px solid var(--lijn); padding-top: var(--r-4); }
	.merkvlak { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: var(--r-4); min-height: 14rem; }
	.merkvlak.donker { background: #0c0d10; }
	.merkvlak.volt { background: var(--volt); color: #0c0d10; }
	.merkvlak.volt .label { color: #0c0d10; }
	.merkvlak.licht { background: #f4f3ee; --tekst: #0c0d10; }
	.punten { margin: 0; padding-left: 1.1rem; display: grid; gap: var(--r-1); }
	.staal { display: flex; flex-direction: column; gap: 2px; }
	.vlakje { height: 3.5rem; border-radius: var(--hoek-m); background: var(--k); box-shadow: inset 0 0 0 1px var(--lijn); margin-bottom: var(--r-2); }
	.staal.groot .vlakje { height: 6rem; }
	.schaal { display: grid; gap: var(--r-3); }
	.ruimte { height: 0.75rem; background: var(--accent); border-radius: 2px; }
	.hoek { width: 4rem; height: 4rem; background: var(--vlak-hoog); border: 2px solid var(--accent); }
	.iconen { display: grid; grid-template-columns: repeat(auto-fill, minmax(5.5rem, 1fr)); gap: var(--r-4); }
	code { font-family: ui-monospace, 'SF Mono', Menlo, monospace; font-size: 0.85em; }
</style>
