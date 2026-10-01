/**
 * Gera os PNGs do PWA a partir de public/icons/icon.svg (fundo sangrado, para
 * que iOS e Android apliquem a própria máscara). Rode `pnpm icons` depois de
 * mudar o SVG; os PNGs gerados são versionados.
 */
import { readFile } from "node:fs/promises";
import sharp from "sharp";

const svg = await readFile(new URL("../public/icons/icon.svg", import.meta.url));

const targets = [
	["public/icons/icon-192.png", 192],
	["public/icons/icon-512.png", 512],
	["public/icons/maskable-512.png", 512],
	["src/app/apple-icon.png", 180],
];

for (const [path, size] of targets) {
	await sharp(svg, { density: 384 }).resize(size, size).png().toFile(path);
	console.log(`✓ ${path} (${size}px)`);
}
