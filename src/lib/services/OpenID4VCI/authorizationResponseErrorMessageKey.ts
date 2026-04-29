const authorizationResponseErrorMessageKeyMap: Record<string, string> = {
	invalid_request: "invalidRequest",
	server_error: "serverError",
};

export function getAuthorizationResponseErrorMessageKey(error: string | null): string | undefined {
	if (!error) {
		return undefined;
	}

	return authorizationResponseErrorMessageKeyMap[error];
}
