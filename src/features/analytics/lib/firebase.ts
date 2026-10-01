import type { Analytics } from "firebase/analytics";

/**
 * Configuração web do Firebase. Não é segredo: esses valores identificam o
 * projeto e ficam visíveis no bundle de qualquer app web do Firebase. O acesso
 * é controlado pelos domínios autorizados no console.
 */
const FIREBASE_CONFIG = {
	apiKey: "AIzaSyCXxprfcJQpZ0cCRjgDKg6TL2_IZ2azOdU",
	authDomain: "eg-meter.firebaseapp.com",
	projectId: "eg-meter",
	storageBucket: "eg-meter.firebasestorage.app",
	messagingSenderId: "868164898808",
	appId: "1:868164898808:web:16396e4c5e96689282d00d",
	measurementId: "G-TXMMVME9J8",
};

let analyticsPromise: Promise<Analytics | null> | null = null;

/**
 * Carrega o SDK sob demanda: nada do Firebase é baixado, e nenhum cookie é
 * gravado, antes do aceite no banner. Chamadas repetidas reaproveitam a mesma
 * instância.
 */
function loadAnalytics(): Promise<Analytics | null> {
	analyticsPromise ??= (async () => {
		try {
			const [{ getApps, initializeApp }, analytics] = await Promise.all([
				import("firebase/app"),
				import("firebase/analytics"),
			]);
			if (!(await analytics.isSupported())) return null;
			const app = getApps()[0] ?? initializeApp(FIREBASE_CONFIG);
			return analytics.getAnalytics(app);
		} catch {
			return null;
		}
	})();
	return analyticsPromise;
}

export async function enableFirebaseAnalytics(): Promise<void> {
	const instance = await loadAnalytics();
	if (!instance) return;
	const { setAnalyticsCollectionEnabled } = await import("firebase/analytics");
	setAnalyticsCollectionEnabled(instance, true);
}

/** Só age se o SDK já foi carregado nesta visita — recusar nunca baixa o SDK. */
export async function disableFirebaseAnalytics(): Promise<void> {
	if (!analyticsPromise) return;
	const instance = await analyticsPromise;
	if (!instance) return;
	const { setAnalyticsCollectionEnabled } = await import("firebase/analytics");
	setAnalyticsCollectionEnabled(instance, false);
}

export async function logFirebaseEvent(
	name: string,
	params?: Record<string, string | number | boolean | null>,
): Promise<void> {
	const instance = await loadAnalytics();
	if (!instance) return;
	const { logEvent } = await import("firebase/analytics");
	logEvent(instance, name, params ?? undefined);
}
