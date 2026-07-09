import { describe, expect, it, vi } from "vitest";
import { PreAuthorizedGrant } from "./PreAuthorizedGrant";
import * as oauth4webapi from "oauth4webapi";
import { generateDPoP } from "@/lib/utils/dpop";

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

	it("omits DPoP when no DPoP keys are provided", async () => {
		const headers = await getRequestHeaders(undefined, false);

		expect(headers.get("DPoP")).toBeNull();
		expect(generateDPoP).not.toHaveBeenCalled();
	});

	it("includes DPoP when DPoP keys are provided", async () => {
		const headers = await getRequestHeaders("wallet-client", true);

		expect(headers.get("DPoP")).toBe("dpop-proof");
		expect(generateDPoP).toHaveBeenCalledWith(
			{},
			{},
			"POST",
			"https://as.example.test/token",
		);
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

async function getRequestHeaders(clientId: string | undefined, useDpop: boolean): Promise<Headers> {
	vi.mocked(generateDPoP).mockClear();
	let requestHeaders: Headers | null = null;

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
		useDpop
			? {
				dpopPrivateKey: {} as any,
				dpopPublicKeyJwk: {},
			}
			: undefined,
		{
			[oauth4webapi.customFetch]: async (_url, options) => {
				requestHeaders = new Headers(options.headers);
				return new Response(JSON.stringify({ access_token: "token" }), {
					headers: { "content-type": "application/json" },
				});
			},
		},
	);

	if (!requestHeaders) {
		throw new Error("Expected pre-authorized request headers to be captured");
	}

	return requestHeaders;
}
