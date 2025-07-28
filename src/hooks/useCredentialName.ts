import { useState, useEffect, useCallback } from 'react';

export function useCredentialName(
	credentialNameFn?: (langs?: string[]) => Promise<string | null>,
	credentialId?: string,
	preferredLangs: string[] = ['en-US']
): string | null {
	const [name, setName] = useState<string | null>(null);

	const fetchName = useCallback(() => {
		if (!credentialNameFn) return Promise.resolve(null);
		return credentialNameFn(preferredLangs);
	}, [credentialNameFn, ...preferredLangs]);

	useEffect(() => {
		let isMounted = true;
		fetchName().then((resolvedName) => {
			if (isMounted) setName(resolvedName ?? null);
		}).catch(() => {
			if (isMounted) setName(null);
		});

		return () => {
			isMounted = false;
		};
	}, [credentialId, fetchName]);

	return name;
}
