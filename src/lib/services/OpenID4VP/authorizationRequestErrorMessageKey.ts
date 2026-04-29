import type { HandleAuthorizationRequestError } from "wallet-common";

const authorizationRequestErrorMessageKeyMap: Partial<Record<HandleAuthorizationRequestError, string>> = {
	insufficient_credentials: "insufficientCredentials",
	nontrusted_verifier: "nonTrustedVerifier",
};

export function getAuthorizationRequestErrorMessageKey(error: unknown): string | undefined {
	if (!(error instanceof Error)) {
		return undefined;
	}

	return authorizationRequestErrorMessageKeyMap[error.message as HandleAuthorizationRequestError];
}
