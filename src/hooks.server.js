import { redirect } from '@sveltejs/kit';
import { COOKIE, leesSessie } from '#lib/server/auth.js';

// Pagina's die je zonder in te loggen mag zien.
// /api/… regelt zelf de toegang (met een persoonlijke sleutel).
const OPEN = ['/inloggen', '/registreren', '/ontwerp', '/gezond', '/health', '/api'];

export async function handle({ event, resolve }) {
	const token = event.cookies.get(COOKIE);
	event.locals.gebruiker = token ? leesSessie(token) : null;
	if (token && !event.locals.gebruiker) event.cookies.delete(COOKIE, { path: '/' });

	const pad = event.url.pathname;
	const open = OPEN.some((p) => pad === p || pad.startsWith(p + '/'));
	if (!open && !event.locals.gebruiker) {
		const naar = pad === '/' ? '' : `?naar=${encodeURIComponent(pad + event.url.search)}`;
		redirect(303, `/inloggen${naar}`);
	}
	if (pad.startsWith('/beheer') && event.locals.gebruiker?.rol !== 'beheerder') redirect(303, '/');

	const antwoord = await resolve(event);
	antwoord.headers.set('X-Frame-Options', 'DENY');
	antwoord.headers.set('X-Content-Type-Options', 'nosniff');
	antwoord.headers.set('Referrer-Policy', 'same-origin');
	// Camera alleen voor Fits zelf (barcode scannen).
	antwoord.headers.set('Permissions-Policy', 'camera=(self), microphone=(), geolocation=()');
	return antwoord;
}
