import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	buildThemeCookie,
	persistTheme,
	THEME_STORAGE_KEY,
	themeInitScript,
} from "@/features/theme/lib/theme";

function runInitScript() {
	// biome-ignore lint/security/noGlobalEval: executar o script testado é o objetivo
	eval(themeInitScript);
}

function setCookie(value: string) {
	// biome-ignore lint/suspicious/noDocumentCookie: semeando o cookie testado
	document.cookie = value;
}

beforeEach(() => {
	document.documentElement.removeAttribute("data-theme");
	setCookie(`${THEME_STORAGE_KEY}=; max-age=0; path=/`);
});

describe("themeInitScript", () => {
	it("começa claro na primeira visita, mesmo com o sistema escuro", () => {
		const matchMedia = vi.fn(() => ({ matches: true }));
		vi.stubGlobal("matchMedia", matchMedia);
		runInitScript();
		expect(document.documentElement.getAttribute("data-theme")).toBe("light");
		vi.unstubAllGlobals();
	});

	it("usa a escolha salva no localStorage", () => {
		localStorage.setItem(THEME_STORAGE_KEY, "dark");
		runInitScript();
		expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
	});

	it("o cookie compartilhado com o portfólio vence o localStorage", () => {
		localStorage.setItem(THEME_STORAGE_KEY, "light");
		setCookie(`${THEME_STORAGE_KEY}=dark; path=/`);
		runInitScript();
		expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
	});

	it("ignora valores inválidos", () => {
		setCookie(`${THEME_STORAGE_KEY}=roxo; path=/`);
		localStorage.setItem(THEME_STORAGE_KEY, "verde");
		runInitScript();
		expect(document.documentElement.getAttribute("data-theme")).toBe("light");
	});

	it("aguenta o localStorage lançando erro", () => {
		const getItem = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
			throw new Error("negado");
		});
		expect(() => runInitScript()).not.toThrow();
		expect(document.documentElement.getAttribute("data-theme")).toBe("light");
		getItem.mockRestore();
	});
});

describe("persistTheme", () => {
	it("grava cookie e localStorage", () => {
		persistTheme("dark");
		expect(document.cookie).toContain(`${THEME_STORAGE_KEY}=dark`);
		expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
	});
});

describe("buildThemeCookie", () => {
	it("usa o domínio pai em victorfaria.dev e subdomínios", () => {
		for (const host of ["victorfaria.dev", "egmeter.victorfaria.dev"]) {
			expect(buildThemeCookie("dark", host)).toBe(
				`${THEME_STORAGE_KEY}=dark; path=/; max-age=31536000; SameSite=Lax; domain=victorfaria.dev; Secure`,
			);
		}
	});

	it("fica restrito ao host em localhost e previews", () => {
		for (const host of ["localhost", "eg-meter.vercel.app", "evilvictorfaria.dev"]) {
			expect(buildThemeCookie("light", host)).toBe(
				`${THEME_STORAGE_KEY}=light; path=/; max-age=31536000; SameSite=Lax`,
			);
		}
	});
});
