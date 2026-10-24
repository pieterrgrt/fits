<script>
	import Figuur from '#lib/figuur/Figuur.svelte';
	import { oefening } from '#lib/oefeningen.js';
</script>

<svelte:head><title>Hoe het werkt · Fits</title></svelte:head>

<main class="app stapel ruim uitleg">
	<header class="paginakop">
		<span class="label">De regels achter Fits</span>
		<h1>Hoe het werkt</h1>
		<p class="rustig">Gym is de hoofdzaak, cardio is extra. Groei komt uit gym + eten + slaap.</p>
	</header>

	<section class="kaart stapel">
		<h2>Dubbele progressie</h2>
		<p>Elke oefening heeft een rep-range. De onderkant is je startgewicht, de bovenkant zegt: tijd om zwaarder te gaan.</p>
		<ol class="genummerd">
			<li>Begin op een gewicht waarmee je in alle sets ongeveer de onderkant haalt.</li>
			<li>Probeer elke sessie per set één rep meer. Fits zet dat als <strong class="accent">doel vandaag</strong> bij elke oefening.</li>
			<li>Haal je in <strong>alle</strong> sets de bovenkant? Dan gaat het gewicht zondag omhoog. De reps zakken terug naar de onderkant. Dat is de bedoeling.</li>
			<li>Lukt de laatste set drie sessies op rij niet? Zelfde gewicht, één set minder, en de week erna weer opbouwen.</li>
			<li>De laatste 1–2 reps van elke set moeten echt zwaar zijn. Anders is het gewicht te licht.</li>
		</ol>
		<div class="tabel">
			<div><span class="label">Machines</span><strong>+2,5–5 kg</strong></div>
			<div><span class="label">Dumbbells</span><strong>+1–2 kg per stuk</strong></div>
			<div><span class="label">Raises en shoulder press</span><strong>+1 kg per maand</strong></div>
		</div>
	</section>

	<section class="kaart stapel">
		<h2>Hoe zwaar per set</h2>
		<p>Standaard stop je als je nog 1–2 reps had gekund, maar die echt zwaar waren geweest. Niet tot falen. Na elke set kun je in Fits aantikken hoeveel je nog over had (0, 1 of 2+).</p>
		<div class="raster twee">
			<div class="kaart hoog stapel krap">
				<span class="label accent">Isolatie</span>
				<p class="klein" style="margin:0">Curls, raises, pushdowns, extensions, flys: de laatste set mag tot 0 over.</p>
			</div>
			<div class="kaart hoog stapel krap">
				<span class="label accent">Compounds</span>
				<p class="klein" style="margin:0">Bench, overhead press, leg press, hack squat, RDL, rows: altijd 1–2 over, ook in de laatste set. Bij barbells nooit tot falen.</p>
			</div>
		</div>
		<p class="klein rustig" style="margin:0">Signaal dat je er bent: reps worden duidelijk langzamer en je techniek begint te wringen (heupen omhoog bij bench, shruggen bij raises, rug rond bij RDL). Haal je de bovenkant alleen door tot falen te gaan? Dan nog niet zwaarder; Fits houdt daar rekening mee.</p>
	</section>

	<section class="kaart stapel">
		<h2>Rust tussen sets</h2>
		<div class="tabel">
			<div><span class="label">Zwaar</span><strong>90–120 sec</strong><span class="klein gedempt">press, row, pulldown, leg press, hack squat</span></div>
			<div><span class="label">Isolatie</span><strong>60 sec</strong><span class="klein gedempt">raises, curls, pushdowns, flys</span></div>
		</div>
		<p class="klein rustig" style="margin:0">De rusttimer start vanzelf na elke set die je opslaat.</p>
	</section>

	<section class="kaart stapel">
		<h2>Het wisselslot</h2>
		<p>De laatste oefening van elke sessie. Daar probeer je een nieuw apparaat uit. Kies er op zondag één voor de komende week. Bevalt het na 2–3 weken beter dan een vaste oefening? Wissel ze om.</p>
		<p class="klein rustig" style="margin:0"><strong>Zoek gewicht:</strong> eerste sessie licht beginnen, per set opbouwen tot je in de eerste set ongeveer de onderkant van de range haalt. Dat gewicht zet je zondag vast.</p>
		<p class="klein rustig" style="margin:0"><strong>Sinds:</strong> de datum waarop je het gewicht voor het laatst verhoogde. Zo weet je altijd hoelang je op een gewicht zit. Staat er 4+ weken dezelfde datum en komen er geen reps bij? Dan stelt Fits voor de oefening te vervangen.</p>
	</section>

	<section class="kaart stapel">
		<h2>Zondag-check · 10 min</h2>
		<ol class="genummerd">
			<li>Bekijk per oefening de laatste twee sessies.</li>
			<li>Bovenkant in alle sets gehaald? Nieuw gewicht, "sinds" op vandaag.</li>
			<li>4+ weken dezelfde datum en geen reps erbij? Vervang de oefening door een variant uit het wisselslot.</li>
			<li>Kies één nieuw apparaat voor het wisselslot van komende week.</li>
			<li>Vul de weekregel in: slaap, energie, gewicht.</li>
		</ol>
		<a href="/zondag" class="knop primair" style="align-self: flex-start">Naar de zondag-check</a>
	</section>

	<section class="kaart stapel">
		<h2>Twee-uursoptie</h2>
		<p>Altijd eerst de gymsessie, daarna één bouwsteen kiezen:</p>
		<div class="tabel">
			<div><span class="label">A</span><strong>+30 min volume</strong><span class="klein gedempt">2 extra oefeningen uit het wisselslot, 3 sets. Max 2× per week.</span></div>
			<div><span class="label">B</span><strong>+30–40 min cardio</strong><span class="klein gedempt">Zwemmen of zone 2. Niet op de dag voor of na legs.</span></div>
			<div><span class="label">C</span><strong>+20 min core en mobility</strong><span class="klein gedempt">Bijvoorbeeld knee raises, plank, stretchen.</span></div>
		</div>
		<p class="klein rustig" style="margin:0">Cardio max 2–3 keer per week zolang groei het doel is.</p>
	</section>

	<section class="kaart stapel">
		<h2>Eten en slaap</h2>
		<div class="tabel">
			<div><span class="label" style="color: var(--amber)">Eiwit</span><strong>1,8–2 g per kg</strong><span class="klein gedempt">per dag</span></div>
			<div><span class="label" style="color: var(--amber)">Calorieën</span><strong>+300–500</strong><span class="klein gedempt">boven onderhoud</span></div>
			<div><span class="label" style="color: var(--lila)">Slaap</span><strong>8+ uur</strong><span class="klein gedempt">elke nacht</span></div>
		</div>
	</section>

	<section class="stapel">
		<h2>Lees de figuren</h2>
		<div class="raster twee">
			<div class="kaart"><Figuur anim={oefening('lateral-raise').anim} label="Lateral raise" /></div>
			<p class="rustig klein">Elke oefening heeft een bewegende figuur. <strong class="accent">Volt</strong> = de spieren die het werk doen. Het balkje eronder loopt mee met de fase: eerst de kracht-fase, dan rustig terug. Liever geen beweging op je telefoon? Dan zie je begin- en eindstand tegelijk.</p>
		</div>
	</section>
</main>

<style>
	.uitleg p { margin: 0; }
	.genummerd { margin: 0; padding-left: 1.25rem; display: grid; gap: var(--r-2); }
	.tabel { display: grid; gap: var(--r-2); grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr)); }
	.tabel > div { display: flex; flex-direction: column; gap: 2px; padding: var(--r-3); background: var(--vlak-hoog); border-radius: var(--hoek-m); }
</style>
