import { sveltekit } from '@sveltejs/kit/vite';
import adapter from '@sveltejs/adapter-node';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit({
			adapter: adapter(),
			// Formulieren komen alleen van fits.alduslab.eu zelf (of van ORIGIN in .env).
			csrf: { trustedOrigins: [] }
		})
	]
});
