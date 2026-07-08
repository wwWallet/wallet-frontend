import React, { PropsWithChildren } from "react";
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CredentialsContext from "@/context/CredentialsContext";
import SessionContext from "@/context/SessionContext";
import { useOpenID4VCI } from "./OpenID4VCI";
import { GrantType, VerifiableCredentialFormat } from "wallet-common";
import { toBase64Url } from "@/util";

const { credentialRequestBuilder, helper, httpGet, pushedAuthorizationRequest, tokenRequestBuilder } = vi.hoisted(() => ({
	credentialRequestBuilder: {
		setCNonce: vi.fn(),
		setCredentialEndpoint: vi.fn(),
		setAccessToken: vi.fn(),
		setCredentialIssuerIdentifier: vi.fn(),
		setCredentialConfigurationId: vi.fn(),
		setDpopPrivateKey: vi.fn(),
		setDpopPublicKeyJwk: vi.fn(),
		setDpopJti: vi.fn(),
		setDpopNonce: vi.fn(),
		setDpopHeader: vi.fn(),
		execute: vi.fn(),
		setDeferredCredentialEndpoint: vi.fn(),
		executeDeferredFetch: vi.fn(),
	},
	helper: {
		getCredentialIssuerMetadata: vi.fn(),
		getAuthorizationServerMetadata: vi.fn(),
		getClientId: vi.fn(),
	},
	httpGet: vi.fn(),
	pushedAuthorizationRequest: {
		sendPushedAuthorizationRequest: vi.fn(),
	},
	tokenRequestBuilder: {
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
		execute: vi.fn(),
	},
}));

vi.mock("react-router-dom", () => ({
	useLocation: () => ({ search: "" }),
}));

