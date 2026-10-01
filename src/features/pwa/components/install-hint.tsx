"use client";

import Image from "next/image";
import { useEffect, useState, useSyncExternalStore } from "react";
import { EVENTS, track } from "@/features/analytics";
import {
	type BeforeInstallPromptEvent,
	isIos,
	isStandalone,
	rememberDismissal,
	wasDismissed,
} from "@/features/pwa/lib/install";

type Mode =
	| { kind: "hidden" }
	| { kind: "ios" }
	| { kind: "prompt"; event: BeforeInstallPromptEvent };

type Eligibility = "none" | "ios" | "other";

/** Nada a observar: plataforma e modo de exibição não mudam com a página aberta. */
function subscribeNoop() {
	return () => {};
}

function readEligibility(): Eligibility {
	if (isStandalone() || wasDismissed()) return "none";
	return isIos(navigator.userAgent, navigator.maxTouchPoints) ? "ios" : "other";
}

/**
 * Dica para instalar o app na tela de início.
 *
 * - Chrome/Edge/Android: captura o `beforeinstallprompt` e oferece um botão
 *   que abre o diálogo nativo.
 * - iOS: o Safari não tem evento nem ícone de instalação — só o menu
 *   Compartilhar → “Adicionar à Tela de Início”. Então explicamos o caminho.
 *
 * Some se o app já está instalado ou se a pessoa fechou a dica.
 */
export function InstallHint() {
	const eligibility = useSyncExternalStore<Eligibility>(
		subscribeNoop,
		readEligibility,
		() => "none",
	);
	const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
	const [closed, setClosed] = useState(false);

	useEffect(() => {
		if (eligibility !== "other") return;
		function onBeforeInstall(event: Event) {
			event.preventDefault();
			setPromptEvent(event as BeforeInstallPromptEvent);
		}
		function onInstalled() {
			setClosed(true);
		}
		window.addEventListener("beforeinstallprompt", onBeforeInstall);
		window.addEventListener("appinstalled", onInstalled);
		return () => {
			window.removeEventListener("beforeinstallprompt", onBeforeInstall);
			window.removeEventListener("appinstalled", onInstalled);
		};
	}, [eligibility]);

	const mode: Mode = closed
		? { kind: "hidden" }
		: eligibility === "ios"
			? { kind: "ios" }
			: eligibility === "other" && promptEvent
				? { kind: "prompt", event: promptEvent }
				: { kind: "hidden" };

	if (mode.kind === "hidden") return null;

	function dismiss() {
		rememberDismissal();
		track(EVENTS.installDismiss, { platform: mode.kind });
		setClosed(true);
	}

	async function install(event: BeforeInstallPromptEvent) {
		track(EVENTS.installClick, { platform: "prompt" });
		await event.prompt();
		const { outcome } = await event.userChoice;
		if (outcome === "accepted") setClosed(true);
	}

	return (
		<aside
			aria-label="Instalar o app"
			className="bg-surface border-border mt-5 flex items-start gap-3 rounded-2xl border p-4"
		>
			<Image src="/icons/icon-192.png" alt="" width={40} height={40} className="rounded-[10px]" />
			<div className="flex-1">
				<p className="text-text text-[15px] font-semibold">Use como app</p>
				{mode.kind === "ios" ? (
					<p className="text-text-muted mt-0.5 text-[13px] leading-snug">
						No Safari, toque em <ShareIcon /> <strong className="text-text">Compartilhar</strong>{" "}
						(no iOS 26 ele fica no menu <strong className="text-text">•••</strong>) e escolha{" "}
						<strong className="text-text">Adicionar à Tela de Início</strong>.
					</p>
				) : (
					<>
						<p className="text-text-muted mt-0.5 text-[13px] leading-snug">
							Instale o eg-meter e abra direto da tela de início, até sem internet.
						</p>
						<button
							type="button"
							onClick={() => void install(mode.event)}
							className="bg-accent text-on-accent mt-3 h-9 rounded-lg px-4 text-[15px] font-semibold transition-opacity active:opacity-70 cursor-pointer"
						>
							Instalar
						</button>
					</>
				)}
			</div>
			<button
				type="button"
				onClick={dismiss}
				aria-label="Fechar dica de instalação"
				className="text-text-muted hover:text-text -mt-1 -mr-1 grid h-8 w-8 place-items-center rounded-full transition-colors"
			>
				<svg
					width="14"
					height="14"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2.2"
					strokeLinecap="round"
					aria-hidden="true"
				>
					<path d="M6 6l12 12M18 6L6 18" />
				</svg>
			</button>
		</aside>
	);
}

function ShareIcon() {
	return (
		<svg
			width="14"
			height="14"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
			className="text-accent inline-block -translate-y-px align-middle"
		>
			<path d="M12 3v12M8 7l4-4 4 4" />
			<path d="M6 11v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-8" />
		</svg>
	);
}
