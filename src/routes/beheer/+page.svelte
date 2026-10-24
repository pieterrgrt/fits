<script>
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import Icoon from '#lib/Icoon.svelte';
	let { data, form } = $props();
	const link = (code) => `${page.url.origin}/registreren?code=${code}`;
	let gekopieerd = $state(false);
</script>

<main class="app stapel ruim">
	<header class="paginakop">
		<span class="label">Alleen voor beheerders</span>
		<h1>Beheer</h1>
	</header>
	{#if form?.fout}<p class="melding fout">{form.fout}</p>{/if}

	<section class="stapel">
		<div class="rij uiteen"><h2>Uitnodigen</h2>
			<form method="POST" action="?/uitnodiging" use:enhance><button class="knop primair klein"><Icoon naam="plus" grootte={16} /> Nieuwe code</button></form>
		</div>
		{#if form?.code}
			<div class="kaart vol stapel krap">
				<span class="label">Geldig 14 dagen, één keer te gebruiken</span>
				<span class="code">{form.code}</span>
				<button class="knop" onclick={async () => { await navigator.clipboard.writeText(link(form.code)); gekopieerd = true; }}>{gekopieerd ? 'Link gekopieerd' : 'Kopieer uitnodigingslink'}</button>
			</div>
		{/if}
		{#if data.uitnodigingen.length}
			<ul class="lijst kaart">
				{#each data.uitnodigingen as u}
					<li class="rij uiteen">
						<span class="tnum"><strong style="letter-spacing: 0.08em">{u.code}</strong> <span class="klein gedempt">{u.gebruikt ? `gebruikt door ${u.gebruikt}` : `verloopt ${u.verloopt.slice(0, 10)}`}</span></span>
						{#if !u.gebruikt}<form method="POST" action="?/intrekken" use:enhance><input type="hidden" name="code" value={u.code} /><button class="knop klein stil">Intrekken</button></form>{/if}
					</li>
				{/each}
			</ul>
		{/if}
	</section>

	<section class="stapel">
		<h2>Gebruikers</h2>
		{#each data.gebruikers as g (g.id)}
			<article class="kaart stapel krap">
				<div class="rij uiteen">
					<strong>{g.naam}{g.id === data.ik ? ' (jij)' : ''}</strong>
					<span class="chip" class:volt={g.rol === 'beheerder'}>{g.rol}</span>
				</div>
				<span class="klein gedempt">{g.email} · {g.trainingen} trainingen{g.laatst ? ` · laatst ${g.laatst}` : ''}</span>
				{#if g.id !== data.ik}
					<div class="rij">
						<form method="POST" action="?/rol" use:enhance><input type="hidden" name="id" value={g.id} /><input type="hidden" name="rol" value={g.rol === 'beheerder' ? 'lid' : 'beheerder'} /><button class="knop klein omlijnd">{g.rol === 'beheerder' ? 'Maak lid' : 'Maak beheerder'}</button></form>
						<form method="POST" action="?/uitloggen" use:enhance><input type="hidden" name="id" value={g.id} /><button class="knop klein omlijnd">Overal uitloggen</button></form>
						<form method="POST" action="?/verwijder" use:enhance onsubmit={(e) => { if (!confirm(`${g.naam} en alle gegevens verwijderen?`)) e.preventDefault(); }}><input type="hidden" name="id" value={g.id} /><button class="knop klein gevaar">Verwijderen</button></form>
					</div>
				{/if}
			</article>
		{/each}
	</section>
</main>

<style>
	.code { font-family: var(--letter-display); font-stretch: var(--breed); font-weight: 800; font-size: var(--maat-2xl); letter-spacing: 0.08em; }
</style>
