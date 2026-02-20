import React, { useEffect, useState, useContext, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import StatusContext from "../context/StatusContext";
import SessionContext from "../context/SessionContext";
import { useTranslation } from "react-i18next";
import { HandleAuthorizationRequestError } from "../lib/interfaces/IOpenID4VP";
import OpenID4VCIContext from "../context/OpenID4VCIContext";
import OpenID4VPContext from "../context/OpenID4VPContext";
import CredentialsContext from "../context/CredentialsContext";
import SyncPopup from "../components/Popups/SyncPopup";
import pkce from 'pkce-challenge';
import { calculateJwkThumbprint, exportJWK, generateKeyPair } from "jose";
import { generateDPoP } from '../lib/utils/dpop';
import { useHttpProxy } from "../lib/services/HttpProxy/HttpProxy";
import { notify } from "../context/notifier";
import * as config from '../config';




const MessagePopup = React.lazy(() => import('../components/Popups/MessagePopup'));
const PinInputPopup = React.lazy(() => import('../components/Popups/PinPopup'));


export const UriHandlerProvider = ({ children }: React.PropsWithChildren) => {
		const { isLoggedIn, api, keystore, logout } = useContext(SessionContext);
		const location = useLocation();
		const { t } = useTranslation();

		const [usedAuthorizationCodes, setUsedAuthorizationCodes] = useState<string[]>([]);
		const { openID4VCI } = useContext(OpenID4VCIContext);
		const { openID4VP } = useContext(OpenID4VPContext);
		const { handleCredentialOffer, generateAuthorizationRequest, handleAuthorizationResponse , handlePreAuthorization} = openID4VCI;
		const { handleAuthorizationRequest, promptForCredentialSelection, sendAuthorizationResponse } = openID4VP;
		const { vcEntityList } = useContext(CredentialsContext);
		const processedOffersRef = useRef<Set<string>>(new Set());
		const isProcessingRef = useRef(false);

		const [synced, setSynced] = useState(false);
		const [showPinInput, setShowPinInput] = useState(false);
		const [activeUrl, setActiveUrl] = useState<string | null>(null);
		const [pinLength, setPinLength] = useState<number>(4);
		const [pinInputMode, setPinInputMode] = useState<"numeric" | "text">("numeric");

		const [showMessagePopup, setMessagePopup] = useState(false);
		const [textMessagePopup, setTextMessagePopup] = useState({ title: "", description: "" });
		const [typeMessagePopup, setTypeMessagePopup] = useState("");
		const [showSyncPopup, setSyncPopup] = useState(false);
		const [textSyncPopup, setTextSyncPopup] = useState({ description: "" });
		const [redirectURI, setRedirectURI] = useState<string | null>(null);
		const httpProxy = useHttpProxy();
		const [commitStateChanges, setCommitStateChanges] = useState<number>(0);

		const handle = useCallback(async (urlToCheck: string, submittedPin?: string) => {
				if (!urlToCheck) return;
				const u = new URL(urlToCheck);
				if (u.searchParams.size === 0) return;
				// Prevent re-processing the same URL multiple times
				if (processedOffersRef.current.has(urlToCheck) && !submittedPin) {
						return;
				}
				if (u.protocol === 'openid-credential-offer:' || u.searchParams.get('credential_offer') || u.searchParams.get('credential_offer_uri')) {
						const offerParam = u.searchParams.get('credential_offer');
						const offerUri = u.searchParams.get('credential_offer_uri');
						let decoded = null;
						try {
								if (offerParam) {
										decoded = JSON.parse(decodeURIComponent(offerParam));
								} else if (offerUri) {
										const nestedUrl = new URL(offerUri);
										const nestedJson = nestedUrl.searchParams.get('credential_offer');
										if (nestedJson) decoded = JSON.parse(decodeURIComponent(nestedJson));
								}
								const preAuthGrant = decoded?.grants?.["urn:ietf:params:oauth:grant-type:pre-authorized_code"];
								if (preAuthGrant) {
										const url = new URL(offerUri);
										const rawOffer = url.searchParams.get('credential_offer');
										const decoded = JSON.parse(rawOffer);
										const configId = (decoded.credential_configuration_ids || decoded.credentials)?.[0];
										if (!configId) {
												throw new Error("No configuration IDs found in the Credential Offer.");
										}
										const issuerBaseUrl = decoded.credential_issuer.replace(/\/$/, '');
										const metadataUrl = `${issuerBaseUrl}/.well-known/openid-credential-issuer`;
										const { data: metadata } = await httpProxy.get(metadataUrl);
										const config = metadata["credential_configurations_supported"][configId];
										const format = config?.format;
										const preAuthGrant = decoded.grants?.["urn:ietf:params:oauth:grant-type:pre-authorized_code"];
										const pinRequired = !!preAuthGrant?.tx_code;
										const backendURL = decoded?.credential_issuer;
										if (pinRequired && !submittedPin) {
												setActiveUrl(urlToCheck);
												const txCodeSettings = preAuthGrant?.["tx_code"];
												setPinInputMode(txCodeSettings?.input_mode === "text" ? "text" : "numeric");
												setPinLength(txCodeSettings?.length || 4);
												setShowPinInput(true);
												return;
										}
										if (isProcessingRef.current) return;
										isProcessingRef.current = true;
										processedOffersRef.current.add(urlToCheck);
										window.history.replaceState({}, '', window.location.pathname);
										const { code_challenge, code_verifier } = await pkce();
										const tokenParams = new URLSearchParams({
												redirect_uri: redirectURI,
												grant_type: "urn:ietf:params:oauth:grant-type:pre-authorized_code", code: preAuthGrant["pre-authorized_code"], code_verifier
										});
										if (submittedPin) tokenParams.append("tx_code", submittedPin);
										const tokenData = await httpProxy.post(`${backendURL}/token`, {
											"grant_type": "urn:ietf:params:oauth:grant-type:pre-authorized_code",
											"pre-authorized_code": preAuthGrant["pre-authorized_code"],
											"tx_code": submittedPin
										}, {
											"Content-Type": "application/json",
										});
										const nonceData = await httpProxy.post(`${backendURL}/nonce`, {},{})
										const { privateKey, publicKey } = await generateKeyPair('ES256', { extractable: true });
										const jwk = await exportJWK(publicKey);
										const dpop = await generateDPoP(privateKey, jwk, "POST", `${backendURL}/credentials`, nonceData.data['c_nonce']);
										const [{ proof_jwts }] = await keystore.generateOpenid4vciProofs([{
												nonce: nonceData.data['c_nonce'], issuer: backendURL, audience: backendURL
										}]);
										const credentialResponse = await httpProxy.post(`${backendURL}/credentials`, {
											"credential_configuration_ids": preAuthGrant["credential_configuration_ids"],
											"proofs": { "jwt": [proof_jwts[0]] },
											"format": format
									}, {
										"Content-Type": "application/json",
										"Authorization": `Bearer ${tokenData.data['access_token']}`,
										"DPoP": dpop
								});
								const rawCredential = credentialResponse.data;
								const kid = await calculateJwkThumbprint(jwk, "sha256");
								const [, privateData, keystoreCommit] = await keystore.addCredentials([{
												data: rawCredential['credential'],
												format: format,
												kid: kid,
												credentialConfigurationId: preAuthGrant["credential_configuration_ids"],
												credentialIssuerIdentifier: preAuthGrant["credential_issuer"],
												batchId: Date.now(),
												instanceId: 0,
										}]);
								await api.updatePrivateData(privateData);
								await keystoreCommit();
								setCommitStateChanges(1);
								notify("newCredential");
								isProcessingRef.current = false;
								} else {
										const { credentialIssuer, selectedCredentialConfigurationId, issuer_state } = await handleCredentialOffer(u.toString());
										const res = await generateAuthorizationRequest(credentialIssuer, selectedCredentialConfigurationId, issuer_state);
										if (res?.url) window.location.href = res.url;
								}
						} catch (e) {
								console.error("[Uri Handler] VCI Error:", e);
								isProcessingRef.current = false;
						}
				}
				else if (u.searchParams.get('code') && !usedAuthorizationCodes.includes(u.searchParams.get('code')!)) {
						const code = u.searchParams.get('code')!;
						setUsedAuthorizationCodes((prev) => [...prev, code]);
						handleAuthorizationResponse(u.toString()).catch(console.error);
				}
				else if (u.searchParams.get('client_id') && u.searchParams.get('request_uri') && !usedRequestUris.includes(u.searchParams.get('request_uri')!)) {
						const reqUri = u.searchParams.get('request_uri')!;
						setUsedRequestUris((prev) => [...prev, reqUri]);
						try {
								const result = await handleAuthorizationRequest(u.toString(), vcEntityList);
								if ('error' in result) {
										const isInsufficient = result.error === HandleAuthorizationRequestError.INSUFFICIENT_CREDENTIALS;
										setTextMessagePopup({
												title: t(isInsufficient ? 'messagePopup.insufficientCredentials.title' : 'messagePopup.nonTrustedVerifier.title'),
												description: t(isInsufficient ? 'messagePopup.insufficientCredentials.description' : 'messagePopup.nonTrustedVerifier.description')
										});
										setTypeMessagePopup('error');
										setMessagePopup(true);
										return;
								}
								const selection = await promptForCredentialSelection(Object.fromEntries(result.conformantCredentialsMap), result.verifierDomainName, result.verifierPurpose, result.parsedTransactionData);
								if (selection instanceof Map) {
										const res = await sendAuthorizationResponse(selection, vcEntityList);
										if (res?.url) setRedirectURI(res.url);
								}
						} catch (err) {
							console.error("[Uri Handler] VP Error:", err);
						}
				}
		}, [isLoggedIn, vcEntityList, synced, keystore, api, handleCredentialOffer, generateAuthorizationRequest, handleAuthorizationResponse, handleAuthorizationRequest, promptForCredentialSelection, sendAuthorizationResponse, t]);

		useEffect(() => {
				if (isLoggedIn && synced && keystore.getCalculatedWalletState() && !showPinInput) {
						handle(window.location.href);
				}
		}, [location.pathname, location.search, isLoggedIn, synced, handle, showPinInput]);
		useEffect(() => {
				if (redirectURI) window.location.href = redirectURI;
		}, [redirectURI]);

		useEffect(() => {
				if (keystore.getCalculatedWalletState()) setSynced(true);
		}, [keystore]);

		return (
				<>
						{children}
						<PinInputPopup
								isOpen={showPinInput}
								setIsOpen={setShowPinInput}
								inputsCount={pinLength}
								inputsMode={pinInputMode}
								onCancel={() => { setShowPinInput(false); setActiveUrl(null); }}
								onSubmit={(pin) => {
										setShowPinInput(false);
										if (activeUrl) handle(activeUrl, pin);
								}}
						/>
						{showMessagePopup && (
								<MessagePopup type={typeMessagePopup} message={textMessagePopup} onClose={() => setMessagePopup(false)} />
						)}
						{showSyncPopup && (
								<SyncPopup message={textSyncPopup} onClose={() => { setSyncPopup(false); logout(); }} />
						)}
				</>
		);
};
