import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Calculator } from "@/features/calculator/components/calculator";

vi.mock("@/features/analytics", () => ({
	EVENTS: { fuelSelect: "fuel_select", blendSelect: "blend_select", calculate: "calculate" },
	track: vi.fn(),
}));

const { track } = await import("@/features/analytics");

function result() {
	return screen.getByRole("region", { name: "Resultado" });
}

describe("Calculator", () => {
	it("mostra o teor de etanol do combustível escolhido", async () => {
		const user = userEvent.setup();
		render(<Calculator />);

		expect(screen.getByText("Contém 25% de etanol anidro na composição.")).toBeInTheDocument();
		await user.click(screen.getByRole("radio", { name: "Comum" }));
		expect(screen.getByText("Contém 32% de etanol anidro na composição.")).toBeInTheDocument();
		expect(track).toHaveBeenCalledWith("fuel_select", { fuel: "comum" });
	});

	it("calcula E85 com premium em 50 L", async () => {
		const user = userEvent.setup();
		render(<Calculator />);

		await user.type(screen.getByLabelText("Total de litros que vão entrar no tanque"), "50");

		const box = within(result());
		expect(box.getByText("Para chegar em E85")).toBeInTheDocument();
		expect(box.getByText("10 L")).toBeInTheDocument();
		expect(box.getByText("40 L")).toBeInTheDocument();
		expect(box.queryByText(/mistura fica em/)).not.toBeInTheDocument();
	});

	it("resultado em litros inteiros, com a mistura real quando o arredondamento desloca", async () => {
		const user = userEvent.setup();
		render(<Calculator />);

		await user.click(screen.getByRole("radio", { name: "Comum" }));
		await user.click(screen.getByRole("radio", { name: "E50" }));
		await user.type(screen.getByLabelText("Total de litros que vão entrar no tanque"), "40");

		const box = within(result());
		expect(box.getByText("29 L")).toBeInTheDocument();
		expect(box.getByText("11 L")).toBeInTheDocument();
		expect(box.getByText(/mistura fica em E50,7/)).toBeInTheDocument();
	});

	it("só aceita dígitos nos litros", async () => {
		const user = userEvent.setup();
		render(<Calculator />);

		const field = screen.getByLabelText("Total de litros que vão entrar no tanque");
		await user.type(field, "45,5");
		expect(field).toHaveValue("455");
	});

	it("avisa quando a mistura personalizada fica abaixo do etanol da gasolina", async () => {
		const user = userEvent.setup();
		render(<Calculator />);

		await user.click(screen.getByRole("radio", { name: "Comum" }));
		await user.click(screen.getByRole("radio", { name: "Outro" }));
		await user.type(screen.getByLabelText("Percentual de etanol (32% a 100%)"), "30");

		expect(within(result()).getByText("E30 não é possível com essa gasolina")).toBeInTheDocument();
	});

	it("pede os litros antes de calcular", () => {
		render(<Calculator />);
		expect(within(result()).getByText("Quanto de cada um?")).toBeInTheDocument();
	});
});
