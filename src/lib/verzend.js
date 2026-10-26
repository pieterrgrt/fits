// Formulier versturen zonder de pagina te herladen, met een draaiertje in de knop zolang het duurt.
// Zo loopt ook een doorverwijzing (training starten, afronden) via de pagina-overgang.
//   <form method="POST" use:verzend>                                 gewoon
//   <form method="POST" use:verzend={{ bevestig: 'Verwijderen?' }}>  eerst vragen
//   <form method="POST" use:verzend={{ voor: () => klopt }}>         false = niet versturen
import { enhance } from '$app/forms';

/** @param {HTMLFormElement} form @param {{ bevestig?: string, voor?: () => boolean | void }} [opties] */
export function verzend(form, opties = {}) {
	return enhance(form, ({ submitter, cancel }) => {
		if (opties.bevestig && !confirm(opties.bevestig)) return cancel();
		if (opties.voor?.() === false) return cancel();
		const knop = submitter ?? form.querySelector('button:not([type="button"])');
		knop?.classList.add('bezig');
		form.setAttribute('aria-busy', 'true');
		return async ({ update }) => {
			try {
				await update();
			} finally {
				knop?.classList.remove('bezig');
				form.removeAttribute('aria-busy');
			}
		};
	});
}
