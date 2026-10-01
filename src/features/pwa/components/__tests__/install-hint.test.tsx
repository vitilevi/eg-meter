import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { InstallHint } from "@/features/pwa/components/install-hint";
import { INSTALL_DISMISSED_KEY, isIos } from "@/features/pwa/lib/install";

vi.mock("@/features/analytics", () => ({
	EVENTS: { installClick: "install_click", installDismiss: "install_dismiss" },
	track: vi.fn(),
}));

const IPHONE_UA =
	"Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1";

function stubBrowser({ ua, standalone = false }: { ua: string; standalone?: boolean }) {
	vi.spyOn(navigator, "userAgent", "get").mockReturnValue(ua);
	vi.stubGlobal(
		"matchMedia",
		vi.fn((query: string) => ({
			matches: standalone && query.includes("standalone"),
			media: query,
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
		})),
	);
}

afterEach(() => {
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
});

describe("isIos", () => {
	it("reconhece iPhone e iPad (inclusive iPadOS se passando por Mac)", () => {
		expect(isIos(IPHONE_UA, 5)).toBe(true);
		expect(isIos("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", 5)).toBe(true);
	});

	it("não confunde Mac e Android", () => {
		expect(isIos("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", 0)).toBe(false);
		expect(isIos("Mozilla/5.0 (Linux; Android 15; Pixel 9)", 5)).toBe(false);
	});
});

describe("InstallHint", () => {
	it("no iPhone explica o caminho pelo Compartilhar", () => {
		stubBrowser({ ua: IPHONE_UA });
		render(<InstallHint />);
		expect(screen.getByText("Adicionar à Tela de Início")).toBeInTheDocument();
	});

	it("some quando já está aberto como app", () => {
		stubBrowser({ ua: IPHONE_UA, standalone: true });
		render(<InstallHint />);
		expect(screen.queryByRole("complementary", { name: "Instalar o app" })).toBeNull();
	});

	it("fechar lembra a escolha", async () => {
		stubBrowser({ ua: IPHONE_UA });
		const user = userEvent.setup();
		render(<InstallHint />);

		await user.click(screen.getByRole("button", { name: "Fechar dica de instalação" }));

		expect(screen.queryByRole("complementary", { name: "Instalar o app" })).toBeNull();
		expect(localStorage.getItem(INSTALL_DISMISSED_KEY)).toBe("1");
	});

	it("no Chrome/Android abre o diálogo nativo", async () => {
		stubBrowser({ ua: "Mozilla/5.0 (Linux; Android 15; Pixel 9) Chrome/140" });
		const user = userEvent.setup();
		render(<InstallHint />);
		expect(screen.queryByRole("button", { name: "Instalar" })).toBeNull();

		const prompt = vi.fn().mockResolvedValue(undefined);
		const event = Object.assign(new Event("beforeinstallprompt"), {
			prompt,
			userChoice: Promise.resolve({ outcome: "accepted" as const }),
		});
		act(() => {
			window.dispatchEvent(event);
		});

		await user.click(screen.getByRole("button", { name: "Instalar" }));
		expect(prompt).toHaveBeenCalled();
		expect(screen.queryByRole("button", { name: "Instalar" })).toBeNull();
	});
});
