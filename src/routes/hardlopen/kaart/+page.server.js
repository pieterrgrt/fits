import * as sporen from '#lib/server/sporen.js';

export const load = ({ locals }) => ({ titel: 'Kaart van je loopjes', lijnen: sporen.lijnen(locals.gebruiker.id).map((s) => s.lijn) });
