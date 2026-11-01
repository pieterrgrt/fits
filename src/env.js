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
	OFF_URL: {
		description: 'Adres van Open Food Facts. Standaard https://nl.openfoodfacts.org (Nederlandse producten).',
		schema: (v) => v || undefined
	},
	FITS_SPOREN: {
		description: 'Map met ruwe loopbestanden (GPX/TCX, Strava-export). Standaard <FITS_DATA>/sporen.',
		schema: (v) => v || undefined
	},
	OVERPASS_URL: {
		description: 'Overpass-server voor het wegennet (OpenStreetMap). Leeg = overpass-api.de, met een mirror als reserve.',
		schema: (v) => v || undefined
	},
	STRAVA_CLIENT_SECRET: {
		description: 'Client secret van dezelfde Strava-applicatie.',
		schema: (v) => v || undefined
	}
});
