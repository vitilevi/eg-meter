/*
 * Service worker do eg-meter: faz o app abrir offline depois da primeira visita.
 *
 * - Navegação: rede primeiro (sempre a versão mais nova), cache como reserva.
 * - Assets do Next (/_next/static, nomes com hash) e ícones: cache primeiro.
 * - Analytics e qualquer outra origem: nunca passam por aqui.
 *
 * Mudou a estratégia? Suba CACHE_VERSION para descartar o cache antigo.
 */
const CACHE_VERSION = "v1";
const CACHE_NAME = `egm-${CACHE_VERSION}`;
const PRECACHE = ["/", "/manifest.webmanifest", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
	event.waitUntil(
		caches
			.open(CACHE_NAME)
			.then((cache) => cache.addAll(PRECACHE))
			.then(() => self.skipWaiting()),
	);
});

self.addEventListener("activate", (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) =>
				Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
			)
			.then(() => self.clients.claim()),
	);
});

self.addEventListener("fetch", (event) => {
	const { request } = event;
	if (request.method !== "GET") return;

	const url = new URL(request.url);
	if (url.origin !== self.location.origin) return;
	// Scripts da Vercel Analytics e outras rotas internas ficam fora do cache.
	if (url.pathname.startsWith("/_vercel")) return;

	if (request.mode === "navigate") {
		event.respondWith(
			fetch(request)
				.then((response) => {
					const copy = response.clone();
					caches.open(CACHE_NAME).then((cache) => cache.put("/", copy));
					return response;
				})
				.catch(() => caches.match("/").then((cached) => cached || Response.error())),
		);
		return;
	}

	if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
		event.respondWith(
			caches.match(request).then(
				(cached) =>
					cached ||
					fetch(request).then((response) => {
						if (response.ok) {
							const copy = response.clone();
							caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
						}
						return response;
					}),
			),
		);
	}
});
