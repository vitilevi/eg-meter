export type Theme = "dark" | "light";

export const THEME_STORAGE_KEY = "egm-theme";

/** Cor da barra de status / UI do navegador, igual ao fundo de cada tema. */
export const THEME_COLORS: Record<Theme, string> = {
	light: "#faf9f6",
	dark: "#0a0a0f",
};

/**
 * Roda antes da primeira pintura, inline no <head>. Sem escolha salva, segue o
 * sistema — e continua seguindo se o sistema mudar com a página aberta. Uma
 * escolha explícita no seletor vence sempre. O try/catch existe porque o
 * localStorage pode falhar em navegação privada.
 */
export const themeInitScript = `(function(){var d=document.documentElement,k='${THEME_STORAGE_KEY}',c=${JSON.stringify(THEME_COLORS)};function a(t){d.setAttribute('data-theme',t);var m=document.querySelectorAll('meta[name="theme-color"]');for(var i=0;i<m.length;i++){m[i].setAttribute('content',c[t])}}function s(){try{var v=localStorage.getItem(k);return v==='dark'||v==='light'?v:null}catch(e){return null}}var q=window.matchMedia('(prefers-color-scheme: dark)');a(s()||(q.matches?'dark':'light'));q.addEventListener('change',function(e){if(!s())a(e.matches?'dark':'light')});document.addEventListener('DOMContentLoaded',function(){a(d.getAttribute('data-theme'))})})();`;

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
	try {
		localStorage.setItem(THEME_STORAGE_KEY, theme);
	} catch {
		// Navegação privada pode recusar a escrita: o tema vale só nesta visita.
	}
}
