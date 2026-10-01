import { track as vercelTrack } from "@vercel/analytics";
import { readConsent } from "@/features/analytics/lib/consent";
import { logFirebaseEvent } from "@/features/analytics/lib/firebase";

/**
 * Único ponto do app que fala com fornecedores de analytics. Componentes
 * chamam `track(EVENTS.x)` e não conhecem SDK nenhum.
 *
 * - Vercel Analytics: sem cookies, sempre ativo.
 * - Firebase Analytics: só depois do aceite no banner de consentimento.
 */
export const EVENTS = {
	fuelSelect: "fuel_select",
	blendSelect: "blend_select",
	calculate: "calculate",
	clickLinkedin: "click_linkedin",
	clickGithub: "click_github",
	themeToggle: "theme_toggle",
} as const;

export type EventName = (typeof EVENTS)[keyof typeof EVENTS];

/** Só metadados não identificáveis. Nunca identificador do visitante ou texto livre. */
export type EventProps = Record<string, string | number | boolean | null>;

export function track(event: EventName, props?: EventProps): void {
	// Desenvolvimento nunca chega aos coletores — cliques locais não podem
	// sujar os dados de produção. Loga para dar para conferir a instrumentação.
	if (process.env.NODE_ENV !== "production") {
		console.info("[analytics] %s", event, props ?? {}, `consent=${readConsent()}`);
		return;
	}

	try {
		vercelTrack(event, props);
	} catch {
		// Fire-and-forget: analytics nunca pode atrapalhar a interação.
	}

	if (readConsent() === "granted") {
		void logFirebaseEvent(event, props).catch(() => {});
	}
}
