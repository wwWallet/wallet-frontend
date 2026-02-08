import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { calculateJwkThumbprint, exportJWK, generateKeyPair} from "jose";

import pkce from 'pkce-challenge';
import SessionContext from '@/context/SessionContext';
import { generateDPoP } from '@/lib/utils/dpop';
import PopupLayout from '@/components/Popups/PopupLayout';
import Button from '@/components/Buttons/Button';
import * as config from '../config';
import PinInput from '@/components/Popups/PinPopup';
import { useTranslation } from 'react-i18next';

// --- Configuration ---
const backendURL = config.BACKEND_URL;
const redirectURI = config.OPENID4VCI_REDIRECT_URI;
const clientID = config.CLIENT_ID;

if (!config.CLIENT_ID) {
	console.warn('CLIENT_ID not set; pre-auth may fail');
}

const safeFetchJson = async (url: string, options: RequestInit) => {
	try {
		const response = await fetch(url, options);
		const text = await response.text();
		if (!response.ok) {
			throw new Error(`Status ${response.status}: ${text}`);
		}
		if (!text) return null;
		return JSON.parse(text);
	} catch (error) {
		console.error(`safeFetchJson failed for ${url}:`, error);
		throw error;
	}
};

const parseCredentialOffer = (credentialOfferUrl: string) => {
	const url = new URL(credentialOfferUrl);
	let decoded = url.searchParams.get('credential_offer');
	if (decoded) {
		try {
			decoded = JSON.parse(decodeURIComponent(decoded));
		} catch (error) {
			console.error("Failed to parse the offer parameter as JSON:", error.message);
			decoded = null;
		}
	} else {
		console.warn("No 'credential_offer' parameter found in the URL.");
		decoded = null;
	}
	return decoded
};

const performPreAuthorization = async (issuerState: string, challenge: string) => {
	return safeFetchJson(`${backendURL}/pushed-authorization-request`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({
			response_type: "code",
			client_id: clientID,
			redirect_uri: redirectURI,
			scope: "pid:sd_jwt_dc",
			issuer_state: issuerState || "",
			code_challenge: challenge,
			code_challenge_method: "S256"
		})
	});
};

const fetchAuthorizationCode = async (preAuthorizationCode: string, pushedAuthorizationRequestDataUri: string) => {
	const authorizationData = await safeFetchJson(`${backendURL}/pre-authorize?client_id=${clientID}&request_uri=${pushedAuthorizationRequestDataUri}`, {
		method: "POST",
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({ pre_auth_code: preAuthorizationCode }),
	});
	const authorizationCode = new URL(authorizationData.location).searchParams.get("code");
	return authorizationCode;
};

const fetchToken = async (code_verifier: string, submittedPin: string, authorizationCode: string) => {
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
	return tokenData;
};

