/** Evento do Chrome/Edge/Android que permite abrir o diálogo de instalação. */
export interface BeforeInstallPromptEvent extends Event {
	prompt(): Promise<void>;
	userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export const INSTALL_DISMISSED_KEY = "egm-install-dismissed";

/** Já aberto como app instalado — não faz sentido sugerir instalar. */
export function isStandalone(): boolean {
	const nav = navigator as Navigator & { standalone?: boolean };
	return nav.standalone === true || window.matchMedia("(display-mode: standalone)").matches;
}

/**
 * iPhone e iPad. O iPadOS se identifica como Mac, então o toque é o que o
 * diferencia de um Mac de verdade.
 */
export function isIos(userAgent: string, maxTouchPoints: number): boolean {
	if (/iPhone|iPad|iPod/.test(userAgent)) return true;
	return /Macintosh/.test(userAgent) && maxTouchPoints > 1;
}

export function wasDismissed(): boolean {
	try {
		return localStorage.getItem(INSTALL_DISMISSED_KEY) === "1";
	} catch {
		return false;
	}
}

export function rememberDismissal(): void {
	try {
		localStorage.setItem(INSTALL_DISMISSED_KEY, "1");
	} catch {
		// Sem storage, a dica só volta na próxima visita.
	}
}
