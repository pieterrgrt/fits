import { redirect } from '@sveltejs/kit';
import { COOKIE, stopSessie } from '#lib/server/auth.js';

export const load = () => redirect(303, '/account');

export const actions = {
	default: ({ cookies }) => {
		stopSessie(cookies.get(COOKIE));
		cookies.delete(COOKIE, { path: '/' });
		redirect(303, '/inloggen');
	}
};
