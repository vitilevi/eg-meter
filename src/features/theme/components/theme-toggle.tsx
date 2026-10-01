"use client";

import { useSyncExternalStore } from "react";
import { EVENTS, track } from "@/features/analytics";
import { applyTheme, persistTheme, readTheme, type Theme } from "@/features/theme/lib/theme";

/**
 * O atributo `data-theme` é a fonte da verdade — o script do <head> o define
 * antes do React existir. O MutationObserver mantém o React em sincronia sem
 * duplicar esse estado.
 */
function subscribe(onChange: () => void) {
	const observer = new MutationObserver(onChange);
	observer.observe(document.documentElement, {
		attributes: true,
		attributeFilter: ["data-theme"],
	});
	return () => observer.disconnect();
}

export function ThemeToggle() {
	const theme = useSyncExternalStore<Theme | null>(subscribe, readTheme, () => null);

	function toggle() {
		const next: Theme = readTheme() === "dark" ? "light" : "dark";
		applyTheme(next);
		persistTheme(next);
		track(EVENTS.themeToggle, { theme: next });
	}

	const label =
		theme === null ? "Alternar tema" : theme === "dark" ? "Usar tema claro" : "Usar tema escuro";

	return (
		<button
			type="button"
			onClick={toggle}
			aria-label={label}
			title={label}
			className="bg-surface text-text border-border hover:text-accent grid h-10 w-10 place-items-center rounded-full border transition-colors"
		>
			{theme === "dark" ? <SunIcon /> : <MoonIcon />}
		</button>
	);
}

function MoonIcon() {
	return (
		<svg
			width="18"
			height="18"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.8"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
		</svg>
	);
}

function SunIcon() {
	return (
		<svg
			width="18"
			height="18"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.8"
			strokeLinecap="round"
			aria-hidden="true"
		>
			<circle cx="12" cy="12" r="4" />
			<path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
		</svg>
	);
}
