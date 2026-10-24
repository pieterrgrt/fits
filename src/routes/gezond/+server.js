import { een } from '#lib/server/db.js';

// Voor de controle na het online zetten en voor Docker: antwoordt de app en werkt de database?
export const GET = () => {
	een('SELECT 1');
	return new Response('ok', { headers: { 'cache-control': 'no-store' } });
};
