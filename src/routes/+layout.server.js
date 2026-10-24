export const load = ({ locals }) => ({
	gebruiker: locals.gebruiker && { id: locals.gebruiker.id, naam: locals.gebruiker.naam, rol: locals.gebruiker.rol }
});
