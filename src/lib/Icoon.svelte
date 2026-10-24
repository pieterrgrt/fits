<script>
	// Eigen iconenset: 24×24, lijn 2, ronde uiteinden. Zie /ontwerp voor het overzicht.
	let { naam, grootte = 24 } = $props();
	const PADEN = {
		vandaag: 'M12 3v2M12 19v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M3 12h2M19 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
		schema: 'M4 6h16M4 12h16M4 18h10M8 3v6M16 9v6M12 15v6',
		logboek: 'M6 3h10l3 3v15H6zM9 9h7M9 13h7M9 17h4',
		oefeningen: 'M3 10v4M6 7v10M6 12h12M18 7v10M21 10v4',
		meer: 'M5 12h.01M12 12h.01M19 12h.01',
		plus: 'M12 5v14M5 12h14',
		min: 'M5 12h14',
		vink: 'M5 12.5l4.5 4.5L19 7.5',
		kruis: 'M6 6l12 12M18 6L6 18',
		pijl: 'M5 12h14M13 6l6 6-6 6',
		terug: 'M19 12H5M11 6l-6 6 6 6',
		omhoog: 'M12 19V5M6 11l6-6 6 6',
		timer: 'M12 8v5l3 2M9 2h6M12 4a9 9 0 1 0 0 18 9 9 0 0 0 0-18z',
		zondag: 'M4 19l5-6 4 3 7-9M15 7h5v5',
		doel: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zM12 11a1 1 0 1 0 0 2 1 1 0 0 0 0-2z',
		cardio: 'M3 12h4l2-5 4 10 2-5h6',
		eten: 'M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10M17 21V3c-2 0-4 2-4 7v4h4',
		slaap: 'M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z',
		account: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
		uitleg: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5V14M12 17.5h.01',
		wissel: 'M7 4L3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7',
		bewerk: 'M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4',
		sync: 'M20 11a8 8 0 0 0-14.5-4.5L4 8M4 4v4h4M4 13a8 8 0 0 0 14.5 4.5L20 16M20 20v-4h-4',
		uit: 'M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10',
		vlam: 'M12 21c-4 0-7-3-7-7 0-5 6-6 5-11 3 2 5 5 5 8 1-1 2-2 2-4 1 2 2 4 2 7 0 4-3 7-7 7z',
		slot: 'M6 11h12v10H6zM8 11V7a4 4 0 0 1 8 0v4',
		download: 'M12 4v11M7 10l5 5 5-5M5 20h14',
		info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v6M12 7.5h.01',
		groei: 'M3 17l6-6 4 4 8-8M15 7h6v6',
		foto: 'M4 8h3l2-3h6l2 3h3v11H4zM12 17a3.5 3.5 0 100-7 3.5 3.5 0 000 7z',
		greep: 'M9 5h.01M15 5h.01M9 12h.01M15 12h.01M9 19h.01M15 19h.01'
	};
</script>

<svg
	width={grootte}
	height={grootte}
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width="2"
	stroke-linecap="round"
	stroke-linejoin="round"
	aria-hidden="true"><path d={PADEN[naam] ?? PADEN.info} /></svg>