const requestCredential = async (targetUrl: string, access_token: string, dpop: string, proof_jwt: string) => {
	const credential = await safeFetchJson(targetUrl, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"Authorization": `Bearer ${access_token}`,
			"DPoP": dpop
		},
		body: JSON.stringify({
			"credential_configuration_ids": ["urn:eudi:pid:1:dc"],
			"proofs": { "jwt": [proof_jwt] }
		}),
	});
	return credential;
};

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
	const { t } = useTranslation();
	const [pinLength, setPinLength] = useState<number>(4);
	const [pinInputMode, setPinInputMode] = useState<"numeric" | "text">("numeric");

	const preAuth: PreAuthorization = useCallback(async (credentialOfferUrl, submittedPin) => {
		try {
			setIsProcessing(true);
			setError(null);
			setActiveUrl(credentialOfferUrl);
			const decoded = parseCredentialOffer(credentialOfferUrl);
			let preAuthorizationCode;
			let issuerState;
			let pinRequired = false;
			if (decoded && typeof decoded === 'object') {
				preAuthorizationCode = decoded.grants?.["urn:ietf:params:oauth:grant-type:pre-authorized_code"]?.["pre-authorized_code"];
				issuerState = decoded.grants?.["authorization_code"]?.["issuer_state"];
				pinRequired = decoded.grants?.["urn:ietf:params:oauth:grant-type:pre-authorized_code"]?.["user_pin_required"] === true;
				const txCodeSettings = decoded.grants?.["urn:ietf:params:oauth:grant-type:pre-authorized_code"]?.["tx_code"];
				setPinInputMode(txCodeSettings?.input_mode === "text" ? "text" : "numeric");
				setPinLength(txCodeSettings?.length || 4);
				console.log("Extracted:", { preAuthorizationCode, issuerState, pinRequired });
			}
			if (!preAuthorizationCode) throw new Error("Invalid QR: Missing pre-authorized code");
			if (pinRequired && !submittedPin) {
				setShowPinInput(true);
				setIsProcessing(false);
				return;
			}
			setShowPinInput(false);
			const { code_challenge, code_verifier } = await pkce();
			const pushedAuthorizationRequestData = await performPreAuthorization(issuerState, code_challenge);
			const authorizationCode = await fetchAuthorizationCode(preAuthorizationCode,pushedAuthorizationRequestData.request_uri);
			const tokenData = await fetchToken(code_verifier, submittedPin, authorizationCode);
			const nonceData = await safeFetchJson(`${backendURL}/nonce`, { method: "POST" });
			const { privateKey, publicKey } = await generateKeyPair('ES256', {
				extractable: true
			});
			const jwk = await exportJWK(publicKey);
			const targetUrl = `${backendURL}/credential`;
			const dpop = await generateDPoP(privateKey, jwk, "POST", targetUrl, nonceData.c_nonce);
			const inputs = [];
			const numberOfProofs =1;
			for (let i = 0; i < numberOfProofs; i++) {
				inputs.push({
					nonce: nonceData.c_nonce ?? undefined,
					issuer: clientID,
					audience: redirectURI
				})
			}
			const proofs = inputs;
			const [{ proof_jwts }, privateDataWithProofs, commitProofs] = await keystore.generateOpenid4vciProofs(proofs);
			const proof_jwt=proof_jwts[0];
			const credentialResponse = await requestCredential(targetUrl, tokenData.access_token, dpop, proof_jwt);
			const rawCredential = credentialResponse.credentials[0].credential;
			const kid = await calculateJwkThumbprint(jwk, "sha256");
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
			setIsSuccess(true);
			setIsProcessing(false);
		} catch (err: any) {
			setError(err.message);
			setIsProcessing(false);
		}
	}, [api, keystore]);
const closeFlow = () => {
	setIsProcessing(false);
	setIsSuccess(false);
	setError(null);
	setShowPinInput(false);
	setPin("");
};

const handleRetry = () => {
	setError(null);
	setIsProcessing(false);
	setShowPinInput(true);
};

return (
	<PreAuthorizationContext.Provider value={preAuth}>
		{children}
		<PinInput
			isOpen={showPinInput}
			setIsOpen={setShowPinInput}
			inputsCount={pinLength}
			inputsMode={pinInputMode}
			onCancel={closeFlow}
			onSubmit={(submittedPin) => preAuth(activeUrl!, submittedPin)}
		/>
		{(isProcessing || isSuccess || error) && (
			<PopupLayout
				isOpen={true}
				loading={isProcessing}
				onClose={isSuccess ? closeFlow : undefined}
			>
				<div className="flex flex-col items-center justify-center py-6 text-center">
					{isSuccess ? (
						<div className="animate-in zoom-in">
							<p className="text-gray-500 mt-2">{t('PreAuth.successMessage')}</p>
							<Button onClick={closeFlow} additionalClassName="mt-6 w-full">
								{t('messagePopup.close')}
							</Button>
						</div>
					) : error ? (
						<div className="animate-in fade-in">
							<div className="mb-2 text-red-500 font-bold">{t('common.error')}</div>
							<p className="text-xs text-red-500 mt-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-100 dark:border-red-800 break-words max-w-xs">
								{error}
							</p>
							<div className="flex gap-2 mt-6 w-full">
								<Button onClick={closeFlow} variant="secondary" additionalClassName="flex-1">
									{t('common.cancel')}
								</Button>
								<Button onClick={handleRetry} additionalClassName="flex-1">
									{t('common.tryAgain')}
								</Button>
							</div>
						</div>
					) : (
						<div className="flex flex-col items-center">
							<p className="animate-pulse text-primary font-medium">{t('PreAuth.issuing')}</p>
						</div>
					)}
				</div>
			</PopupLayout>
		)}
	</PreAuthorizationContext.Provider>
);
};

export const usePreAuthorization = () => {
	const context = useContext(PreAuthorizationContext);
	return context;
};
