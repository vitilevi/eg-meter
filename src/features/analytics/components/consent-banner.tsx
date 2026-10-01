"use client";

import { useEffect, useSyncExternalStore } from "react";
import {
	type Consent,
	readConsent,
	subscribeToConsent,
	writeConsent,
} from "@/features/analytics/lib/consent";
import {
	disableFirebaseAnalytics,
	enableFirebaseAnalytics,
} from "@/features/analytics/lib/firebase";

/** `undefined` = ainda no servidor / antes da hidratação: não mostra nada. */
function useConsent(): Consent | null | undefined {
	return useSyncExternalStore<Consent | null | undefined>(
		subscribeToConsent,
		readConsent,
		() => undefined,
	);
}

/**
 * Banner de consentimento + liga/desliga do Firebase Analytics. O Firebase só
 * é carregado depois do aceite; a Vercel Analytics, sem cookies, independe
 * desta escolha.
 */
export function ConsentBanner() {
	const consent = useConsent();

	useEffect(() => {
		if (process.env.NODE_ENV !== "production") return;
		if (consent === "granted") void enableFirebaseAnalytics();
		if (consent === "denied") void disableFirebaseAnalytics();
	}, [consent]);

	if (consent !== null) return null;

	return (
		<section
			aria-labelledby="consent-title"
			className="fixed inset-x-0 bottom-0 z-50 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
		>
			<div className="bg-surface/90 border-border mx-auto max-w-lg rounded-3xl border p-5 shadow-[0_8px_40px_rgba(0,0,0,0.12)] backdrop-blur-xl">
				<h2 id="consent-title" className="text-text text-[17px] font-semibold">
					Podemos contar sua visita?
				</h2>
				<p className="text-text-muted mt-1.5 text-[15px] leading-snug">
					Usamos o Google Analytics (Firebase) para medir, de forma anônima, quantas pessoas usam o
					eg-meter. A escolha vale para todos os sites em victorfaria.dev, e você pode mudar de
					ideia quando quiser em “Privacidade”, no rodapé.
				</p>
				<div className="mt-4 grid grid-cols-2 gap-3">
					<button
						type="button"
						onClick={() => writeConsent("denied")}
						className="bg-fill text-text h-11 rounded-xl text-[17px] font-medium transition-opacity active:opacity-70"
					>
						Recusar
					</button>
					<button
						type="button"
						onClick={() => writeConsent("granted")}
						className="bg-accent text-on-accent h-11 rounded-xl text-[17px] font-semibold transition-opacity active:opacity-70"
					>
						Aceitar
					</button>
				</div>
			</div>
		</section>
	);
}

/** Apaga a escolha para o banner voltar. Fica no rodapé. */
export function PrivacySettingsButton({ className }: { className?: string }) {
	return (
		<button type="button" onClick={() => writeConsent(null)} className={className}>
			Privacidade
		</button>
	);
}
