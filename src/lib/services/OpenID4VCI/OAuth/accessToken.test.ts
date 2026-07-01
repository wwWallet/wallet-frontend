import { assert, describe, it, vi } from "vitest";
import { accessTokenIsValid, refreshAccessToken } from "./accessToken";
import { GrantType } from "./TokenRequest";

const tokenRequestBuilder = () => ({
	setTokenEndpoint: vi.fn(),
	setIssuer: vi.fn(),
	setGrantType: vi.fn(),
	setAuthorizationCode: vi.fn(),
	setPreAuthorizedCode: vi.fn(),
	setTxCode: vi.fn(),
	setAuthorizationResponseUrl: vi.fn(),
	setState: vi.fn(),
	setCodeVerifier: vi.fn(),
	setRefreshToken: vi.fn(),
	setClientId: vi.fn(),
	setAdditionalParameters: vi.fn(),
	setRedirectUri: vi.fn(),
	setDpopHeader: vi.fn(),
	execute: vi.fn().mockResolvedValue({
		response: {
			access_token: "new-access-token",
			c_nonce: "new-c-nonce",
			expires_in: 60,
			c_nonce_expires_in: 120,
			httpResponseHeaders: { "dpop-nonce": "nonce" },
		},
	}),
});

describe("OAuth access token handling", () => {
	it("identifies tokens that are valid beyond the skew window", () => {
		assert.strictEqual(accessTokenIsValid({ expiration_timestamp: 2000 }, 1000, 30), true);
		assert.strictEqual(accessTokenIsValid({ expiration_timestamp: 1020 }, 1000, 30), false);
	});

	it("refreshes a token and preserves the old refresh token when the response omits one", async () => {
		const builder = tokenRequestBuilder();

		const result = await refreshAccessToken({
			tokenEndpoint: "https://issuer.example/token",
			issuer: "https://issuer.example",
			clientId: "wallet-client",
			refreshToken: "old-refresh-token",
			additionalParameters: { scope: "credential-scope" },
		}, {
			tokenRequestBuilder: builder,
			now: 1000,
		});

		assert.strictEqual(result.tokenState.access_token, "new-access-token");
		assert.strictEqual(result.tokenState.refresh_token, "old-refresh-token");
		assert.strictEqual(result.tokenState.expiration_timestamp, 1060);
		assert.strictEqual(result.tokenState.c_nonce_expiration_timestamp, 1120);
		assert.deepEqual(result.headers, { "dpop-nonce": "nonce" });
		assert.deepEqual(builder.setGrantType.mock.calls[0], [GrantType.REFRESH]);
		assert.deepEqual(builder.setRefreshToken.mock.calls[0], ["old-refresh-token"]);
		assert.deepEqual(builder.setAdditionalParameters.mock.calls[0], [{ scope: "credential-scope" }]);
	});
});
