import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";

beforeEach(() => {
	if (typeof window.localStorage?.clear !== "function") {
		const store = new Map<string, string>();
		Object.defineProperty(window, "localStorage", {
			writable: true,
			configurable: true,
			value: {
				getItem: (key: string) => store.get(key) ?? null,
				setItem: (key: string, val: string) => store.set(key, String(val)),
				removeItem: (key: string) => store.delete(key),
				clear: () => store.clear(),
				get length() {
					return store.size;
				},
				key: (i: number) => Array.from(store.keys())[i] ?? null,
			},
		});
	}
	window.localStorage.clear();
});

afterEach(() => {
	cleanup();
	vi.clearAllMocks();
});
