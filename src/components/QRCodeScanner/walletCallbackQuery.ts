// Keep the full query, including question marks inside nested request URIs.
export function walletCallbackQuery(data: string): string | null {
	try {
		const url = new URL(data);
		const params = url.searchParams;
		if (
			!params.get('credential_offer') &&
			!params.get('credential_offer_uri') &&
			!(params.get('client_id') && params.get('request_uri'))
		)
			return null;
		return url.search.slice(1);
	} catch {
		return null;
	}
}
