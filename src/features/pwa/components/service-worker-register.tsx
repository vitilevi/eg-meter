"use client";

import { useEffect } from "react";

/**
 * Registra o service worker só em produção: em `next dev` ele cachearia
 * bundles que mudam a cada edição e esconderia o hot reload.
 */
export function ServiceWorkerRegister() {
	useEffect(() => {
		if (process.env.NODE_ENV !== "production") return;
		if (!("serviceWorker" in navigator)) return;
		navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
			// Sem SW o app continua funcionando online; só perde o modo offline.
		});
	}, []);

	return null;
}
