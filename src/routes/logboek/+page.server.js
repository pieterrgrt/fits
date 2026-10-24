import * as data from '#lib/server/data.js';

export const load = ({ locals, url }) => {
	const voor = url.searchParams.get('voor');
	const lijst = data.trainingen(locals.gebruiker.id, { limiet: 20, voor: /^\d{4}-\d{2}-\d{2}$/.test(voor ?? '') ? voor : null });
	return {
		titel: 'Logboek',
		trainingen: lijst.map((t) => ({ ...t, groepen: data.perOefening(t.sets) })),
		meer: lijst.length === 20 ? lijst[lijst.length - 1].datum : null
	};
};
