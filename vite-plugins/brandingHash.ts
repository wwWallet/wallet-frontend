// vite-plugins/getBrandingHash.ts
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

/**
 * Computes a stable hash from all branding inputs.
 * Changes ONLY when branding files change.
 */
export function getBrandingHash(brandingDir: string): string {
	const hash = crypto.createHash("sha256");

	function walk(dir: string) {
		const entries = fs.readdirSync(dir, { withFileTypes: true });

		for (const entry of entries) {
			const fullPath = path.join(dir, entry.name);

			if (entry.isDirectory()) {
				walk(fullPath);
			} else {
				hash.update(fullPath);
				hash.update(fs.readFileSync(fullPath));
			}
		}
	}

	walk(brandingDir);

	// 10 chars is enough to avoid collisions and keep URLs short
	return hash.digest("hex").slice(0, 10);
}
