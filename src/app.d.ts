declare global {
	namespace App {
		interface Locals {
			gebruiker: { id: number; email: string; naam: string; rol: 'beheerder' | 'lid'; gewicht: number | null; onderhoud: number | null; sessie_id: string } | null;
		}
	}
}
export {};
