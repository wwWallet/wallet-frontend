import { useCallback, useContext, useEffect, useState, useMemo } from "react";
import { useNavigate } from 'react-router-dom';

import * as config from "../config";
import { useClearStorages, useLocalStorage, useSessionStorage } from "../hooks/useStorage";
import { toBase64Url } from "../util";
import { useIndexedDb } from "../hooks/useIndexedDb";
import { useOnUserInactivity } from "../hooks/useOnUserInactivity";

import * as keystore from "./keystore";
import type {
	AsymmetricEncryptedContainer,
	AsymmetricEncryptedContainerKeys,
	EncryptedContainer,
	OpenedContainer,
	PrecreatedPublicKeyCredential,
	PrivateData,
	UnlockSuccess,
	WebauthnPrfEncryptionKeyInfo,
	WebauthnPrfSaltInfo,
	WrappedKeyInfo,
} from "./keystore";
import { MDoc } from "@auth0/mdl";
import { WalletStateUtils } from "./WalletStateUtils";
import { addAlterSettingsEvent, addDeleteCredentialEvent, addDeleteKeypairEvent, addNewCredentialEvent, addNewPresentationEvent, addSaveCredentialIssuanceSessionEvent, CurrentSchema, foldOldEventsIntoBaseState } from "./WalletStateSchema";
import { PublicKeyCredentialCreation } from "../types/webauthn";
import WebauthnInteractionDialogContext, { UiStateMachineFunction } from "../context/WebauthnInteractionDialogContext";
import { useTranslation } from "react-i18next";
import { StorableCredential } from "@/lib/types/StorableCredential";
import { PointG1 } from "wallet-common/dist/bbs/index";
import { JWK } from "jose";


type UserData = {
	displayName: string;
	userHandle: Uint8Array;
}

export type CachedUser = {
	displayName: string;

	// Authenticator may return `userHandle: null` when authenticating with
	// non-empty `allowCredentials` (which we do when evaluating PRF), but the
	// backend requires the user handle during login (which we do simultaneously
	// with PRF evaluation for cached credentials)
	userHandleB64u: string;

	prfKeys: WebauthnPrfSaltInfo[];
}

export enum KeystoreEvent {
	/** This event should be propagated to needed tabs which must clean SessionStorage. */
	CloseSessionTabLocal = 'keystore.closeSessionTabLocal',
}

export type CommitCallback = () => Promise<void>;
export interface LocalStorageKeystore {
	isOpen(): boolean,
	close(): Promise<void>,

	initPassword(password: string): Promise<[EncryptedContainer, (userHandleB64u: string) => void]>,
	initWebauthn(
		credentialOrCreateOptions: PrecreatedPublicKeyCredential | CredentialCreationOptions,
		promptForPrfRetry: () => Promise<boolean | AbortSignal>,
		user: UserData,
	): Promise<[PublicKeyCredential & { response: AuthenticatorAttestationResponse }, EncryptedContainer]>,
	beginAddPrf(createOptions: CredentialCreationOptions): Promise<PrecreatedPublicKeyCredential>,
	finishAddPrf(
		credential: PrecreatedPublicKeyCredential,
		[existingUnwrapKey, wrappedMainKey]: [CryptoKey, WrappedKeyInfo],
		promptForPrfRetry: () => Promise<boolean | AbortSignal>,
	): Promise<[EncryptedContainer, CommitCallback]>,
	deletePrf(credentialId: Uint8Array): [EncryptedContainer, CommitCallback],
	unlockPassword(
		privateData: EncryptedContainer,
		password: string,
		user: UserData,
	): Promise<[EncryptedContainer, CommitCallback] | null>,
	unlockPrf(
		privateData: EncryptedContainer,
		credential: PublicKeyCredential,
		promptForPrfRetry: () => Promise<boolean | AbortSignal>,
		user: CachedUser | UserData,
	): Promise<[EncryptedContainer, CommitCallback] | null>,
	getPrfKeyInfo(id: BufferSource): WebauthnPrfEncryptionKeyInfo | undefined,
	getPasswordOrPrfKeyFromSession(
		promptForPassword: () => Promise<string | null>,
		promptForPrfRetry: () => Promise<boolean | AbortSignal>,
	): Promise<[CryptoKey, WrappedKeyInfo]>,
	upgradePrfKey(prfKeyInfo: WebauthnPrfEncryptionKeyInfo, promptForPrfRetry: () => Promise<boolean | AbortSignal>): Promise<[EncryptedContainer, CommitCallback]>,
	getCachedUsers(): CachedUser[],
	forgetCachedUser(user: CachedUser): void,
	getUserHandleB64u(): string | null,
	signJwtPresentation(nonce: string, audience: string, verifiableCredentials: any[], transactionDataResponseParams?: { transaction_data_hashes: string[], transaction_data_hashes_alg: string[] }): Promise<{ vpjwt: string }>,
	signSplitBbs(vcEntity: StorableCredential, t2bar: PointG1, c_host: bigint): Promise<BufferSource>,
	generateOpenid4vciProofs(requests: { nonce: string, audience: string, issuer: string }[]): Promise<[
		{ proof_jwts: string[] },
		AsymmetricEncryptedContainer,
		CommitCallback,
	]>,

