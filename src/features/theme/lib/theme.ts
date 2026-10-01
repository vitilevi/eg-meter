export type Theme = "dark" | "light";

/** Mesma chave do portfólio: a escolha vale para todos os sites do domínio. */
export const THEME_STORAGE_KEY = "vf-theme";

/** Claro é o padrão da marca, independente do sistema — igual ao portfólio. */
export const DEFAULT_THEME: Theme = "light";

/** Cor da barra de status / UI do navegador, igual ao fundo de cada tema. */
export const THEME_COLORS: Record<Theme, string> = {
	light: "#faf9f6",
	dark: "#0a0a0f",
};

/**
 * A escolha também vai num cookie do domínio pai, para que victorfaria.dev e
 * egmeter.victorfaria.dev compartilhem o tema — o localStorage é por origem.
 * O cookie vence o localStorage; o localStorage fica de reserva (visitas
 * antigas e localhost, onde o cookie do domínio pai não se aplica).
 * Espelha `buildThemeCookie` do portfólio: mudou lá, muda aqui.
 */
export const SHARED_COOKIE_DOMAIN = "victorfaria.dev";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export function buildThemeCookie(theme: Theme, hostname: string): string {
	const shared = hostname === SHARED_COOKIE_DOMAIN || hostname.endsWith(`.${SHARED_COOKIE_DOMAIN}`);
	const scope = shared ? `; domain=${SHARED_COOKIE_DOMAIN}; Secure` : "";
	return `${THEME_STORAGE_KEY}=${theme}; path=/; max-age=${ONE_YEAR_SECONDS}; SameSite=Lax${scope}`;
}

/**
 * Roda antes da primeira pintura, inline no <head>: cookie compartilhado →
 * localStorage → claro. O try/catch existe porque o localStorage pode falhar
 * em navegação privada.
 */
export const themeInitScript = `(function(){var d=document.documentElement,k='${THEME_STORAGE_KEY}',c=${JSON.stringify(THEME_COLORS)},t=null;function a(t){d.setAttribute('data-theme',t);var m=document.querySelectorAll('meta[name="theme-color"]');for(var i=0;i<m.length;i++){m[i].setAttribute('content',c[t])}}var p=document.cookie.split('; ');for(var i=0;i<p.length;i++){if(p[i].indexOf(k+'=')===0){t=p[i].slice(k.length+1)}}if(t!=='dark'&&t!=='light'){try{t=localStorage.getItem(k)}catch(e){t=null}}if(t!=='dark'&&t!=='light'){t='${DEFAULT_THEME}'}a(t);document.addEventListener('DOMContentLoaded',function(){a(d.getAttribute('data-theme'))})})();`;

export function applyTheme(theme: Theme): void {
	document.documentElement.setAttribute("data-theme", theme);
	for (const meta of document.querySelectorAll('meta[name="theme-color"]')) {
		meta.setAttribute("content", THEME_COLORS[theme]);
	}
}

export function readTheme(): Theme {
	return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}

export function persistTheme(theme: Theme): void {
	// biome-ignore lint/suspicious/noDocumentCookie: Cookie Store API ainda falta em Safari antigo
	document.cookie = buildThemeCookie(theme, window.location.hostname);
	try {
		localStorage.setItem(THEME_STORAGE_KEY, theme);
	} catch {
		// Navegação privada pode recusar a escrita: o cookie ainda guarda a escolha.
	}
}
