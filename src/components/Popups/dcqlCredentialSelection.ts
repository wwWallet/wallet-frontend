import { dcqlSelectionIsValid, reconcileDcqlSelection } from 'wallet-common';
import type { ClaimPath, CredentialClaimPath, DcqlMatches, DcqlSelection, DcqlSelectedCredential } from 'wallet-common';
import type { ExtendedVcEntity } from '@/context/CredentialsContext';

interface RequiredCombination {
	choices: (number | null)[];
	queryIds: string[];
}

export const MAX_REQUIRED_COMBINATIONS = 256;

export function normalizeDcqlMatches(raw: DcqlMatches): DcqlMatches {
	const source = Object.values(raw)[0]?.requirements;
	const requirements = source?.length
		? source.map((set) => ({ ...set, required: set.required !== false }))
		: Object.keys(raw).map((id, setIndex) => ({
				setIndex,
				required: true,
				options: [{ optionIndex: 0, queryIds: [id], available: !!raw[id].candidates.length }],
			}));
	return Object.fromEntries(Object.entries(raw).map(([id, match]) => [id, { ...match, requirements }])) as DcqlMatches;
}

export function completeRequiredCombinations(
	requirements: DcqlMatches[string]['requirements'],
	matches: DcqlMatches,
): { combinations: RequiredCombination[]; truncated: boolean } {
	const required = requirements.map((set, index) => ({ set, index })).filter(({ set }) => set.required !== false);
	let combinations: RequiredCombination[] = [{ choices: requirements.map(() => null), queryIds: [] }];
	let truncated = false;
	for (const { set, index } of required) {
		const next: RequiredCombination[] = [];
		const seen = new Set<string>();
		collect: for (const combination of combinations) {
			for (const option of set.options) {
				if (!option.available || !option.queryIds.every((id) => matches[id]?.candidates.length)) continue;
				const queryIds = [...new Set([...combination.queryIds, ...option.queryIds])];
				const key = JSON.stringify([...queryIds].sort());
				if (seen.has(key)) continue;
				if (next.length === MAX_REQUIRED_COMBINATIONS) {
					truncated = true;
					break collect;
				}
				seen.add(key);
				next.push({
					choices: combination.choices.map((choice, i) => (i === index ? option.optionIndex : choice)),
					queryIds,
				});
			}
		}
		combinations = next;
	}
	return { combinations, truncated };
}

export function reconcileSelection(
	matches: DcqlMatches,
	choices: (number | null)[],
	previous: DcqlSelection,
	inventory: ExtendedVcEntity[] | null,
): DcqlSelection {
	const active = reconcileDcqlSelection(matches, choices, previous);
	return new Map(
		[...active].map(([id, instances]) => {
			if (previous.has(id)) return [id, instances];
			// Inventory is newest first; keep the matcher's claim set for that issuance.
			const candidates = matches[id].candidates;
			const newest = inventory?.find((vc) => candidates.some((candidate) => candidate.batchId === vc.batchId));
			const preferred = candidates.find((candidate) => candidate.batchId === newest?.batchId) ?? candidates[0];
			return [id, preferred ? [preferred] : []];
		}),
	);
}

export function selectionIsValid(
	matches: DcqlMatches,
	choices: (number | null)[],
	selection: DcqlSelection,
	inventory: ExtendedVcEntity[] | null,
): boolean {
	return (
		dcqlSelectionIsValid(matches, choices, selection) &&
		[...selection.values()].flat().every((instance) => inventory?.some((vc) => vc.batchId === instance.batchId))
	);
}

export function disclosedDisplay(credential: ExtendedVcEntity, instance: DcqlSelectedCredential) {
	const toJson = (value: unknown): unknown =>
		value instanceof Date || value instanceof Uint8Array
			? value
			: value instanceof Map
				? Object.fromEntries([...value].map(([k, v]) => [k, toJson(v)]))
				: Array.isArray(value)
					? value.map(toJson)
					: value && typeof value === 'object'
						? Object.fromEntries(Object.entries(value).map(([k, v]) => [k, toJson(v)]))
						: value;
	const allClaims = toJson(instance.disclosedClaims) as Record<string, unknown>;
	const disclosedPaths: ClaimPath[] = [];
	const visit = (value: unknown, path: ClaimPath) => {
		if (
			value &&
			typeof value === 'object' &&
			!(value instanceof Date) &&
			!(value instanceof Uint8Array) &&
			Object.keys(value).length
		)
			Object.entries(value).forEach(([key, child]) =>
				visit(child, [...path, Array.isArray(value) ? Number(key) : key]),
			);
		else disclosedPaths.push(path);
	};
	visit(allClaims, []);
	const protocolFields = new Set(['cnf', 'iat', 'nbf', 'exp', 'iss', 'vct', 'vct#integrity', 'trust_anchor', 'status']);
	const displayPaths = disclosedPaths.filter(
		(path) =>
			path[0] !== 'sub' &&
			(credential.parsedCredential.metadata.credential.format === 'mso_mdoc' || !protocolFields.has(String(path[0]))),
	);
	return { allClaims, displayPaths };
}

export function credentialImageFilter(
	credential: ExtendedVcEntity,
	instance: DcqlSelectedCredential,
): CredentialClaimPath[] {
	const requiredPaths = (credential.parsedCredential.metadata.credential.TypeMetadata?.claims ?? [])
		.filter((claim) => claim.required === true)
		.map((claim) => claim.path);
	return Array.from(
		new Map(
			[...instance.disclosurePaths, ...requiredPaths]
				.filter((path) => path[0] !== 'sub')
				.map((path) => {
					const imagePath = path.map((segment) => (segment === null ? '' : String(segment)));
					return [JSON.stringify(imagePath), imagePath] as const;
				}),
		).values(),
	);
}
