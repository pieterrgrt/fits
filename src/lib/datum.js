// Datums als 'YYYY-MM-DD' in Nederlandse tijd. Geen tijdzonegedoe: rekenen gebeurt op UTC-middernacht.

const TZ = 'Europe/Amsterdam';
export const DAGEN = ['maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag', 'zondag'];
export const DAGEN_KORT = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo'];
const MAANDEN = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];

export function vandaag(nu = new Date()) {
	return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(nu);
}

const alsDatum = (d) => new Date(d + 'T00:00:00Z');
const alsTekst = (dt) => dt.toISOString().slice(0, 10);

/** 1 = maandag … 7 = zondag */
export const weekdag = (d) => ((alsDatum(d).getUTCDay() + 6) % 7) + 1;
export const plusDagen = (d, n) => alsTekst(new Date(alsDatum(d).getTime() + n * 86400000));
export const dagenTussen = (a, b) => Math.round((alsDatum(b) - alsDatum(a)) / 86400000);
export const maandag = (d) => plusDagen(d, 1 - weekdag(d));

export function mooi(d, { jaar = false, dag = false } = {}) {
	if (!d) return '';
	const dt = alsDatum(d);
	const tekst = `${dt.getUTCDate()} ${MAANDEN[dt.getUTCMonth()]}${jaar ? ' ' + dt.getUTCFullYear() : ''}`;
	return dag ? `${DAGEN_KORT[weekdag(d) - 1]} ${tekst}` : tekst;
}

/** "3 wk", "5 d", "vandaag" — hoe lang je al op een gewicht zit */
export function hoeLang(sinds, tot = vandaag()) {
	if (!sinds) return null;
	const d = dagenTussen(sinds, tot);
	if (d <= 0) return 'vandaag';
	if (d < 14) return `${d} d`;
	return `${Math.floor(d / 7)} wk`;
}

/** ISO-weeknummer, voor "week 43" */
export function weeknummer(d) {
	const dt = alsDatum(d);
	const dag = (dt.getUTCDay() + 6) % 7;
	dt.setUTCDate(dt.getUTCDate() - dag + 3);
	const eersteDonderdag = new Date(Date.UTC(dt.getUTCFullYear(), 0, 4));
	return 1 + Math.round(((dt - eersteDonderdag) / 86400000 - 3 + ((eersteDonderdag.getUTCDay() + 6) % 7)) / 7);
}
