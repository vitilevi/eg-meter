export type FuelId = "comum" | "premium";

export type Fuel = {
	id: FuelId;
	label: string;
	shortLabel: string;
	/** Teor de etanol anidro já presente na gasolina vendida na bomba, em %. */
	ethanolPct: number;
};

/**
 * Teores vigentes no Brasil: E32 na comum e aditivada (CNPE, a partir de
 * agosto de 2026) e 25% fixo na premium. Mudou a lei, muda só aqui.
 */
export const FUELS: readonly Fuel[] = [
	{ id: "comum", label: "Gasolina comum", shortLabel: "Comum", ethanolPct: 32 },
	{ id: "premium", label: "Gasolina premium", shortLabel: "Premium", ethanolPct: 25 },
];

/** Blends mais usados por quem prepara carro para rodar com etanol. */
export const PRESET_BLENDS: readonly number[] = [40, 50, 60, 70, 80, 85, 90, 100];

export const MAX_LITERS = 1000;

export type BlendInput = {
	fuelEthanolPct: number;
	targetPct: number;
	liters: number;
};

export type BlendResult =
	| {
			ok: true;
			/** Litros inteiros — é assim que se pede no posto. */
			gasolineLiters: number;
			ethanolLiters: number;
			/** Total abastecido (litros pedidos, arredondados para inteiro). */
			totalLiters: number;
			/** Etanol total no tanque: o da bomba somado ao que já vem na gasolina. */
			totalEthanolLiters: number;
			/** Mistura que de fato sai com os litros inteiros, em % (1 casa). */
			actualPct: number;
	  }
	| { ok: false; reason: "invalid-liters" | "invalid-target" | "target-below-fuel" };

export function getFuel(id: FuelId): Fuel {
	const fuel = FUELS.find((f) => f.id === id);
	if (!fuel) throw new Error(`Combustível desconhecido: ${id}`);
	return fuel;
}

function round1(value: number): number {
	return Math.round(value * 10) / 10;
}

/**
 * Quanto abastecer de gasolina (G) e de etanol (A) para chegar a um blend alvo.
 *
 *   G + A = V             (volume total)
 *   g·G + A = t·V         (etanol vindo da gasolina + etanol puro = alvo)
 *   ⇒ G = V·(1 − t)/(1 − g)
 *
 * O etanol hidratado da bomba é tratado como 100% etanol, convenção usada por
 * quem prepara carro.
 *
 * No posto ninguém pede 12,2 L, então tudo sai em litros inteiros: a gasolina
 * é arredondada e o etanol completa o total, para as parcelas sempre somarem
 * o total. O arredondamento desloca um pouco a mistura; `actualPct` diz quanto.
 */
export function calculateBlend({ fuelEthanolPct, targetPct, liters }: BlendInput): BlendResult {
	if (!Number.isFinite(targetPct) || targetPct < 0 || targetPct > 100) {
		return { ok: false, reason: "invalid-target" };
	}
	if (targetPct < fuelEthanolPct) {
		return { ok: false, reason: "target-below-fuel" };
	}
	if (!Number.isFinite(liters) || liters <= 0 || liters > MAX_LITERS) {
		return { ok: false, reason: "invalid-liters" };
	}

	const totalLiters = Math.round(liters);
	if (totalLiters < 1) return { ok: false, reason: "invalid-liters" };

	const gasolineLiters = Math.round((totalLiters * (100 - targetPct)) / (100 - fuelEthanolPct));
	const ethanolLiters = totalLiters - gasolineLiters;
	const ethanolInTank = (gasolineLiters * fuelEthanolPct) / 100 + ethanolLiters;
	const totalEthanolLiters = round1(ethanolInTank);
	const actualPct = round1((ethanolInTank / totalLiters) * 100);

	return { ok: true, gasolineLiters, ethanolLiters, totalLiters, totalEthanolLiters, actualPct };
}

/** Aceita "50", "50,5" ou "50.5". Qualquer outra coisa vira NaN. */
export function parseLiters(raw: string): number {
	const normalized = raw.trim().replace(",", ".");
	if (!/^\d+(\.\d+)?$/.test(normalized)) return Number.NaN;
	return Number(normalized);
}

const numberFormatter = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });

/** Inteiros saem sem casa ("12 L"); valores informativos, com até uma ("2,5 L"). */
export function formatLiters(value: number): string {
	return `${numberFormatter.format(value)} L`;
}

export function formatPct(value: number): string {
	return numberFormatter.format(value);
}
