export type Consent = "granted" | "denied";

export const CONSENT_STORAGE_KEY = "egm-analytics-consent";

const CHANGE_EVENT = "egm-consent-change";

export function readConsent(): Consent | null {
	try {
		const value = localStorage.getItem(CONSENT_STORAGE_KEY);
		return value === "granted" || value === "denied" ? value : null;
	} catch {
		return null;
	}
}

/** `null` apaga a escolha e faz o banner aparecer de novo. */
export function writeConsent(consent: Consent | null): void {
	try {
		if (consent === null) localStorage.removeItem(CONSENT_STORAGE_KEY);
		else localStorage.setItem(CONSENT_STORAGE_KEY, consent);
	} catch {
		// Sem storage a escolha vale só nesta visita — o evento abaixo ainda avisa a UI.
	}
	window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function subscribeToConsent(onChange: () => void): () => void {
	window.addEventListener(CHANGE_EVENT, onChange);
	// Outra aba mudou a escolha.
	window.addEventListener("storage", onChange);
	return () => {
		window.removeEventListener(CHANGE_EVENT, onChange);
		window.removeEventListener("storage", onChange);
	};
}
