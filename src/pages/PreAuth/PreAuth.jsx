import React, { useState, useMemo, useEffect, useContext, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import SessionContext from '@/context/SessionContext';
import { notify } from "@/context/notifier";
import * as jose from 'jose';
// UI Components
import PopupLayout from '../../components/Popups/PopupLayout';
import Button from '../../components/Buttons/Button';
import { H1 } from '../../components/Shared/Heading';
const BASE_URL = import.meta.env.VITE_WALLET_BACKEND_URL;;
const REDIRECT_URI = "http://localhost:3000";
const client_id = "CLIENT123";
const b64UrlEncode = (data) => {
	if (typeof data === "string") data = new TextEncoder().encode(data);
	let binary = "";
	for (let i = 0; i < data.byteLength; i++) binary += String.fromCharCode(data[i]);
	return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};
const sha256 = async (data) => {
	const hash = await crypto.subtle.digest("SHA-256", typeof data === "string" ? new TextEncoder().encode(data) : data);
	return new Uint8Array(hash);
};
const signRaw = async (privateKey, data) => {
	const signature = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, privateKey, typeof data === "string" ? new TextEncoder().encode(data) : data);
	return new Uint8Array(signature);
};
const generateKeys = async () => {
	const keyPair = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);
	const jwk = await crypto.subtle.exportKey("jwk", keyPair.publicKey);
	return { privateKey: keyPair.privateKey, jwk: { kty: jwk.kty, crv: jwk.crv, x: jwk.x, y: jwk.y } };
};
const PreAuth = () => {
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const { api, keystore } = useContext(SessionContext);

	const [isProcessing, setIsProcessing] = useState(true);
	const [isSuccess, setIsSuccess] = useState(false);
	const [error, setError] = useState(null);
	// Lock to prevent double-execution (fixes the "adds many credentials" issue)
	const hasCalled = useRef(false);
	const { preAuthCode, issuerState } = useMemo(() => {
		const qrcodeurl = searchParams.get('qrcodeurl') || "";
		const decodedOffer = decodeURIComponent(qrcodeurl);
		const stateMatch = decodedOffer.match(/issuer_state["%22]*[:%3A]*\s*["%22]*([^"%&]+)/);
		const codeMatch = decodedOffer.match(/pre-authorized_code["%22]*[:%3A]*\s*["%22]*([^"%&]+)/);
		return {
			preAuthCode: searchParams.get('pre_auth_code') || (codeMatch ? codeMatch[1] : "N/A"),
			issuerState: stateMatch ? stateMatch[1] : null
		};
	}, [searchParams]);

	useEffect(() => {
		const handleClaim = async () => {
			// Exit if already in progress or completed
			if (hasCalled.current) return;
			hasCalled.current = true;

			try {
				const safeFetchJson = async (url, options) => {
					const response = await fetch(url, options);
					const text = await response.text();
					if (!response.ok) throw new Error(`Status ${response.status}: ${text}`);
					return JSON.parse(text);
				};

				// 1. Pushed Authorization Request
				const parData = await safeFetchJson(`${BASE_URL}/pushed-authorization-request`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
					body: new URLSearchParams({
						"response_type": "code", "client_id": client_id, "redirect_uri": REDIRECT_URI,
						"scope": "pid:sd_jwt_dc", "issuer_state": issuerState,
						"code_challenge": "n4bQgYhMfWWaL-qgxVrQFaO_TxsrC4Is0V1sFbDwCgg", "code_challenge_method": "S256"
					})
				});

				// 2. Authorize
				await fetch(`${BASE_URL}/authorize?client_id=${client_id}&request_uri=${parData.request_uri}`);

				// 3. Pre-Authorize
				const authData = await safeFetchJson(`${BASE_URL}/pre-authorize?client_id=${client_id}&request_uri=${parData.request_uri}`, {
					method: "POST",
					headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
					body: new URLSearchParams({ pre_auth_code: preAuthCode }),
				});
				const [, authCode] = /code=([^&]+)/.exec(authData.location || "") || [];

				// 4. Token Request
				const tokenData = await safeFetchJson(`${BASE_URL}/token`, {
					method: "POST",
					headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
					body: new URLSearchParams({
							client_id,
							redirect_uri: REDIRECT_URI,
							grant_type: "authorization_code",
							code: authCode,
							code_verifier: "test"
					})
				});

				// 5. Get Nonce
				const nonceData = await safeFetchJson(`${BASE_URL}/nonce`, { method: "POST" });
				const c_nonce = nonceData.c_nonce;

				// 6. Setup Proof and DPoP
				const { privateKey, jwk } = await generateKeys();
				const ath = b64UrlEncode(await sha256(tokenData.access_token));
				const targetUrl = `${BASE_URL}/credential`;

				const dpopH = b64UrlEncode(JSON.stringify({ typ: "dpop+jwt", alg: "ES256", jwk }));
				const dpopP = b64UrlEncode(JSON.stringify({ jti: crypto.randomUUID(), htm: "POST", htu: targetUrl, iat: Math.floor(Date.now() / 1000), ath }));
				const dpop_jwt = `${dpopH}.${dpopP}.${b64UrlEncode(await signRaw(privateKey, `${dpopH}.${dpopP}`))}`;

				const proofH = b64UrlEncode(JSON.stringify({ alg: "ES256", jwk }));
				const proofP = b64UrlEncode(JSON.stringify({ nonce: c_nonce, iat: Math.floor(Date.now() / 1000) }));
				const proof_jwt = `${proofH}.${proofP}.${b64UrlEncode(await signRaw(privateKey, `${proofH}.${proofP}`))}`;

				// 7. Execute Credential Request
				const finalResult = await safeFetchJson(targetUrl, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						"Authorization": `Bearer ${tokenData.access_token}`,
						"DPoP": dpop_jwt
					},
					body: JSON.stringify({
						"credential_configuration_ids": ["urn:eudi:pid:1:dc"],
						"proofs": { "jwt": [proof_jwt] }
					}),
				});

				// 8. Add to Keystore
				if (finalResult && finalResult.credentials && finalResult.credentials.length > 0) {
					const rawCredential = finalResult.credentials[0].credential;
					const kid = await jose.calculateJwkThumbprint(jwk, "sha256");

					// We pass an array containing exactly one credential object
					const [, privateData, keystoreCommit] = await keystore.addCredentials([{
						data: rawCredential,
						format: "vc+sd-jwt",
						kid: kid,
						credentialConfigurationId: "urn:eudi:pid:1:dc",
						credentialIssuerIdentifier: BASE_URL,
						batchId: Date.now(),
						instanceId: 0,
						claims: {
							given_name: "John",
							family_name: "Doe",
							vct: "urn:eudi:pid:1"
						}
					}]);

					await api.updatePrivateData(privateData);
					await keystoreCommit();
					notify("newCredential");
					setIsSuccess(true);
					setIsProcessing(false);
					setTimeout(() => navigate('/'), 2500);
				}
			} catch (err) {
				console.error("Claim Error:", err);
				setError(err.message);
				setIsProcessing(false);
			}
		};

		handleClaim();
	}, [api, keystore, navigate, preAuthCode, issuerState]);

	return (
		<PopupLayout
			isOpen={true}
			loading={isProcessing}
			onClose={() => navigate('/')}
		>
			<div className="flex flex-col items-center justify-center py-6 text-center">
				{isSuccess ? (
					<div className="animate-in fade-in zoom-in duration-500">
						<div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 text-green-500 mb-4 mx-auto">
							<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-8 h-8">
								<path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
							</svg>
						</div>
						<H1 heading="Success!" />
						<p className="text-lm-gray-600 dark:text-dm-gray-400 mt-2">
							The credential has been securely added to your wallet.
						</p>
					</div>
				) : error ? (
					<div className="animate-in fade-in slide-in-from-bottom-4">
						<div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
								<span className="text-3xl font-bold">!</span>
						</div>
						<H1 heading="Issuance Failed" />
						<p className="text-xs font-mono text-red-400 bg-black/10 p-3 rounded-lg my-4 break-all">
							{error}
						</p>
						<Button onClick={() => window.location.reload()} variant="primary" additionalClassName="w-full">
							Try Again
						</Button>
					</div>
				) : null}
			</div>
		</PopupLayout>
	);
};

export default PreAuth;