	generateKeypairs(n: number): Promise<[
		{ keypairs: keystore.CredentialKeyPair[] },
		AsymmetricEncryptedContainer,
		CommitCallback,
	]>,
	generateBbsKeypair(): Promise<[
		{ publicJwk: JWK },
		AsymmetricEncryptedContainer,
		CommitCallback,
	]>,

	generateDeviceResponse(mdocCredential: MDoc, presentationDefinition: any, mdocGeneratedNonce: string, verifierGeneratedNonce: string, clientId: string, responseUri: string): Promise<{ deviceResponseMDoc: MDoc }>,
	generateDeviceResponseWithProximity(mdocCredential: MDoc, presentationDefinition: any, sessionTranscriptBytes: any): Promise<{ deviceResponseMDoc: MDoc }>,

	getCalculatedWalletState(): CurrentSchema.WalletState | null,
	addCredentials(credentials: { data: string, format: string, kid: string, batchId: number, credentialIssuerIdentifier: string, credentialConfigurationId: string, instanceId: number, credentialId?: number }[]): Promise<[
		{},
		AsymmetricEncryptedContainer,
		CommitCallback,
	]>,
	deleteCredentialsByBatchId(batchId: number): Promise<[
		{},
		AsymmetricEncryptedContainer,
		CommitCallback,
	]>,
	getAllCredentials(): Promise<CurrentSchema.WalletStateCredential[] | null>,
	addPresentations(presentations: { transactionId: number, data: string, usedCredentialIds: number[], audience: string, }[]): Promise<[
		{},
		AsymmetricEncryptedContainer,
		CommitCallback,
	]>,
	getAllPresentations(): Promise<CurrentSchema.WalletStatePresentation[] | null>,
	saveCredentialIssuanceSessions(issuanceSessions: CurrentSchema.WalletStateCredentialIssuanceSession[]): Promise<[
		{},
		AsymmetricEncryptedContainer,
		CommitCallback,
	]>,
	getCredentialIssuanceSessionByState(state: string): Promise<CurrentSchema.WalletStateCredentialIssuanceSession | null>,
	alterSettings(settings: CurrentSchema.WalletStateSettings): Promise<[
		{},
		AsymmetricEncryptedContainer,
		CommitCallback,
	]>,
}

