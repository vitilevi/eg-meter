import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	reactStrictMode: true,
	poweredByHeader: false,
	async headers() {
		return [
			{
				// O navegador precisa sempre buscar o SW mais novo, senão uma versão
				// antiga do app pode ficar presa no cache.
				source: "/sw.js",
				headers: [
					{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
					{ key: "Content-Type", value: "application/javascript; charset=utf-8" },
				],
			},
		];
	},
};

export default nextConfig;
