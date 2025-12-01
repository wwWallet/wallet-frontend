// src/utils/twCx.ts

/**
 * Generic Tailwind merge helper.
 * - Groups utilities by the prefix before the first dash.
 * - Last utility in each group wins.
 * - Single-token utilities (no dash), like `border`, are treated as their own group
 *   so they don't get overridden by e.g. `border-gray-300`.
 */

type ClassValue = string | false | null | undefined;

function getGroup(cls: string): string {
	const parts = cls.split("-");

	// no dash
	if (parts.length === 1) {
		return `__single__:${cls}`;
	}

	// everything before last dash
	return parts.slice(0, -1).join("-");
}

export function twCx(...values: ClassValue[]) {
	const tokens = values
		.filter(Boolean)
		.flatMap((v) => (v as string).split(/\s+/).filter(Boolean));

	const result: string[] = [];
	const groups = new Map<string, number>();

	for (const token of tokens) {
		const group = getGroup(token);

		if (groups.has(group)) {
			const idx = groups.get(group)!;
			result[idx] = token;
			continue;
		}

		groups.set(group, result.length);
		result.push(token);
	}

	return result.join(" ");
}
