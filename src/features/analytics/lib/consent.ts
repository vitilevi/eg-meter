export type Consent = "granted" | "denied";

/**
 * Mesma chave do portfólio, num cookie do domínio pai: aceitar ou recusar em
 * victorfaria.dev vale aqui, e vice-versa — o localStorage é por origem.
 * Espelha `features/analytics/lib/consent.ts` do portfólio: mudou lá, muda aqui.
 */
export const CONSENT_STORAGE_KEY = "vf-analytics-consent";

const SHARED_COOKIE_DOMAIN = "victorfaria.dev";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

const CHANGE_EVENT = "egm-consent-change";

function isSharedHost(hostname: string): boolean {
	return hostname === SHARED_COOKIE_DOMAIN || hostname.endsWith(`.${SHARED_COOKIE_DOMAIN}`);
}

/** `maxAge: 0` apaga o cookie — precisa repetir o mesmo domínio. */
export function buildConsentCookie(value: string, hostname: string, maxAge = ONE_YEAR_SECONDS) {
	const scope = isSharedHost(hostname) ? `; domain=${SHARED_COOKIE_DOMAIN}; Secure` : "";
	return `${CONSENT_STORAGE_KEY}=${value}; path=/; max-age=${maxAge}; SameSite=Lax${scope}`;
}

function parse(value: string | null | undefined): Consent | null {
	return value === "granted" || value === "denied" ? value : null;
}

function readCookie(): string | null {
	for (const pair of document.cookie.split("; ")) {
		if (pair.startsWith(`${CONSENT_STORAGE_KEY}=`))
			return pair.slice(CONSENT_STORAGE_KEY.length + 1);
	}
	return null;
}

/** O cookie vence: é o que todos os sites escrevem. O localStorage fica para o localhost. */
export function readConsent(): Consent | null {
	const fromCookie = parse(readCookie());
	if (fromCookie) return fromCookie;
	try {
		return parse(localStorage.getItem(CONSENT_STORAGE_KEY));
	} catch {
		return null;
	}
}

/** `null` apaga a escolha e faz o banner aparecer de novo. */
export function writeConsent(consent: Consent | null): void {
	const { hostname } = window.location;
	// biome-ignore lint/suspicious/noDocumentCookie: Cookie Store API ainda falta em Safari antigo
	document.cookie =
		consent === null ? buildConsentCookie("", hostname, 0) : buildConsentCookie(consent, hostname);
	try {
		if (consent === null) localStorage.removeItem(CONSENT_STORAGE_KEY);
		else localStorage.setItem(CONSENT_STORAGE_KEY, consent);
	} catch {
		// Navegação privada pode recusar a escrita: o cookie ainda guarda a escolha.
	}
	if (consent === "denied") clearGoogleAnalyticsCookies(hostname);
	window.dispatchEvent(new Event(CHANGE_EVENT));
}

/**
 * O gtag/Firebase grava `_ga` e `_ga_<id>` no domínio pai, então eles
 * sobreviveriam a uma recusa feita em qualquer um dos sites. Recusar apaga.
 */
function clearGoogleAnalyticsCookies(hostname: string): void {
	const domain = isSharedHost(hostname) ? `; domain=${SHARED_COOKIE_DOMAIN}` : "";
	for (const pair of document.cookie.split("; ")) {
		const name = pair.slice(0, pair.indexOf("="));
		if (name === "_ga" || name.startsWith("_ga_")) {
			// biome-ignore lint/suspicious/noDocumentCookie: Cookie Store API ainda falta em Safari antigo
			document.cookie = `${name}=; path=/; max-age=0${domain}`;
		}
	}
}

export function subscribeToConsent(onChange: () => void): () => void {
	window.addEventListener(CHANGE_EVENT, onChange);
	// Outra aba desta origem mudou a escolha.
	window.addEventListener("storage", onChange);
	// Uma aba de outro subdomínio pode ter mudado o cookie, e isso não dispara
	// evento nenhum — relê quando a pessoa volta para esta aba.
	window.addEventListener("focus", onChange);
	return () => {
		window.removeEventListener(CHANGE_EVENT, onChange);
		window.removeEventListener("storage", onChange);
		window.removeEventListener("focus", onChange);
	};
}