/** A stateful wrapper around the keystore module, storing state in the browser's localStorage and sessionStorage. */
export function useLocalStorageKeystore(eventTarget: EventTarget): LocalStorageKeystore {
	const [cachedUsers, setCachedUsers,] = useLocalStorage<CachedUser[]>("cachedUsers", []);
	const [privateData, setPrivateData] = useState<EncryptedContainer | null>(null);

	const [globalUserHandleB64u, setGlobalUserHandleB64u, clearGlobalUserHandleB64u] = useLocalStorage<string | null>("userHandle", null);
	const [userHandleB64u, setUserHandleB64u, clearUserHandleB64u] = useSessionStorage<string | null>("userHandle", null);

	// A unique id for each logged in tab
	const [globalTabId, setGlobalTabId, clearGlobalTabId] = useLocalStorage<string | null>("globalTabId", null);
	const [tabId, setTabId, clearTabId] = useSessionStorage<string | null>("tabId", null);

	const [mainKey, setMainKey, clearMainKey] = useSessionStorage<BufferSource | null>("mainKey", null);
	const [calculatedWalletState, setCalculatedWalletState] = useState<CurrentSchema.WalletState | null>(null);
	const clearSessionStorage = useClearStorages(clearUserHandleB64u, clearMainKey, clearTabId);

	const navigate = useNavigate();

	const { t } = useTranslation();
	const webauthnInteractionCtx = useContext(WebauthnInteractionDialogContext);

	const idb = useIndexedDb("wallet-frontend", 3, useCallback((db, prevVersion, newVersion) => {
		if (prevVersion < 1) {
			const objectStore = db.createObjectStore("keys", { keyPath: "id" });
			objectStore.createIndex("id", "id", { unique: true });
		}
		if (prevVersion < 2) {
			if (db.objectStoreNames.contains("keys")) {
				db.deleteObjectStore("keys");
			}
		}

		if (prevVersion < 3) {
			db.createObjectStore("privateData", { keyPath: "userHandle" });
		}
	}, []));

	useEffect(() => {
		if (userHandleB64u) {
			readPrivateDataFromIdb(userHandleB64u).then((val) => {
				if (val) {
					setPrivateData(val);
				}
			})
		}
	}, [userHandleB64u]);


	const writePrivateDataOnIdb = async (privateData: EncryptedContainer | null, userHandleB64u: string) => {
		await idb.write(["privateData"], (tx) => {
			const store = tx.objectStore("privateData");
			return store.put({ userHandle: userHandleB64u, content: privateData });
		})
	}

	const readPrivateDataFromIdb = async (userHandleB64u: string): Promise<EncryptedContainer | null> => {
		const result = await idb.read(['privateData'], (tx) => {
			const store = tx.objectStore("privateData");
			return store.get(userHandleB64u);
		});
		return result ? result.content : null;
	}

	const clearPrivateData = async (userHandleB64u: string) => {
		setPrivateData(null);
		await writePrivateDataOnIdb(null, userHandleB64u);
	}

	const closeSessionTabLocal = useCallback(
		async (): Promise<void> => {
			eventTarget.dispatchEvent(new CustomEvent(KeystoreEvent.CloseSessionTabLocal));
			clearSessionStorage();
		},
		[clearSessionStorage, eventTarget],
	);

	const close = useCallback(
		async (): Promise<void> => {
			console.log('Keystore Close');
			await clearPrivateData(userHandleB64u);
			await idb.destroy();
			setCalculatedWalletState(null);
			clearGlobalUserHandleB64u();
			clearGlobalTabId();
		},
		[idb, clearGlobalUserHandleB64u, clearGlobalTabId, clearPrivateData, setCalculatedWalletState, userHandleB64u],
	);

	useOnUserInactivity(close, config.INACTIVE_LOGOUT_MILLIS);

	useEffect(
		() => {
			if (privateData && userHandleB64u && (userHandleB64u === globalUserHandleB64u)) {
				// When PRF keys are added, deleted or edited in any tab,
				// propagate changes to cached users
				setCachedUsers((cachedUsers) => cachedUsers.map((cu) => {
					if (cu.userHandleB64u === userHandleB64u) {
						return {
							...cu,
							prfKeys: privateData.prfKeys.map((keyInfo) => ({
								credentialId: keyInfo.credentialId,
								transports: keyInfo.transports,
								prfSalt: keyInfo.prfSalt,
							})),
						};
					} else {
						return cu;
					}
				}));
			}
		},
		[closeSessionTabLocal, privateData, userHandleB64u, globalUserHandleB64u, setCachedUsers],
	);

	useEffect(
		() => {
			if (tabId && globalTabId && (tabId !== globalTabId)) {
				// When user logs in in any tab, log out in all other tabs
				closeSessionTabLocal();
			}
		},
		[closeSessionTabLocal, tabId, globalTabId],
	);

	useEffect(() => {
		const checkPrivateData = async () => {
			if (!globalUserHandleB64u) {
				closeSessionTabLocal();
				return;
			}

			const privateData = await readPrivateDataFromIdb(globalUserHandleB64u);
			if (!privateData) {
				closeSessionTabLocal();
			}
		};

		checkPrivateData();
	}, [closeSessionTabLocal, globalUserHandleB64u]);

	const openPrivateData = useCallback(async (): Promise<[PrivateData, CryptoKey, CurrentSchema.WalletState]> => {
		if (mainKey && privateData) {
			try {
				return await keystore.openPrivateData(mainKey, privateData);
			}
			catch (err) {
				console.error(err);
				console.log("Navigating to login-state to handle JWE decryption failure");
				const queryParams = new URLSearchParams(window.location.search);
				queryParams.delete('user');
				queryParams.delete('sync');

				queryParams.append('user', userHandleB64u);
				queryParams.append('sync', 'fail');
				navigate(`${window.location.pathname}?${queryParams.toString()}`, { replace: true });
				return null;
			}
		} else {
			throw new Error("Private data not present in storage.");
		}
	}, [mainKey, privateData]);

	const editPrivateData = useCallback(async <T>(
		action: (container: OpenedContainer) => Promise<[T, OpenedContainer]>,
	): Promise<[T, AsymmetricEncryptedContainer, CommitCallback]> => {
		if (mainKey && privateData) {
			const [result, [newPrivateData, newMainKey]] = await action(
				[
					keystore.assertAsymmetricEncryptedContainer(privateData),
					await keystore.importMainKey(mainKey),
				],
			);
			// after private data update, the calculated wallet state must be re-computed
			const [, , newCalculatedWalletState] = await keystore.openPrivateData(await keystore.exportMainKey(newMainKey), newPrivateData);
			return [
				result,
				newPrivateData,
				async () => {
					await writePrivateDataOnIdb(newPrivateData, userHandleB64u);
					setCalculatedWalletState(newCalculatedWalletState);
					setPrivateData(newPrivateData);
					setMainKey(await keystore.exportMainKey(newMainKey));
				},
			];
		} else {
			throw new Error("Private data not present in storage.");
		}
	}, [mainKey, privateData, setPrivateData, setMainKey]);

	const finishUnlock = useCallback(async (
		{ exportedMainKey, privateData }: UnlockSuccess,
		user: CachedUser | UserData | null,
	): Promise<void> => {
		if (user) {
			const userHandleB64u = ("prfKeys" in user
				? user.userHandleB64u
				: toBase64Url(user.userHandle)
			);
			const newUser = ("prfKeys" in user
				? user
				: {
					displayName: user.displayName,
					userHandleB64u,
					prfKeys: [], // Placeholder - will be updated by useEffect above
				}
			);

			setUserHandleB64u(userHandleB64u);

			const newTabId = tabId ?? WalletStateUtils.getRandomUint32().toString();
			setTabId(newTabId);
			setGlobalTabId(newTabId);

			// This must happen before setPrivateData in order to prevent the
			// useEffect updating cachedUsers from corrupting cache entries for other
			// users logged in in other tabs.
			setGlobalUserHandleB64u(userHandleB64u);
			await writePrivateDataOnIdb(privateData, userHandleB64u);

			setCachedUsers((cachedUsers) => {
				// Move most recently used user to front of list
				const otherUsers = (cachedUsers || []).filter((cu) => cu.userHandleB64u !== newUser.userHandleB64u);
				return [newUser, ...otherUsers];
			});
		}

		setMainKey(exportedMainKey);
		setPrivateData(privateData);
		// after private data update, the calculated wallet state must be re-computed
		const [, , newCalculatedWalletState] = await keystore.openPrivateData(exportedMainKey, privateData);
		setCalculatedWalletState(newCalculatedWalletState);
	}, [
		setUserHandleB64u,
		setGlobalUserHandleB64u,
		setCachedUsers,
		setMainKey,
		setPrivateData,
		setCalculatedWalletState,
		setTabId,
		setGlobalTabId,
		tabId
	]);


	useEffect(() => {
		// initialize calculated wallet state
		if (mainKey && privateData && calculatedWalletState === null) {
			openPrivateData().then(([container, , newCalculatedWalletState]) => {
				console.log("State container = ", container);
				console.log("Calculated wallet state = ", newCalculatedWalletState);

				setCalculatedWalletState(newCalculatedWalletState);
			});
		}
	}, [mainKey, privateData, calculatedWalletState]);

	const init = useCallback(async (
		mainKey: CryptoKey,
		keyInfo: AsymmetricEncryptedContainerKeys,
		user: UserData | null,
		credential: PublicKeyCredentialCreation | null,
	): Promise<EncryptedContainer> => {
		const unlocked = await keystore.init(mainKey, keyInfo, credential);
		await finishUnlock(unlocked, user);
		const { privateData } = unlocked;
		return privateData;
	},
		[finishUnlock]
	);

	const unlockPassword = useCallback(
		async (
			privateData: EncryptedContainer,
			password: string,
			user: UserData,
		): Promise<[EncryptedContainer, CommitCallback] | null> => {
			const [unlockResult, newPrivateData] = await keystore.unlockPassword(privateData, password);
			await finishUnlock(unlockResult, user);
			return (
				newPrivateData
					?
					[newPrivateData,
						async () => {
							await writePrivateDataOnIdb(newPrivateData, userHandleB64u);
							setPrivateData(newPrivateData);
						},
					]
					: null
			);
		},
		[finishUnlock, setPrivateData]
	);

	const initWebauthn = useCallback(
		async (
			credentialOrCreateOptions: PrecreatedPublicKeyCredential | CredentialCreationOptions,
			promptForPrfRetry: () => Promise<boolean | AbortSignal>,
			user: UserData,
		): Promise<[PublicKeyCredentialCreation, EncryptedContainer]> => {
			const { credential, mainKey, keyInfo } = await keystore.initWebauthn(credentialOrCreateOptions, promptForPrfRetry);
			const result = await init(mainKey, keyInfo, user, credential);
			return [credential, result];
		},
		[init]
	);

	const initPassword = useCallback(
		async (password: string): Promise<[EncryptedContainer, (userHandleB64u: string) => void]> => {
			const { mainKey, keyInfo } = await keystore.initPassword(password);
			return [await init(mainKey, keyInfo, null, null), setUserHandleB64u];
		},
		[init, setUserHandleB64u]
	);

	const getPrfKeyInfo = useCallback(
		(id: BufferSource): WebauthnPrfEncryptionKeyInfo | undefined => {
			return privateData?.prfKeys.find(({ credentialId }) => toBase64Url(credentialId) === toBase64Url(id));
		},
		[privateData]
	);


	const getCachedUsers = useCallback((): CachedUser[] => {
		return [...(cachedUsers || [])];
	}, [cachedUsers]);

	const forgetCachedUser = useCallback((user: CachedUser): void => {
		setCachedUsers((cachedUsers) => cachedUsers.filter((cu) => cu.userHandleB64u !== user.userHandleB64u));
	}, [setCachedUsers]);

	const getUserHandleB64u = useCallback((): string | null => {
		return (userHandleB64u);
	}, [userHandleB64u]);


	const beginAddPrf = useCallback(
		async (createOptions: CredentialCreationOptions): Promise<PrecreatedPublicKeyCredential> => {
			return await keystore.beginAddPrf(createOptions);
		},
		[keystore],
	);

	const finishAddPrf = useCallback(
		async (
			credential: PrecreatedPublicKeyCredential,
			[existingUnwrapKey, wrappedMainKey]: [CryptoKey, WrappedKeyInfo],
			promptForPrfRetry: () => Promise<boolean | AbortSignal>,
		): Promise<[EncryptedContainer, CommitCallback]> => {
			const newPrivateData = await keystore.finishAddPrf(
				privateData,
				credential,
				[existingUnwrapKey, wrappedMainKey],
				promptForPrfRetry,
			);
			return [
				newPrivateData,
				async () => {
					await writePrivateDataOnIdb(newPrivateData, userHandleB64u);
					setPrivateData(newPrivateData);
				},
			];
		},
		[privateData, setPrivateData]
	);

	const deletePrf = useCallback(
		(credentialId: Uint8Array): [EncryptedContainer, CommitCallback] => {
			const newPrivateData = keystore.deletePrf(privateData, credentialId);
			return [
				newPrivateData,
				async () => {
					await writePrivateDataOnIdb(newPrivateData, userHandleB64u);
					setPrivateData(newPrivateData);
				},
			];
		},
		[privateData, setPrivateData]
	);

	const unlockPrf = useCallback(
		async (
			privateData: EncryptedContainer,
			credential: PublicKeyCredential,
			promptForPrfRetry: () => Promise<boolean | AbortSignal>,
			user: CachedUser | UserData | null,
		): Promise<[EncryptedContainer, CommitCallback] | null> => {
			const [unlockPrfResult, newPrivateData] = await keystore.unlockPrf(privateData, credential, promptForPrfRetry);
			await finishUnlock(unlockPrfResult, user);
			return (
				newPrivateData
					?
					[newPrivateData,
						async () => {
							await writePrivateDataOnIdb(newPrivateData, userHandleB64u);
							setPrivateData(newPrivateData);
						},
					]
					: null
			);
		},
		[finishUnlock, setPrivateData]
	);

	const getPasswordOrPrfKeyFromSession = useCallback(
		async (
			promptForPassword: () => Promise<string | null>,
			promptForPrfRetry: () => Promise<boolean | AbortSignal>,
		): Promise<[CryptoKey, WrappedKeyInfo]> => {
			if (privateData && privateData?.prfKeys?.length > 0) {
				const [prfKey, prfKeyInfo,] = await keystore.getPrfKey(privateData, null, promptForPrfRetry);
				return [prfKey, keystore.isPrfKeyV2(prfKeyInfo) ? prfKeyInfo : prfKeyInfo.mainKey];

			} else if (privateData && privateData?.passwordKey) {
				const password = await promptForPassword();
				if (password === null) {
					throw new Error("Password prompt aborted");
				} else {
					try {
						const [passwordKey, passwordKeyInfo] = await keystore.getPasswordKey(privateData, password);
						return [passwordKey, keystore.isAsymmetricPasswordKeyInfo(passwordKeyInfo) ? passwordKeyInfo : passwordKeyInfo.mainKey];
					} catch {
						throw new Error("Failed to unlock key store", { cause: { errorId: "passwordUnlockFailed" } });
					}
				}

			} else {
				throw new Error("Session not initialized");
			}
		},
		[privateData]
	);

	const upgradePrfKey = useCallback(
		async (
			prfKeyInfo: WebauthnPrfEncryptionKeyInfo,
			promptForPrfRetry: () => Promise<boolean | AbortSignal>,
		): Promise<[EncryptedContainer, CommitCallback]> => {
			if (keystore.isPrfKeyV2(prfKeyInfo)) {
				throw new Error("Key is already upgraded");

			} else if (privateData) {
				const newPrivateData = await keystore.upgradePrfKey(privateData, null, prfKeyInfo, promptForPrfRetry);
				return [
					newPrivateData,
					async () => {
						await writePrivateDataOnIdb(newPrivateData, userHandleB64u);
						setPrivateData(newPrivateData);
					},
				];

			} else {
				throw new Error("Session not initialized");
			}
		},
		[privateData, setPrivateData]
	);

	const signJwtPresentation = useCallback(
		async (nonce: string, audience: string, verifiableCredentials: any[], transactionDataResponseParams?: { transaction_data_hashes: string[], transaction_data_hashes_alg: string[] }): Promise<{ vpjwt: string }> => {
			const moveUiStateMachine = webauthnInteractionCtx.setup(
				t("Sign credential presentation"),
				state => {
					switch (state.id) {
						case 'intro':
							return {
								bodyText: t('To proceed, please authenticate with your passkey.'),
								buttons: {
									continue: 'intro:ok',
								},
							};

						case 'webauthn-begin':
							return {
								bodyText: t("Please interact with your authenticator..."),
							};

						case 'err':
							return {
								bodyText: t("An error occurred!"),
								buttons: {
									retry: true,
								},
							};

						case 'err:ext:sign:signature-not-found':
							return {
								bodyText: t("An error occurred: Signature not found."),
								buttons: {
									retry: true,
								},
							};

						case 'success':
							return {
								bodyText: t("Success! Please wait..."),
							};

						default:
							throw new Error('Unknown WebAuthn interaction state:', { cause: state });
					}
				},
			);

			return await keystore.signJwtPresentation(
				await openPrivateData(),
				nonce,
				audience,
				verifiableCredentials,
				async event => {
					if (event.id === "success") {
						moveUiStateMachine(event);
						return { id: "success:ok" };
					} else {
						return moveUiStateMachine(event);
					}
				},
				transactionDataResponseParams,
			);
		},
		[openPrivateData]
	);

	const signSplitBbs = useCallback(
		async (vcEntity: StorableCredential, t2bar: PointG1, c_host: bigint, uiStateMachine: UiStateMachineFunction): Promise<BufferSource> => {
			console.log("signSplitBbs", vcEntity, t2bar, c_host);
			const moveUiStateMachine = webauthnInteractionCtx.setup(
				t("Sign credential presentation"),
				state => {
					switch (state.id) {
						case 'intro':
							return {
								bodyText: t('To proceed, please authenticate with your passkey.'),
								buttons: {
									continue: 'intro:ok',
								},
							};

						case 'webauthn-begin':
							return {
								bodyText: t("Please interact with your authenticator..."),
							};

						case 'err':
							return {
								bodyText: t("An error occurred!"),
								buttons: {
									retry: true,
								},
							};

						case 'err:ext:sign:signature-not-found':
							return {
								bodyText: t("An error occurred: Signature not found."),
								buttons: {
									retry: true,
								},
							};

						case 'success':
							return {
								bodyText: t("Success! Please wait..."),
							};

						default:
							throw new Error('Unknown WebAuthn interaction state:', { cause: state });
					}
				},
			);
			return await keystore.signSplitBbs(
				await openPrivateData(),
				vcEntity,
				t2bar,
				c_host,
				async event => {
					if (event.id === "success") {
						moveUiStateMachine(event);
						return { id: "success:ok" };
					} else {
						return moveUiStateMachine(event);
					}
				},
			);
		},
		[openPrivateData]
	);

	const generateDeviceResponse = useCallback(
		async (mdocCredential: MDoc, presentationDefinition: any, mdocGeneratedNonce: string, verifierGeneratedNonce: string, clientId: string, responseUri: string): Promise<{ deviceResponseMDoc: MDoc }> => (
			await keystore.generateDeviceResponse(await openPrivateData(), mdocCredential, presentationDefinition, mdocGeneratedNonce, verifierGeneratedNonce, clientId, responseUri)
		),
		[openPrivateData]
	);

	const generateDeviceResponseWithProximity = useCallback(
		async (mdocCredential: MDoc, presentationDefinition: any, sessionTranscriptBytes: any): Promise<{ deviceResponseMDoc: MDoc }> => (
			await keystore.generateDeviceResponseWithProximity(await openPrivateData(), mdocCredential, presentationDefinition, sessionTranscriptBytes)
		),
		[openPrivateData]
	);

	const isOpen = useCallback((): boolean => {
		return privateData !== null && mainKey !== null;
	}, [privateData, mainKey]);

	const generateOpenid4vciProofs = useCallback(async (requests: { nonce: string, audience: string, issuer: string }[]): Promise<[
		{ proof_jwts: string[] },
		AsymmetricEncryptedContainer,
		CommitCallback,
	]> => (
		await editPrivateData(async (originalContainer) => {
			const { nonce, audience, issuer } = requests[0]; // the first row is enough since the nonce remains the same
			const [{ proof_jwts }, newContainer] = await keystore.generateOpenid4vciProofs(
				originalContainer,
				config.DID_KEY_VERSION,
				nonce,
				audience,
				issuer,
				(index: number) => webauthnInteractionCtx.setup(
					t("Sign credential issuance ({{currentNumber}} of {{totalNumber}})", { currentNumber: index + 1, totalNumber: requests.length }),
					state => {
						switch (state.id) {
							case 'intro':
								return {
									bodyText: t('To proceed, please authenticate with your passkey.'),
									buttons: {
										continue: 'intro:ok',
									},
								};

							case 'webauthn-begin':
								return {
									bodyText: t("Please interact with your authenticator..."),
								};

							case 'err':
								return {
									bodyText: t("An error occurred!"),
									buttons: {
										retry: true,
									},
								};

							case 'err:ext:sign:signature-not-found':
								return {
									bodyText: t("An error occurred: Signature not found."),
									buttons: {
										retry: true,
									},
								};

							case 'success':
								return {
									bodyText: t("Your credential has been issued successfully."),
									buttons: {
										continue: 'success:ok',
									},
								};

							default:
								throw new Error('Unknown WebAuthn interaction state:', { cause: state });
						}
					},
				),
				requests.length,
			);
			return [{ proof_jwts }, newContainer];
		})
	), [editPrivateData]);

	const generateKeypairs = useCallback(
		async (n: number): Promise<[
			{ keypairs: keystore.CredentialKeyPair[] },
			AsymmetricEncryptedContainer,
			CommitCallback,
		]> => (
			await editPrivateData(async (originalContainer) => {
				const [{ keypairs }, newContainer] = await keystore.generateKeypairs(
					originalContainer,
					config.DID_KEY_VERSION,
					n,
				);
				return [{ keypairs }, newContainer];
			})
		),
		[editPrivateData]
	);

	const getCalculatedWalletState = useCallback((): CurrentSchema.WalletState | null => {
		return (calculatedWalletState);
	}, [calculatedWalletState]);

	const addCredentials = useCallback(async (credentials: { data: string, format: string, kid: string, batchId: number, credentialIssuerIdentifier: string, credentialConfigurationId: string, instanceId: number, credentialId?: number, }[]): Promise<[
		{},
		AsymmetricEncryptedContainer,
		CommitCallback,
	]> => {
		let [walletStateContainer, ,] = await openPrivateData();
		walletStateContainer = await foldOldEventsIntoBaseState(walletStateContainer);

		for (const { data, format, batchId, credentialIssuerIdentifier, kid, credentialConfigurationId, instanceId, credentialId } of credentials) {
			walletStateContainer = await addNewCredentialEvent(walletStateContainer, data, format, kid, batchId, credentialIssuerIdentifier, credentialConfigurationId, instanceId, credentialId);
		}

		return editPrivateData(async (originalContainer) => {
			const { newContainer } = await keystore.updateWalletState(originalContainer, walletStateContainer);
			return [{}, newContainer];
		})
	}, [editPrivateData, openPrivateData])


	const getAllCredentials = useCallback(async (): Promise<CurrentSchema.WalletStateCredential[] | null> => {
		return calculatedWalletState ? calculatedWalletState.credentials : null;
	}, [calculatedWalletState]);


	const deleteCredentialsByBatchId = useCallback(async (batchId: number): Promise<[
		{},
		AsymmetricEncryptedContainer,
		CommitCallback,
	]> => {
		let [walletStateContainer, ,] = await openPrivateData();
		walletStateContainer = await foldOldEventsIntoBaseState(walletStateContainer);

		const credentialsToBeDeleted = calculatedWalletState.credentials.filter((cred) => cred.batchId === batchId);
		for (const cred of credentialsToBeDeleted) {
			walletStateContainer = await addDeleteCredentialEvent(walletStateContainer, cred.credentialId);
			// delete keypair
			const kid = calculatedWalletState.credentials.filter((c) => c.credentialId === cred.credentialId).map((c) => c.kid)[0];
			if (kid) {
				walletStateContainer = await addDeleteKeypairEvent(walletStateContainer, kid);
			}
		}

		return editPrivateData(async (originalContainer) => {
			const { newContainer } = await keystore.updateWalletState(originalContainer, walletStateContainer);
			return [{}, newContainer];
		});

	}, [editPrivateData, getAllCredentials, calculatedWalletState]);


	const addPresentations = useCallback(async (presentations: { transactionId: number, data: string, usedCredentialIds: number[], audience: string, }[]): Promise<[
		{},
		AsymmetricEncryptedContainer,
		CommitCallback,
	]> => {
		let [walletStateContainer, ,] = await openPrivateData();
		walletStateContainer = await foldOldEventsIntoBaseState(walletStateContainer);

		for (const { transactionId, data, usedCredentialIds, audience } of presentations) {
			walletStateContainer = await addNewPresentationEvent(walletStateContainer,
				transactionId,
				data,
				usedCredentialIds,
				Math.floor(new Date().getTime() / 1000),
				audience
			);
		}

		return editPrivateData(async (originalContainer) => {
			const { newContainer } = await keystore.updateWalletState(originalContainer, walletStateContainer);
			return [{}, newContainer];
		})
	}, [editPrivateData, openPrivateData])
	const getAllPresentations = useCallback(async (): Promise<CurrentSchema.WalletStatePresentation[] | null> => {
		return calculatedWalletState ? calculatedWalletState.presentations : null;
	}, [calculatedWalletState]);


	const saveCredentialIssuanceSessions = useCallback(async (issuanceSessions: CurrentSchema.WalletStateCredentialIssuanceSession[]): Promise<[
		{},
		AsymmetricEncryptedContainer,
		CommitCallback,
	]> => {
		let [walletStateContainer, ,] = await openPrivateData();
		walletStateContainer = await foldOldEventsIntoBaseState(walletStateContainer);

		for (const issuanceSession of issuanceSessions) {
			walletStateContainer = await addSaveCredentialIssuanceSessionEvent(walletStateContainer,
				issuanceSession.sessionId,
				issuanceSession.credentialIssuerIdentifier,
				issuanceSession.state,
				issuanceSession.code_verifier,
				issuanceSession.credentialConfigurationId,
				issuanceSession.tokenResponse,
				issuanceSession.dpop,
				issuanceSession.firstPartyAuthorization,
				issuanceSession.created
			);
		}

		return editPrivateData(async (originalContainer) => {
			const { newContainer } = await keystore.updateWalletState(originalContainer, walletStateContainer);
			return [{}, newContainer];
		});
	}, [editPrivateData, openPrivateData]);

	const getCredentialIssuanceSessionByState = useCallback(async (state: string): Promise<CurrentSchema.WalletStateCredentialIssuanceSession | null> => {
		return calculatedWalletState ? calculatedWalletState.credentialIssuanceSessions.filter((s: CurrentSchema.WalletStateCredentialIssuanceSession) => s.state === state)[0] : null;
	}, [editPrivateData, openPrivateData]);

	const alterSettings = useCallback(async (settings: CurrentSchema.WalletStateSettings): Promise<[
		{},
		AsymmetricEncryptedContainer,
		CommitCallback,
	]> => {
		let [walletStateContainer, ,] = await openPrivateData();
		walletStateContainer = await foldOldEventsIntoBaseState(walletStateContainer);
		walletStateContainer = await addAlterSettingsEvent(walletStateContainer, settings);

		return editPrivateData(async (originalContainer) => {
			const { newContainer } = await keystore.updateWalletState(originalContainer, walletStateContainer);
			return [{}, newContainer];
		});
	}, [editPrivateData, openPrivateData]);


	const generateBbsKeypair = useCallback(
		async (): Promise<[
			{ publicJwk: JWK },
			AsymmetricEncryptedContainer,
			CommitCallback,
		]> => (
			await editPrivateData(async (originalContainer) => {
				const [{ publicJwk }, newContainer] = await keystore.generateBbsKeypair(
					originalContainer,
					config.DID_KEY_VERSION,
				);
				return [{ publicJwk }, newContainer];
			})
		),
		[editPrivateData]
	);

	return useMemo(() => ({
		isOpen,
		close,
		initPassword,
		initWebauthn,
		beginAddPrf,
		finishAddPrf,
		deletePrf,
		unlockPassword,
		unlockPrf,
		getPrfKeyInfo,
		getPasswordOrPrfKeyFromSession,
		upgradePrfKey,
		getCachedUsers,
		forgetCachedUser,
		getUserHandleB64u,
		signJwtPresentation,
		signSplitBbs,
		generateOpenid4vciProofs,
		generateKeypairs,
		generateBbsKeypair,
		generateDeviceResponse,
		generateDeviceResponseWithProximity,
		getCalculatedWalletState,
		getAllCredentials,
		addCredentials,
		deleteCredentialsByBatchId,
		addPresentations,
		getAllPresentations,
		saveCredentialIssuanceSessions,
		getCredentialIssuanceSessionByState,
		alterSettings,
	}), [
		isOpen,
		close,
		initPassword,
		initWebauthn,
		beginAddPrf,
		finishAddPrf,
		deletePrf,
		unlockPassword,
		unlockPrf,
		getPrfKeyInfo,
		getPasswordOrPrfKeyFromSession,
		upgradePrfKey,
		getCachedUsers,
		forgetCachedUser,
		getUserHandleB64u,
		signJwtPresentation,
		signSplitBbs,
		generateOpenid4vciProofs,
		generateKeypairs,
		generateBbsKeypair,
		generateDeviceResponse,
		generateDeviceResponseWithProximity,
		getCalculatedWalletState,
		getAllCredentials,
		addCredentials,
		deleteCredentialsByBatchId,
		addPresentations,
		getAllPresentations,
		saveCredentialIssuanceSessions,
		getCredentialIssuanceSessionByState,
		alterSettings,
	]);
}
