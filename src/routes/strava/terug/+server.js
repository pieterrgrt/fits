import { redirect } from '@sveltejs/kit';
import { koppel, sync } from '#lib/server/strava.js';

export const GET = async ({ url, cookies, locals }) => {
	const state = cookies.get('fits_strava');
	cookies.delete('fits_strava', { path: '/strava' });
	if (url.searchParams.get('error')) redirect(303, '/account?strava=geweigerd');
	if (!state || state !== url.searchParams.get('state')) redirect(303, '/account?strava=fout');
	try {
		await koppel(locals.gebruiker.id, url.searchParams.get('code'), url.searchParams.get('scope'));
		await sync(locals.gebruiker.id).catch(() => {});
	} catch {
		redirect(303, '/account?strava=fout');
	}
	redirect(303, '/cardio?gekoppeld');
};
