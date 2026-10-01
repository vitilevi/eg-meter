import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	ConsentBanner,
	PrivacySettingsButton,
} from "@/features/analytics/components/consent-banner";
import { CONSENT_STORAGE_KEY } from "@/features/analytics/lib/consent";

vi.mock("@/features/analytics/lib/firebase", () => ({
	enableFirebaseAnalytics: vi.fn(),
	disableFirebaseAnalytics: vi.fn(),
}));

describe("ConsentBanner", () => {
	beforeEach(() => {
		localStorage.clear();
		// biome-ignore lint/suspicious/noDocumentCookie: limpa o cookie compartilhado entre testes
		document.cookie = `${CONSENT_STORAGE_KEY}=; max-age=0; path=/`;
	});

	it("aparece na primeira visita e some ao aceitar", async () => {
		const user = userEvent.setup();
		render(<ConsentBanner />);

		await user.click(screen.getByRole("button", { name: "Aceitar" }));

		expect(localStorage.getItem(CONSENT_STORAGE_KEY)).toBe("granted");
		expect(screen.queryByText("Podemos contar sua visita?")).not.toBeInTheDocument();
	});

	it("guarda a recusa", async () => {
		const user = userEvent.setup();
		render(<ConsentBanner />);

		await user.click(screen.getByRole("button", { name: "Recusar" }));

		expect(localStorage.getItem(CONSENT_STORAGE_KEY)).toBe("denied");
		expect(screen.queryByText("Podemos contar sua visita?")).not.toBeInTheDocument();
	});

	it("não aparece se a escolha já foi feita", () => {
		localStorage.setItem(CONSENT_STORAGE_KEY, "denied");
		render(<ConsentBanner />);
		expect(screen.queryByText("Podemos contar sua visita?")).not.toBeInTheDocument();
	});

	// O objetivo do cookie compartilhado: quem respondeu no portfólio não é
	// perguntado de novo aqui.
	it("não aparece se a escolha foi feita em outro site do domínio", () => {
		// biome-ignore lint/suspicious/noDocumentCookie: simula o cookie gravado por victorfaria.dev
		document.cookie = `${CONSENT_STORAGE_KEY}=granted; path=/`;
		render(<ConsentBanner />);
		expect(screen.queryByText("Podemos contar sua visita?")).not.toBeInTheDocument();
	});

	it("volta pelo botão Privacidade", async () => {
		localStorage.setItem(CONSENT_STORAGE_KEY, "granted");
		const user = userEvent.setup();
		render(
			<>
				<ConsentBanner />
				<PrivacySettingsButton />
			</>,
		);

		await user.click(screen.getByRole("button", { name: "Privacidade" }));

		expect(screen.getByText("Podemos contar sua visita?")).toBeInTheDocument();
		expect(localStorage.getItem(CONSENT_STORAGE_KEY)).toBeNull();
	});
});
