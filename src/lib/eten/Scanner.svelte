<script>
	// Barcode scannen met de camera. Werkt ook op de iPhone: waar de browser zelf geen barcodes kan lezen,
	// neemt ZXing (WebAssembly, meegeleverd met Fits) het over.
	import { onMount } from 'svelte';
	import Icoon from '#lib/Icoon.svelte';

	let { ongevonden, sluit } = $props();
	let video;
	let melding = $state('Camera starten…');
	let handmatig = $state('');

	onMount(() => {
		let stroom;
		let stop = false;
		(async () => {
			try {
				let Detector = globalThis.BarcodeDetector;
				const formaten = ['ean_13', 'ean_8', 'upc_a', 'upc_e'];
				if (!Detector || !(await Detector.getSupportedFormats?.())?.includes('ean_13')) {
					const [{ BarcodeDetector, prepareZXingModule }, { default: wasm }] = await Promise.all([
						import('barcode-detector/ponyfill'),
						import('zxing-wasm/reader/zxing_reader.wasm?url')
					]);
					prepareZXingModule({ overrides: { locateFile: (pad, prefix) => (pad.endsWith('.wasm') ? wasm : prefix + pad) } });
					Detector = BarcodeDetector;
				}
				const detector = new Detector({ formats: formaten });
				stroom = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1280 } }, audio: false });
				if (stop) return stroom.getTracks().forEach((t) => t.stop());
				video.srcObject = stroom;
				await video.play();
				melding = 'Houd de barcode in het kader';
				while (!stop) {
					const codes = await detector.detect(video).catch(() => []);
					if (codes.length) {
						navigator.vibrate?.(60);
						stop = true;
						ongevonden(codes[0].rawValue);
						break;
					}
					await new Promise((r) => setTimeout(r, 180));
				}
			} catch (e) {
				melding = e?.name === 'NotAllowedError' ? 'Geen toegang tot de camera. Typ de barcode hieronder.' : 'Scannen lukt hier niet. Typ de barcode hieronder.';
			}
		})();
		return () => {
			stop = true;
			stroom?.getTracks().forEach((t) => t.stop());
		};
	});
</script>

<div class="scanner" role="dialog" aria-label="Barcode scannen">
	<div class="beeld">
		<!-- svelte-ignore a11y_media_has_caption -->
		<video bind:this={video} playsinline muted></video>
		<div class="kader"></div>
	</div>
	<p class="klein rustig" style="margin:0; text-align:center">{melding}</p>
	<form class="rij" onsubmit={(e) => { e.preventDefault(); if (/^\d{6,14}$/.test(handmatig)) ongevonden(handmatig); }}>
		<input class="invoer" style="flex: 1" inputmode="numeric" placeholder="Of typ de barcode" bind:value={handmatig} aria-label="Barcode" />
		<button class="knop omlijnd">Zoek</button>
	</form>
	<button class="knop stil" onclick={sluit}><Icoon naam="kruis" grootte={18} /> Sluiten</button>
</div>

<style>
	.scanner { display: flex; flex-direction: column; gap: var(--r-3); }
	.beeld { position: relative; border-radius: var(--hoek-l); overflow: hidden; background: #000; aspect-ratio: 4 / 3; }
	video { width: 100%; height: 100%; object-fit: cover; }
	.kader {
		position: absolute; inset: 28% 12%;
		border: 3px solid var(--volt); border-radius: var(--hoek-m);
		box-shadow: 0 0 0 999px rgb(0 0 0 / 0.35);
	}
</style>
