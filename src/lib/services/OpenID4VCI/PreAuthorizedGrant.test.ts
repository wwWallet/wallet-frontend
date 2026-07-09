import { describe, expect, it, vi } from "vitest";
import { PreAuthorizedGrant } from "./PreAuthorizedGrant";
import * as oauth4webapi from "oauth4webapi";

vi.mock("@/lib/utils/dpop", () => ({
	generateDPoP: vi.fn().mockResolvedValue("dpop-proof"),
}));

describe("PreAuthorizedGrant", () => {
	it("omits client_id when no client id is provided", async () => {
		const body = await getRequestBody();

		expect(body.get("client_id")).toBeNull();
	});

	it("includes client_id when provided", async () => {
		const body = await getRequestBody("wallet-client");

		expect(body.get("client_id")).toBe("wallet-client");
	});
});

async function getRequestBody(clientId?: string): Promise<URLSearchParams> {
	let requestBody: URLSearchParams | null = null;

	await PreAuthorizedGrant.preAuthorizedCodeGrantRequest(
		{
			issuer: "https://as.example.test",
			token_endpoint: "https://as.example.test/token",
		},
		{
			clientId,
			preAuthorizedCode: "pre-authorized-code",
			txCode: "1234",
		},
		{
			dpopPrivateKey: {} as any,
			dpopPublicKeyJwk: {},
		},
		{
			[oauth4webapi.customFetch]: async (_url, options) => {
				requestBody = options.body as URLSearchParams;
				return new Response(JSON.stringify({ access_token: "token" }), {
					headers: { "content-type": "application/json" },
				});
			},
		},
	);

	if (!requestBody) {
		throw new Error("Expected pre-authorized request body to be captured");
	}

	return requestBody;
}
