<script>
	// Rusttimer onderin beeld. Start na elke gelogde set; trilt en piept als de rust erop zit.
	import Icoon from '#lib/Icoon.svelte';

	let { seconden = $bindable(0), totaal = 90, bereik = '', onklaar } = $props();
	let einde = $state(0);
	let over = $state(0);
	let interval;

	export function start(s, label) {
		totaal = s;
		bereik = label;
		einde = Date.now() + s * 1000;
		tik();
		clearInterval(interval);
		interval = setInterval(tik, 250);
	}
	function tik() {
		over = Math.max(0, Math.ceil((einde - Date.now()) / 1000));
		seconden = over;
		if (over === 0 && interval) {
			clearInterval(interval);
			interval = null;
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
		over = 0;
		seconden = 0;
	};
	const erbij = (s) => {
		einde += s * 1000;
		totaal += s;
		tik();
	};
	const mm = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
</script>

{#if einde && over > 0}
	<div class="timer" role="timer" aria-live="off">
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
		animation: in var(--gewoon) var(--veer);
	}
	.voortgang { position: absolute; inset: 0; background: var(--accent-tint); transform-origin: left; transform: scaleX(var(--f)); transition: transform 250ms linear; }
	.inhoud { position: relative; display: flex; justify-content: space-between; align-items: center; padding: var(--r-3) var(--r-4); }
	.tijd { font-family: var(--letter-display); font-stretch: var(--breed); font-weight: 800; font-size: var(--maat-2xl); line-height: 1; font-variant-numeric: tabular-nums; }
	@keyframes in { from { transform: translate(-50%, 20px); opacity: 0; } }
</style>
