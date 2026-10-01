import { Analytics } from "@vercel/analytics/next";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { ConsentBanner } from "@/features/analytics";
import { ServiceWorkerRegister } from "@/features/pwa";
import { THEME_COLORS, themeInitScript } from "@/features/theme";
import { SITE } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
	metadataBase: new URL(SITE.url),
	title: `${SITE.name} — mistura de etanol e gasolina`,
	description: SITE.description,
	applicationName: SITE.name,
	authors: [{ name: SITE.author, url: SITE.links.github }],
	appleWebApp: {
		capable: true,
		title: SITE.name,
		statusBarStyle: "default",
	},
	formatDetection: { telephone: false },
	openGraph: {
		type: "website",
		locale: "pt_BR",
		url: SITE.url,
		siteName: SITE.name,
		title: SITE.name,
		description: SITE.description,
	},
};

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
	viewportFit: "cover",
	themeColor: [
		{ media: "(prefers-color-scheme: light)", color: THEME_COLORS.light },
		{ media: "(prefers-color-scheme: dark)", color: THEME_COLORS.dark },
	],
};

export default function RootLayout({ children }: { children: ReactNode }) {
	return (
		<html lang="pt-BR" suppressHydrationWarning>
			<head>
				{/* Bloqueante de propósito: precisa rodar antes da primeira pintura
				    para não piscar o tema errado. */}
				<script
					// biome-ignore lint/security/noDangerouslySetInnerHtml: constante de build, sem entrada do usuário
					dangerouslySetInnerHTML={{ __html: themeInitScript }}
				/>
			</head>
			<body>
				{children}
				<ConsentBanner />
				<ServiceWorkerRegister />
				<Analytics />
			</body>
		</html>
	);
}
