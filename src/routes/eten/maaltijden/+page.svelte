<script>
	import { enhance } from '$app/forms';
	import Icoon from '#lib/Icoon.svelte';
	import { getal } from '#lib/gewicht.js';
	let { data } = $props();
</script>

<main class="app stapel">
	<a class="knop stil klein" style="align-self: flex-start" href="/eten"><Icoon naam="terug" grootte={16} /> Eten</a>
	<header class="paginakop">
		<span class="label" style="color: var(--amber)">Vaste maaltijden en recepten</span>
		<h1>Mijn maaltijden</h1>
		<p class="rustig">Met één tik in je dagboek. Een recept maak je voor meerdere porties; je eet er dan één (of anderhalf) van.</p>
	</header>
	<a class="knop primair" href="/eten/maaltijden/nieuw"><Icoon naam="plus" grootte={18} /> Recept maken</a>

	{#each data.maaltijden as m (m.id)}
		<details class="kaart">
			<summary class="rij uiteen">
				<span class="stapel krap" style="gap: 0">
					<strong>{m.naam}</strong>
					<span class="klein gedempt">{m.porties > 1 ? `${m.porties} porties · per portie ` : ''}{Math.round(m.totaal.kcal / m.porties)} kcal · {Math.round(m.totaal.eiwit / m.porties)} g eiwit</span>
				</span>
				<Icoon naam="plus" grootte={18} />
			</summary>
			<ul class="lijst klein" style="margin-top: var(--r-3)">
				{#each m.items as it}<li class="rij uiteen"><span>{it.naam}</span><span class="gedempt tnum">{it.portie ?? `${getal(it.hoeveelheid)} g`} · {Math.round(it.kcal)} kcal</span></li>{/each}
			</ul>
			<form method="POST" action="?/weg" use:enhance onsubmit={(e) => { if (!confirm(`"${m.naam}" verwijderen?`)) e.preventDefault(); }}>
				<input type="hidden" name="id" value={m.id} /><button class="knop klein stil" style="color: var(--fout)">Verwijderen</button>
			</form>
		</details>
	{:else}
		<p class="leeg">Nog niets. Bewaar een maaltijd vanuit je dagboek, of maak hierboven een recept.</p>
	{/each}
</main>
