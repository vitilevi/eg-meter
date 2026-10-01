"use client";

import { EVENTS, PrivacySettingsButton, track } from "@/features/analytics";
import { SITE } from "@/lib/site";

const linkClass =
	"bg-surface border-border text-text hover:text-accent flex h-11 items-center justify-center gap-2 rounded-xl border text-[15px] font-medium transition-colors";

export function SiteFooter() {
	return (
		<footer className="mt-10 flex flex-col gap-5">
			<p className="text-text-muted px-4 text-[13px] leading-snug">
				O etanol hidratado da bomba é considerado 100% etanol. Teores de etanol anidro na gasolina
				conforme a regra vigente: 32% na comum e aditivada (CNPE, desde agosto de 2026) e 25% na
				premium. Use como referência — confira as recomendações do preparador do seu carro.
			</p>

			<nav aria-label="Redes do autor" className="grid grid-cols-2 gap-3">
				<a
					href={SITE.links.linkedin}
					target="_blank"
					rel="noopener noreferrer"
					onClick={() => track(EVENTS.clickLinkedin)}
					className={linkClass}
				>
					<LinkedinIcon />
					LinkedIn
				</a>
				<a
					href={SITE.links.github}
					target="_blank"
					rel="noopener noreferrer"
					onClick={() => track(EVENTS.clickGithub)}
					className={linkClass}
				>
					<GithubIcon />
					GitHub
				</a>
			</nav>

			<div className="text-text-muted flex items-center justify-between px-4 text-[13px]">
				<span>Feito por {SITE.author}</span>
				<PrivacySettingsButton className="hover:text-accent underline-offset-2 hover:underline" />
			</div>
		</footer>
	);
}

function LinkedinIcon() {
	return (
		<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
			<path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
		</svg>
	);
}

function GithubIcon() {
	return (
		<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
			<path d="M12 .3a12 12 0 0 0-3.8 23.38c.6.12.83-.26.83-.57L9 21.07c-3.34.72-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.08-.74.09-.73.09-.73 1.2.09 1.83 1.24 1.83 1.24 1.07 1.83 2.81 1.3 3.5 1 .1-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.14-.3-.54-1.52.1-3.18 0 0 1-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.28-1.55 3.29-1.23 3.29-1.23.64 1.66.24 2.88.12 3.18a4.65 4.65 0 0 1 1.23 3.22c0 4.61-2.8 5.63-5.48 5.92.42.36.81 1.1.81 2.22l-.01 3.29c0 .31.2.69.82.57A12 12 0 0 0 12 .3" />
		</svg>
	);
}
