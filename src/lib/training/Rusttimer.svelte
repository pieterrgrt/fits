<script>
	// Rusttimer onderin beeld. Start na elke gelogde set; trilt en piept als de rust erop zit.
	// De tijd telt vanaf de klok, niet per tik: zet je de app even weg of gaat je scherm uit, dan klopt hij
	// als je terugkomt. Hij overleeft ook herladen (bewaard op de telefoon).
	import { onMount } from 'svelte';
	import Icoon from '#lib/Icoon.svelte';
	import { veer, magBewegen } from '#lib/beweging.js';

	let { seconden = $bindable(0), totaal = 90, bereik = '', onklaar } = $props();
	let einde = $state(0);
	let over = $state(0);
	let interval;
	const SLEUTEL = 'fits-rust';

	export function start(s, label) {
		totaal = s;
		bereik = label;
		einde = Date.now() + s * 1000;
		bewaar();
		loop();
	}
	function loop() {
		tik();
		clearInterval(interval);
		interval = setInterval(tik, 250);
	}
	function bewaar() {
		try {
			if (einde) localStorage.setItem(SLEUTEL, JSON.stringify({ einde, totaal, bereik }));
			else localStorage.removeItem(SLEUTEL);
		} catch {}
	}
	onMount(() => {
		try {
			const r = JSON.parse(localStorage.getItem(SLEUTEL) ?? 'null');
			if (r && r.einde > Date.now()) {
				({ einde, totaal, bereik } = r);
				loop();
			}
		} catch {}
		const terug = () => document.visibilityState === 'visible' && einde && tik();
		document.addEventListener('visibilitychange', terug);
		return () => {
			document.removeEventListener('visibilitychange', terug);
			clearInterval(interval);
		};
	});
	function tik() {
		over = Math.max(0, Math.ceil((einde - Date.now()) / 1000));
		seconden = over;
		if (over === 0 && interval) {
			clearInterval(interval);
			interval = null;
			einde = 0;
			bewaar();
			signaal();
			onklaar?.();
		}
	}
	function signaal() {
		try {
			navigator.vibrate?.([180, 80, 180]);
			const ctx = new AudioContext();
			const o = ctx.createOscillator();
			const g = ctx.createGain();
			o.frequency.value = 880;
			g.gain.setValueAtTime(0.12, ctx.currentTime);
			g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
			o.connect(g).connect(ctx.destination);
			o.start();
			o.stop(ctx.currentTime + 0.4);
		} catch {}
	}
	const stop = () => {
		clearInterval(interval);
		interval = null;
		einde = 0;
		bewaar();
		over = 0;
		seconden = 0;
	};
	const erbij = (s) => {
		einde += s * 1000;
		totaal += s;
		bewaar();
		tik();
	};
	const mm = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
	// In en uit van onderen; de timer staat in het midden (translateX(-50%)), dus fly gaat niet.
	const schuif = (node, { duration = 240 } = {}) => ({
		duration: magBewegen() ? duration : 0,
		easing: veer,
		css: (t, u) => `transform: translate(-50%, ${u * 24}px) scale(${0.96 + t * 0.04}); opacity: ${t}`
	});
</script>

{#if einde && over > 0}
	<div class="timer" class:bijna={over <= 5} role="timer" aria-live="off" transition:schuif>
		<div class="voortgang" style="--f: {1 - over / totaal}"></div>
		<div class="inhoud">
			<div class="stapel krap" style="gap: 0">
				<span class="label">Rust {bereik}</span>
				<span class="tijd">{mm(over)}</span>
			</div>
			<div class="rij">
				<button class="knop klein omlijnd" onclick={() => erbij(15)}>+15</button>
				<button class="knop klein primair" onclick={stop}>Door <Icoon naam="pijl" grootte={16} /></button>
			</div>
		</div>
	</div>
{/if}

<style>
	.timer {
		position: fixed;
		left: 50%;
		bottom: calc(var(--r-4) + env(safe-area-inset-bottom));
		transform: translateX(-50%);
		width: min(calc(100% - 2rem), 26rem);
		z-index: 30;
		border-radius: var(--hoek-l);
		background: var(--vlak-hoog);
		border: 1px solid var(--lijn-sterk);
		box-shadow: 0 20px 50px -20px rgb(0 0 0 / 0.8);
		overflow: hidden;
	}
	.voortgang { position: absolute; inset: 0; background: var(--accent-tint); transform-origin: left; transform: scaleX(var(--f)); transition: transform 250ms linear; }
	.inhoud { position: relative; display: flex; justify-content: space-between; align-items: center; padding: var(--r-3) var(--r-4); }
	.tijd { font-family: var(--letter-display); font-stretch: var(--breed); font-weight: 800; font-size: var(--maat-2xl); line-height: 1; font-variant-numeric: tabular-nums; }
	.tijd { transition: color var(--gewoon); }
	/* Laatste seconden: de tijd kleurt volt, zodat je uit je ooghoek ziet dat je weer mag. */
	.bijna .tijd { color: var(--accent-tekst); }
	.bijna .voortgang { background: color-mix(in srgb, var(--accent) 22%, transparent); }
</style>
