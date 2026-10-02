import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Calculator } from "@/features/calculator/components/calculator";

vi.mock("@/features/analytics", () => ({
	EVENTS: { fuelSelect: "fuel_select", blendSelect: "blend_select", calculate: "calculate" },
	track: vi.fn(),
}));

const { track } = await import("@/features/analytics");

function slider() {
	return screen.getByRole("slider", { name: "Mistura" });
}

function result() {
	return screen.getByRole("region", { name: "Resultado" });
}

describe("Calculator", () => {
	it("mostra o teor de etanol do combustível escolhido", async () => {
		const user = userEvent.setup();
		render(<Calculator />);

		expect(screen.getByRole("radio", { name: /Premium.*25% etanol/ })).toBeChecked();
		expect(screen.getByRole("radio", { name: /Comum.*32% etanol/ })).not.toBeChecked();
		await user.click(screen.getByRole("radio", { name: /Comum/ }));
		expect(track).toHaveBeenCalledWith("fuel_select", { fuel: "comum" });
	});

	it("calcula E85 com premium em 50 L", async () => {
		const user = userEvent.setup();
		render(<Calculator />);

		await user.type(screen.getByLabelText("Total de litros que vão entrar no tanque"), "50");

		const box = within(result());
		expect(box.getByText("Total 50 L · E85")).toBeInTheDocument();
		expect(box.getByText("10 L")).toBeInTheDocument();
		expect(box.getByText("40 L")).toBeInTheDocument();
		expect(box.queryByText(/mistura real/)).not.toBeInTheDocument();
	});

	it("resultado em litros inteiros, com a mistura real quando o arredondamento desloca", async () => {
		const user = userEvent.setup();
		render(<Calculator />);

		await user.click(screen.getByRole("radio", { name: /Comum/ }));
		fireEvent.change(slider(), { target: { value: "50" } });
		await user.type(screen.getByLabelText("Total de litros que vão entrar no tanque"), "40");

		const box = within(result());
		expect(box.getByText("29 L")).toBeInTheDocument();
		expect(box.getByText("11 L")).toBeInTheDocument();
		expect(box.getByText(/mistura real E50,7/)).toBeInTheDocument();
	});

	it("só aceita dígitos nos litros", async () => {
		const user = userEvent.setup();
		render(<Calculator />);

		const field = screen.getByLabelText("Total de litros que vão entrar no tanque");
		await user.type(field, "45,5");
		expect(field).toHaveValue("455");
	});

	it("começa em E85", () => {
		render(<Calculator />);
		expect(slider()).toHaveValue("85");
		expect(screen.getByText("E85", { selector: "output" })).toBeInTheDocument();
	});

	it("o mínimo do slider é o etanol que já vem na gasolina", async () => {
		const user = userEvent.setup();
		render(<Calculator />);

		expect(slider()).toHaveAttribute("min", "25");
		fireEvent.change(slider(), { target: { value: "28" } });
		expect(slider()).toHaveValue("28");

		// Trocar para a comum (32%) puxa a mistura para o novo mínimo.
		await user.click(screen.getByRole("radio", { name: /Comum/ }));
		expect(slider()).toHaveAttribute("min", "32");
		expect(slider()).toHaveValue("32");
	});

	it("os botões − e + ajustam de 1 em 1", async () => {
		const user = userEvent.setup();
		render(<Calculator />);

		await user.click(screen.getByRole("button", { name: "Aumentar mistura" }));
		expect(slider()).toHaveValue("86");
		await user.click(screen.getByRole("button", { name: "Diminuir mistura" }));
		await user.click(screen.getByRole("button", { name: "Diminuir mistura" }));
		expect(slider()).toHaveValue("84");
	});

	it("não deixa passar de E100", () => {
		render(<Calculator />);
		fireEvent.change(slider(), { target: { value: "100" } });
		expect(screen.getByRole("button", { name: "Aumentar mistura" })).toBeDisabled();
	});

	it("pede os litros antes de calcular", () => {
		render(<Calculator />);
		expect(
			within(result()).getByText("Informe os litros para ver quanto colocar de cada um."),
		).toBeInTheDocument();
	});
});
