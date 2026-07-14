import React, { PropsWithChildren } from "react";
import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SessionContext from "@/context/SessionContext";
import { useOpenID4VCIHelper } from "./OpenID4VCIHelper";
import { GrantType, VerifiableCredentialFormat } from "wallet-common";

const { httpGet } = vi.hoisted(() => ({
	httpGet: vi.fn(),
}));

vi.mock("./HttpProxy/HttpProxy", () => ({
	useHttpProxy: () => ({
		get: httpGet,
	}),
}));

const issuer = "https://issuer.example";
const asOne = "https://as-one.example/tenant";
const asTwo = "https://as-two.example/tenant";

const credentialIssuerMetadata = {
	credential_issuer: issuer,
	credential_endpoint: `${issuer}/credential`,
	authorization_servers: [asOne, asTwo],
	credential_configurations_supported: {
		UniversityDegree: {
			format: VerifiableCredentialFormat.VC_SDJWT,
			scope: "degree",
			vct: "UniversityDegree",
		},
	},
};

const authorizationServerMetadata = (
	authorizationServer: string,
	grantTypesSupported: string[],
) => ({
	issuer: authorizationServer,
	authorization_endpoint: `${authorizationServer}/authorize`,
	token_endpoint: `${authorizationServer}/token`,
	pushed_authorization_request_endpoint: `${authorizationServer}/par`,
	grant_types_supported: grantTypesSupported,
});

const wrapper = ({ children }: PropsWithChildren) => (
	<SessionContext.Provider
		value={{
			api: {
				getExternalEntity: vi.fn(),
			} as any,
			isLoggedIn: true,
			keystore: {} as any,
			logout: vi.fn(),
			obliviousKeyConfig: null,
		}}
	>
		{children}
	</SessionContext.Provider>
);

describe("useOpenID4VCIHelper authorization server metadata", () => {
	beforeEach(() => {
		httpGet.mockReset();
		httpGet.mockImplementation(async (url: string) => {
			if (url.includes("openid-credential-issuer")) {
				return { status: 200, headers: {}, data: credentialIssuerMetadata };
			}
			if (url.startsWith(asOne)) {
				return {
					status: 200,
					headers: {},
					data: authorizationServerMetadata(asOne, [GrantType.PRE_AUTHORIZED_CODE]),
				};
			}
			if (url.startsWith(asTwo)) {
				return {
					status: 200,
					headers: {},
					data: authorizationServerMetadata(asTwo, [GrantType.AUTHORIZATION_CODE]),
				};
			}
			throw new Error(`Unexpected metadata request: ${url}`);
		});
	});

	it("falls back across issuer authorization_servers until one supports the requested grant type", async () => {
		const { result } = renderHook(() => useOpenID4VCIHelper(), { wrapper });

		const metadata = await result.current.getAuthorizationServerMetadata(
			issuer,
			{ [GrantType.AUTHORIZATION_CODE]: {} },
		);

		expect(metadata?.authzServerMetadata.issuer).toBe(asTwo);
		expect(httpGet).toHaveBeenCalledWith(
			expect.stringContaining("as-one.example"),
			expect.any(Object),
			expect.any(Object),
		);
		expect(httpGet).toHaveBeenCalledWith(
			expect.stringContaining("as-two.example"),
			expect.any(Object),
			expect.any(Object),
		);
	});

	it("uses the authorization_server from an authorization-code credential offer grant", async () => {
		const { result } = renderHook(() => useOpenID4VCIHelper(), { wrapper });

		const metadata = await result.current.getAuthorizationServerMetadata(
			issuer,
			{
				[GrantType.AUTHORIZATION_CODE]: {
					authorization_server: asTwo,
					issuer_state: "issuer-state",
				},
			},
		);

		expect(metadata?.authzServerMetadata.issuer).toBe(asTwo);
		expect(httpGet).not.toHaveBeenCalledWith(
			expect.stringContaining("as-one.example"),
			expect.any(Object),
			expect.any(Object),
		);
	});

	it("uses the authorization_server from a pre-authorized credential offer grant", async () => {
		const { result } = renderHook(() => useOpenID4VCIHelper(), { wrapper });

		const metadata = await result.current.getAuthorizationServerMetadata(
			issuer,
			{
				[GrantType.PRE_AUTHORIZED_CODE]: {
					authorization_server: asOne,
					"pre-authorized_code": "pre-auth-code",
				},
			},
		);

		expect(metadata?.authzServerMetadata.issuer).toBe(asOne);
		expect(httpGet).not.toHaveBeenCalledWith(
			expect.stringContaining("as-two.example"),
			expect.any(Object),
			expect.any(Object),
		);
	});

	it("rejects a credential offer authorization_server when issuer metadata has fewer than two authorization_servers", async () => {
		httpGet.mockImplementation(async (url: string) => {
			if (url.includes("openid-credential-issuer")) {
				return {
					status: 200,
					headers: {},
					data: {
						...credentialIssuerMetadata,
						authorization_servers: [asOne],
					},
				};
			}
			if (url.startsWith(asOne)) {
				return {
					status: 200,
					headers: {},
					data: authorizationServerMetadata(asOne, [GrantType.AUTHORIZATION_CODE]),
				};
			}
			throw new Error(`Unexpected metadata request: ${url}`);
		});
		const { result } = renderHook(() => useOpenID4VCIHelper(), { wrapper });

		await expect(result.current.getAuthorizationServerMetadata(
			issuer,
			{
				[GrantType.AUTHORIZATION_CODE]: {
					authorization_server: asOne,
				},
			},
		)).rejects.toThrow("must only be used");
	});

	it("does not fall back to the credential issuer as authorization server when authorization_servers is present", async () => {
		httpGet.mockImplementation(async (url: string) => {
			if (url.includes("openid-credential-issuer")) {
				return {
					status: 200,
					headers: {},
					data: {
						...credentialIssuerMetadata,
						authorization_servers: [asOne],
					},
				};
			}
			if (url.startsWith(asOne)) {
				return {
					status: 200,
					headers: {},
					data: authorizationServerMetadata(asOne, [GrantType.PRE_AUTHORIZED_CODE]),
				};
			}
			if (url.startsWith(issuer) && !url.includes("openid-credential-issuer")) {
				return {
					status: 200,
					headers: {},
					data: authorizationServerMetadata(issuer, [GrantType.AUTHORIZATION_CODE]),
				};
			}
			throw new Error(`Unexpected metadata request: ${url}`);
		});
		const { result } = renderHook(() => useOpenID4VCIHelper(), { wrapper });

		const metadata = await result.current.getAuthorizationServerMetadata(
			issuer,
			{ [GrantType.AUTHORIZATION_CODE]: {} },
		);

		expect(metadata).toBeNull();
		expect(httpGet).not.toHaveBeenCalledWith(
			expect.stringContaining(`${issuer}/.well-known/oauth-authorization-server`),
			expect.any(Object),
			expect.any(Object),
		);
		expect(httpGet).not.toHaveBeenCalledWith(
			expect.stringContaining(`${issuer}/.well-known/openid-configuration`),
			expect.any(Object),
			expect.any(Object),
		);
	});
});
