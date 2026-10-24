import { defineEnvVars } from '@sveltejs/kit/env';

// Alle instellingen van Fits. Zet ze in .env (lokaal) of in docker-compose.yml (server).
export const variables = defineEnvVars({
	FITS_DATA: {
		description: 'Map voor de SQLite-database. Standaard ./data; in Docker /data.',
		schema: (v) => v || undefined
	},
	STRAVA_CLIENT_ID: {
		description: 'Client ID van je Strava API-applicatie (strava.com/settings/api). Leeg = Strava staat uit.',
		schema: (v) => v || undefined
	},
	STRAVA_CLIENT_SECRET: {
		description: 'Client secret van dezelfde Strava-applicatie.',
		schema: (v) => v || undefined
	}
});
