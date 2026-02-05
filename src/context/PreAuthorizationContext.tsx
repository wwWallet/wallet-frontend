import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import * as jose from 'jose';
import pkce from 'pkce-challenge';

// Contexts & Utilities
import SessionContext from '@/context/SessionContext';
import { notify } from "@/context/notifier";
import { generateDPoP } from '@/lib/utils/dpop';

// UI Components - Fixed paths using @ alias
import PopupLayout from '@/components/Popups/PopupLayout';
import Button from '@/components/Buttons/Button';
import { H1 } from '@/components/Shared/Heading';
import * as config from '../config';

// --- Configuration ---

const backendURL = config.BACKEND_URL;
const redirectURI = config.OPENID4VCI_REDIRECT_URI;
const clientID = config.CLIENT_ID;



// --- Internal Utilities ---
const b64UrlEncode = (data: Uint8Array | string): string => {
	const bytes = typeof data === "string" ? new TextEncoder().encode(data) : data;
	let binary = "";
	for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
	return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

const signRaw = async (privateKey: CryptoKey, data: string): Promise<Uint8Array> => {
	const signature = await crypto.subtle.sign(
		{ name: "ECDSA", hash: "SHA-256" },
		privateKey,
		new TextEncoder().encode(data)
	);
	return new Uint8Array(signature);
};

const generateKeys = async () => {
	const keyPair = await crypto.subtle.generateKey(
		{ name: "ECDSA", namedCurve: "P-256" },
		true,
		["sign", "verify"]
	);
	const jwk = await crypto.subtle.exportKey("jwk", keyPair.publicKey);
	return {
		privateKey: keyPair.privateKey,
		jwk: { kty: jwk.kty, crv: jwk.crv, x: jwk.x, y: jwk.y }
	};
};

const safeFetchJson = async (url: string, options: RequestInit) => {
	const response = await fetch(url, options);
	const text = await response.text();
	if (!response.ok) throw new Error(`Status ${response.status}: ${text}`);
	return JSON.parse(text);
};

// --- Context Definition ---
type PreAuthorization = (credentialOfferUrl: string, pin?: string) => Promise<void>;
const PreAuthorizationContext = createContext<PreAuthorization | undefined>(undefined);

export const PreAuthorizationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
	const { api, keystore } = useContext(SessionContext);

	const [isProcessing, setIsProcessing] = useState(false);
	const [isSuccess, setIsSuccess] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [pin, setPin] = useState("");
	const [showPinInput, setShowPinInput] = useState(false);
	const [activeUrl, setActiveUrl] = useState<string | null>(null);

	const preAuth: PreAuthorization = useCallback(async (credentialOfferUrl, submittedPin) => {
		try {


			setIsProcessing(true);
			setError(null);
			setActiveUrl(credentialOfferUrl);

			// Parse the offer from the URL
			const decoded = decodeURIComponent(credentialOfferUrl);
			const preAuthorizationCode = decoded.match(/"pre-authorized_code"\s*:\s*"([^"]+)"/)?.[1];
			const issuerState = decoded.match(/"issuer_state"\s*:\s*"([^"]+)"/)?.[1];
			const pinRequired = decoded.match(/"user_pin_required"\s*:\s*(true|false)/)?.[1] === "true";

			if (!preAuthorizationCode) throw new Error("Invalid QR: Missing pre-authorized code");

			// Handle PIN Interrupt
			if (pinRequired && !submittedPin) {
				setShowPinInput(true);
				setIsProcessing(false);
				return;
			}

			setShowPinInput(false);
			const { code_challenge, code_verifier } = await pkce();
			// 1. PAR
			const pushedAuthorizationRequestData = await safeFetchJson(`${backendURL}/pushed-authorization-request`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				body: new URLSearchParams({
					"response_type": "code",
					"client_id": clientID,
					"redirect_uri": redirectURI,
					"scope": "pid:sd_jwt_dc",
					"issuer_state": issuerState || "",
					"code_challenge": code_challenge,
					"code_challenge_method": "S256"
				})
			});



			// 2. Authorize
			await fetch(`${backendURL}/authorize?clientID=${clientID}&request_uri=${pushedAuthorizationRequestData.request_uri}`);

			// 3. Pre-Authorize
			const authorizationData = await safeFetchJson(`${backendURL}/pre-authorize?client_id=${clientID}&request_uri=${pushedAuthorizationRequestData.request_uri}`, {
				method: "POST",
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				body: new URLSearchParams({ pre_auth_code: preAuthorizationCode }),
			});
			const authorizationCode = new URL(authorizationData.location).searchParams.get("code");
			// 4. Token
			const tokenParams = new URLSearchParams({
				client_id: clientID,
				redirect_uri: redirectURI,
				grant_type: "authorization_code",
				code: authorizationCode || "",
				code_verifier
			});
			if (submittedPin) tokenParams.append("tx_code", submittedPin);

			const tokenData = await safeFetchJson(`${backendURL}/token`, {
				method: "POST",
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				body: tokenParams
			});

			// 5. Credential (DPoP + Proof)
			const nonceData = await safeFetchJson(`${backendURL}/nonce`, { method: "POST" });
			const { privateKey, jwk } = await generateKeys();
			const targetUrl = `${backendURL}/credential`;

			const dpop = await generateDPoP(privateKey, jwk, "POST", targetUrl, nonceData.c_nonce);
			const proofH = b64UrlEncode(JSON.stringify({ alg: "ES256", jwk }));
			const proofP = b64UrlEncode(JSON.stringify({ nonce: nonceData.c_nonce, iat: Math.floor(Date.now() / 1000) }));
			const proof_jwt = `${proofH}.${proofP}.${b64UrlEncode(await signRaw(privateKey, `${proofH}.${proofP}`))}`;

			const finalResult = await safeFetchJson(targetUrl, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"Authorization": `Bearer ${tokenData.access_token}`,
					"DPoP": dpop
				},
				body: JSON.stringify({
					"credential_configuration_ids": ["urn:eudi:pid:1:dc"],
					"proofs": { "jwt": [proof_jwt] }
				}),
			});

		// 6. Keystore Integration
		const rawCredential = finalResult.credentials[0].credential;
		const kid = await jose.calculateJwkThumbprint(jwk, "sha256");

		const [, privateData, commit] = await keystore.addCredentials([{
			data: rawCredential,
			format: "vc+sd-jwt",
			kid,
			credentialConfigurationId: "urn:eudi:pid:1:dc",
			credentialIssuerIdentifier: backendURL,
			batchId: Date.now(),
			instanceId: 0,
		}]);

		await api.updatePrivateData(privateData);
		await commit();

		notify("newCredential");
		setIsSuccess(true);
		setIsProcessing(false);
		} catch (err: any) {
				setError(err.message);
				setIsProcessing(false);
		}
	}, [api, keystore]);

	const reset = () => {
		setIsProcessing(false);
		setIsSuccess(false);
		setError(null);
		setShowPinInput(false);
		setPin("");
	};

	return (
		<PreAuthorizationContext.Provider value={preAuth}>
			{children}
			{(isProcessing || showPinInput || isSuccess || error) && (
				<PopupLayout isOpen={true} loading={isProcessing} onClose={reset}>
					<div className="flex flex-col items-center justify-center py-6 text-center">
						{showPinInput ? (
							<form
								onSubmit={(e) => { e.preventDefault(); preAuth(activeUrl!, pin); }}
								className="w-full flex flex-col items-center px-4"
							>
								<H1 heading="PIN Required" />
								<input
									type="text"
									value={pin}
									onChange={(e) => setPin(e.target.value)}
									className="w-full max-w-[200px] p-3 text-center text-2xl border-2 rounded-xl mb-4 dark:bg-gray-800 focus:border-blue-500 outline-none"
									placeholder="0000"
									autoFocus
								/>
								<Button type="submit" variant="primary" additionalClassName="w-full">
									Submit PIN
								</Button>
							</form>
						) : isSuccess ? (
							<div className="animate-in zoom-in">
								<H1 heading="Success!" />
								<p className="text-gray-500 mt-2">Credential added successfully.</p>
								<Button onClick={reset} additionalClassName="mt-6 w-full">Close</Button>
							</div>
						) : error ? (
							<div className="animate-in fade-in">
								<H1 heading="Issuance Failed" />
								<p className="text-xs text-red-500 mt-4 p-2 bg-red-50 dark:bg-red-900/20 rounded break-all">{error}</p>
								<Button onClick={reset} additionalClassName="mt-6 w-full">Try Again</Button>
							</div>
						) : (
							<p className="animate-pulse">Issuing Credential...</p>
						)}
					</div>
				</PopupLayout>
			)}
		</PreAuthorizationContext.Provider>
	);
};

export const usePreAuthorization = () => {
	const context = useContext(PreAuthorizationContext);
	if (!context) throw new Error("usePreAuthorization must be used within a PreAuthProvider");
	return context;
};