vi.mock("react-i18next", () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock("../OpenID4VCIHelper", () => ({
	useOpenID4VCIHelper: () => helper,
}));

vi.mock("../HttpProxy/HttpProxy", () => ({
	useHttpProxy: () => ({
		get: httpGet,
		post: vi.fn(),
	}),
}));

vi.mock("./OAuth/PushedAuthorizationRequest", () => ({
	usePushedAuthorizationRequest: () => pushedAuthorizationRequest,
}));

vi.mock("./OAuth/TokenRequest", async () => {
	const walletCommon = await vi.importActual<typeof import("wallet-common")>("wallet-common");
	return {
		GrantType: walletCommon.GrantType,
		TokenRequestError: { FAILED: 0, AUTHORIZATION_REQUIRED: 1 },
		useTokenRequest: () => tokenRequestBuilder,
	};
});

vi.mock("./CredentialRequest", () => ({
	useCredentialRequest: () => credentialRequestBuilder,
}));

vi.mock("@/context/notifier", () => ({
	notify: vi.fn(),
}));

const issuer = "https://issuer.example";
const credentialConfigurationId = "UniversityDegree";

const credentialIssuerMetadata = {
	credential_issuer: issuer,
	credential_endpoint: `${issuer}/credential`,
	credential_configurations_supported: {
		[credentialConfigurationId]: {
			format: VerifiableCredentialFormat.VC_SDJWT,
			scope: "degree",
			vct: "UniversityDegree",
		},
	},
};

const textEncoder = new TextEncoder();

const encodeState = (credentialOfferGrant?: unknown) =>
	toBase64Url(textEncoder.encode(JSON.stringify({
		userHandleB64u: "user-handle",
		id: "state-id",
		credentialOfferGrant,
	})));

const wrapper = ({ children }: PropsWithChildren) => (
	<SessionContext.Provider
		value={{
			api: {
				isLoggedIn: vi.fn(() => false),
				updatePrivateData: vi.fn(),
			} as any,
			isLoggedIn: true,
			keystore: {
				getCalculatedWalletState: vi.fn(() => null),
				getUserHandleB64u: vi.fn(() => "user-handle"),
				addCredentials: vi.fn(),
			} as any,
			logout: vi.fn(),
			obliviousKeyConfig: null,
		}}
	>
		<CredentialsContext.Provider
			value={{
				vcEntityList: [],
				latestCredentials: new Set(),
				fetchVcData: vi.fn(),
				getData: vi.fn(),
				currentSlide: 1,
				setCurrentSlide: vi.fn(),
				parseCredential: vi.fn(),
				credentialEngine: null,
				pendingTransactions: null,
			}}
		>
			{children}
		</CredentialsContext.Provider>
	</SessionContext.Provider>
);

describe("useOpenID4VCI credential offer handling", () => {
	beforeEach(() => {
		sessionStorage.clear();
		for (const mock of Object.values(credentialRequestBuilder)) {
			mock.mockReset();
		}
		for (const mock of Object.values(pushedAuthorizationRequest)) {
			mock.mockReset();
		}
		for (const mock of Object.values(tokenRequestBuilder)) {
			mock.mockReset();
		}
		helper.getCredentialIssuerMetadata.mockReset();
		helper.getCredentialIssuerMetadata.mockResolvedValue({ metadata: credentialIssuerMetadata });
		helper.getAuthorizationServerMetadata.mockReset();
		helper.getAuthorizationServerMetadata.mockResolvedValue({
			authzServerMetadata: {
				issuer: "https://as-two.example",
				authorization_endpoint: "https://as-two.example/authorize",
				token_endpoint: "https://as-two.example/token",
				pushed_authorization_request_endpoint: "https://as-two.example/par",
			},
		});
		helper.getClientId.mockReset();
		helper.getClientId.mockResolvedValue({ client_id: "wallet-client" });
		tokenRequestBuilder.execute.mockResolvedValue({
			response: {
				access_token: "access-token",
				c_nonce: "c-nonce",
				expires_in: 60,
				c_nonce_expires_in: 120,
				httpResponseHeaders: {},
			},
		});
		credentialRequestBuilder.execute.mockResolvedValue({
			credentialResponse: {
				data: {
					transaction_id: "deferred-transaction",
				},
			},
		});
		httpGet.mockReset();
	});

	it("defaults an offer without grants to authorization-code flow", async () => {
		const { result } = renderHook(
			() => useOpenID4VCI({
				errorCallback: vi.fn(),
				showPopupConsent: vi.fn(),
				showMessagePopup: vi.fn(),
				openID4VCIClientStateRepository: {
					cleanupExpired: vi.fn(),
					getByCredentialIssuerIdentifierAndCredentialConfigurationId: vi.fn(),
					getByState: vi.fn(),
					getAllStatesWithNonEmptyTransactionId: vi.fn(async () => []),
					create: vi.fn(),
					updateState: vi.fn(),
					commitStateChanges: vi.fn(),
				} as any,
			}),
			{ wrapper },
		);

		const offer = {
			credential_issuer: issuer,
			credential_configuration_ids: [credentialConfigurationId],
		};
		const credentialOfferUrl = `openid-credential-offer://?credential_offer=${encodeURIComponent(JSON.stringify(offer))}`;
		let response: Awaited<ReturnType<typeof result.current.handleCredentialOffer>>;

		await act(async () => {
			response = await result.current.handleCredentialOffer(credentialOfferUrl);
		});

		expect(response!.grant).toEqual({ [GrantType.AUTHORIZATION_CODE]: {} });
	});

	it("reuses the credential offer grant when exchanging an authorization response for tokens", async () => {
		const credentialOfferGrant = {
			[GrantType.AUTHORIZATION_CODE]: {
				authorization_server: "https://as-two.example",
				issuer_state: "issuer-state",
			},
		};
		const state = encodeState(credentialOfferGrant);
		const stateRepository = {
			cleanupExpired: vi.fn(),
			getByCredentialIssuerIdentifierAndCredentialConfigurationId: vi.fn(),
			getByState: vi.fn(async () => ({
				sessionId: 1,
				credentialIssuerIdentifier: issuer,
				state,
				code_verifier: "code-verifier",
				credentialConfigurationId,
				created: 1000,
			})),
			getAllStatesWithNonEmptyTransactionId: vi.fn(async () => []),
			create: vi.fn(),
			updateState: vi.fn(),
			commitStateChanges: vi.fn(),
		};
		const { result } = renderHook(
			() => useOpenID4VCI({
				errorCallback: vi.fn(),
				showPopupConsent: vi.fn(),
				showMessagePopup: vi.fn(),
				openID4VCIClientStateRepository: stateRepository as any,
			}),
			{ wrapper },
		);

		await act(async () => {
			await result.current.handleAuthorizationResponse(`https://wallet.example/cb?code=auth-code&state=${state}`);
		});

		expect(helper.getAuthorizationServerMetadata).toHaveBeenCalledWith(issuer, credentialOfferGrant);
		expect(tokenRequestBuilder.setTokenEndpoint).toHaveBeenCalledWith("https://as-two.example/token");
	});
});
