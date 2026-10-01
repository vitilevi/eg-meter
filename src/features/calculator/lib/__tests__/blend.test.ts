import { describe, expect, it } from "vitest";
import {
	calculateBlend,
	FUELS,
	formatLiters,
	getFuel,
	PRESET_BLENDS,
	parseLiters,
} from "@/features/calculator/lib/blend";

describe("FUELS", () => {
	it("usa os teores vigentes de etanol anidro", () => {
		expect(getFuel("comum").ethanolPct).toBe(32);
		expect(getFuel("premium").ethanolPct).toBe(25);
		expect(FUELS).toHaveLength(2);
	});

	it("lista os blends principais", () => {
		expect(PRESET_BLENDS).toEqual([40, 50, 60, 70, 80, 85, 90, 100]);
	});
});

describe("calculateBlend", () => {
	it("E85 com premium em 50 L: 10 L de gasolina + 40 L de etanol", () => {
		expect(calculateBlend({ fuelEthanolPct: 25, targetPct: 85, liters: 50 })).toEqual({
			ok: true,
			gasolineLiters: 10,
			ethanolLiters: 40,
			totalLiters: 50,
			totalEthanolLiters: 42.5,
			actualPct: 85,
		});
	});

	it("arredonda para litros inteiros e informa a mistura real", () => {
		// G = 40·0,5/0,68 = 29,41… → 29 L; etanol = 9,28 + 11 = 20,28 L → E50,7
		expect(calculateBlend({ fuelEthanolPct: 32, targetPct: 50, liters: 40 })).toEqual({
			ok: true,
			gasolineLiters: 29,
			ethanolLiters: 11,
			totalLiters: 40,
			totalEthanolLiters: 20.3,
			actualPct: 50.7,
		});
	});

	it("arredonda o total pedido", () => {
		expect(calculateBlend({ fuelEthanolPct: 25, targetPct: 100, liters: 45.6 })).toMatchObject({
			ok: true,
			totalLiters: 46,
			ethanolLiters: 46,
		});
	});

	it("parcelas inteiras que sempre somam o total e ficam a menos de 1 ponto do alvo", () => {
		for (const fuel of FUELS) {
			for (const target of PRESET_BLENDS) {
				for (const liters of [5, 12, 33, 45, 50, 63, 80]) {
					const r = calculateBlend({ fuelEthanolPct: fuel.ethanolPct, targetPct: target, liters });
					if (!r.ok) throw new Error("esperava resultado válido");
					expect(Number.isInteger(r.gasolineLiters)).toBe(true);
					expect(Number.isInteger(r.ethanolLiters)).toBe(true);
					expect(r.gasolineLiters + r.ethanolLiters).toBe(liters);
					expect(Math.abs(r.actualPct - target)).toBeLessThan(
						(100 - fuel.ethanolPct) / liters / 2 + 0.1,
					);
				}
			}
		}
	});

	it("E100 é só etanol", () => {
		const r = calculateBlend({ fuelEthanolPct: 32, targetPct: 100, liters: 45 });
		expect(r).toMatchObject({ ok: true, gasolineLiters: 0, ethanolLiters: 45, actualPct: 100 });
	});

	it("alvo igual ao da gasolina é só gasolina", () => {
		const r = calculateBlend({ fuelEthanolPct: 32, targetPct: 32, liters: 45 });
		expect(r).toMatchObject({ ok: true, gasolineLiters: 45, ethanolLiters: 0, actualPct: 32 });
	});

	it("rejeita alvo abaixo do etanol que já está na gasolina", () => {
		expect(calculateBlend({ fuelEthanolPct: 32, targetPct: 30, liters: 40 })).toEqual({
			ok: false,
			reason: "target-below-fuel",
		});
	});

	it.each([0, 0.4, -5, Number.NaN, 1001])("rejeita litros inválidos (%s)", (liters) => {
		expect(calculateBlend({ fuelEthanolPct: 25, targetPct: 85, liters })).toEqual({
			ok: false,
			reason: "invalid-liters",
		});
	});

	it.each([-1, 101, Number.NaN])("rejeita alvo inválido (%s)", (targetPct) => {
		expect(calculateBlend({ fuelEthanolPct: 25, targetPct, liters: 40 })).toEqual({
			ok: false,
			reason: "invalid-target",
		});
	});
});

describe("parseLiters", () => {
	it.each([
		["50", 50],
		["50,5", 50.5],
		["50.5", 50.5],
		[" 42 ", 42],
	])("lê %s", (raw, expected) => {
		expect(parseLiters(raw)).toBe(expected);
	});

	it.each(["", "abc", "1,2,3", "-4", "5e2"])("rejeita %s", (raw) => {
		expect(parseLiters(raw)).toBeNaN();
	});
});

describe("formatLiters", () => {
	it("inteiros sem casa decimal, informativos com até uma", () => {
		expect(formatLiters(10)).toBe("10 L");
		expect(formatLiters(2.5)).toBe("2,5 L");
	});
});
