import { POLICY_LINKS } from '@/config';
import { useMemo } from 'react';

interface PolicyLink {
	label: string;
	href: string;
}

export function usePolicyLinks() {
	const policyLinksList = useMemo(() => parsePolicyLinks(POLICY_LINKS), []);

	const hasPolicyLinks = useMemo(
		() => Array.isArray(policyLinksList) && policyLinksList.length > 0,
		[policyLinksList],
	);

	return { policyLinksList, hasPolicyLinks };
}

function parsePolicyLinks(raw: unknown): PolicyLink[] | undefined {
		if (typeof raw !== 'string') {
			return undefined;
		}

		return raw
			.split(',')
			.map((item) => {
				const parts = item.split('::').map((str) => str.trim());

				if (parts.length !== 2) {
					return null;
				}

				const [label, href] = parts;

				return label && href ? { label, href } : null;
			})
			.filter((item): item is PolicyLink => item !== null);
	}
