import crypto from 'node:crypto';
import { error, redirect } from '@sveltejs/kit';
import { dev } from '$app/env';
import { autorisatieUrl, stravaAan } from '#lib/server/strava.js';

export const GET = ({ url, cookies }) => {
	if (!stravaAan()) error(404, 'Strava is nog niet ingesteld op deze server (zie docs/strava.md).');
	const state = crypto.randomBytes(16).toString('hex');
	cookies.set('fits_strava', state, { path: '/strava', httpOnly: true, sameSite: 'lax', secure: !dev, maxAge: 600 });
	redirect(302, autorisatieUrl(`${url.origin}/strava/terug`, state, url.searchParams.has('schrijven')));
};
