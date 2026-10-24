/*
  Sets die nog niet bij de server zijn. In een kelder-sportschool valt het bereik weg; dan bewaart
  Fits je set op de telefoon (localStorage) en verstuurt hem zodra er weer verbinding is.
  Opnieuw versturen is veilig: de server overschrijft dezelfde set (training, oefening, setnummer).
*/

const SLEUTEL = 'fits-wachtrij';

function lees() {
	try {
		return JSON.parse(localStorage.getItem(SLEUTEL) ?? '[]');
	} catch {
		return [];
	}
}
function schrijf(lijst) {
	try {
		localStorage.setItem(SLEUTEL, JSON.stringify(lijst));
	} catch {}
}

class Wachtrij {
	sets = $state([]);
	bezig = $state(false);
	fout = $state('');
	#gestart = false;

	start(naVersturen) {
		this.sets = lees();
		if (this.#gestart) return;
		this.#gestart = true;
		const probeer = async () => {
			if ((await this.verstuur()) && naVersturen) naVersturen();
		};
		addEventListener('online', probeer);
		document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && probeer());
		setInterval(probeer, 20_000);
		probeer();
	}

	/** Zet een set in de wachtrij (vervangt een eerdere versie van dezelfde set). */
	bewaar(set) {
		const sleutel = `${set.training}:${set.item}:${set.nr}`;
		this.sets = [...this.sets.filter((s) => s.sleutel !== sleutel), { ...set, sleutel, tijd: Date.now() }];
		schrijf(this.sets);
	}

	voor(training, item, nr) {
		return this.sets.find((s) => s.training === training && s.item === item && s.nr === nr) ?? null;
	}

	aantal(training) {
		return this.sets.filter((s) => s.training === training).length;
	}

	/** Verstuurt wat er wacht. Geeft true als er iets is aangekomen. */
	async verstuur() {
		if (this.bezig || !this.sets.length || !navigator.onLine) return false;
		this.bezig = true;
		let iets = false;
		try {
			for (const s of [...this.sets]) {
				const body = new FormData();
				for (const k of ['item', 'nr', 'gewicht', 'reps', 'rir']) body.set(k, s[k] ?? '');
				let antwoord;
				try {
					antwoord = await fetch(`/training/${s.training}?/set`, {
						method: 'POST',
						body,
						headers: { 'x-sveltekit-action': 'true', accept: 'application/json' }
					});
				} catch {
					break; // nog geen verbinding: later opnieuw
				}
				const r = await antwoord.json().catch(() => ({}));
				if (!r.type) {
					// Geen antwoord van Fits zelf (inlogpagina, wifi-portaal van de sportschool): bewaren en later opnieuw.
					this.fout = antwoord.redirected ? 'Log opnieuw in; daarna gaan je sets vanzelf naar de server.' : '';
					break;
				}
				if (antwoord.ok && r.type === 'success') iets = true;
				else this.fout = 'Een set kon niet worden opgeslagen (bijvoorbeeld omdat de training al is afgerond).';
				this.sets = this.sets.filter((x) => x.sleutel !== s.sleutel);
				schrijf(this.sets);
			}
		} finally {
			this.bezig = false;
		}
		return iets;
	}
}

export const wachtrij = new Wachtrij();
