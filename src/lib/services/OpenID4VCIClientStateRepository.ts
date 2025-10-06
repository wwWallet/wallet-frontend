import { useContext, useCallback, useMemo, useRef, useEffect, useState } from "react";
import SessionContext from "@/context/SessionContext";
import { CurrentSchema } from "@/services/WalletStateSchema";
import { WalletStateUtils } from "@/services/WalletStateUtils";
import { IOpenID4VCIClientStateRepository } from "../interfaces/IOpenID4VCIClientStateRepository";
import { OPENID4VCI_TRANSACTION_ID_LIFETIME_IN_SECONDS } from "@/config";
import { last } from "@/util";

type WalletStateCredentialIssuanceSession = CurrentSchema.WalletStateCredentialIssuanceSession;

export function useOpenID4VCIClientStateRepository(): IOpenID4VCIClientStateRepository {

	const { api, keystore } = useContext(SessionContext);

	const { getCalculatedWalletState, saveCredentialIssuanceSessions } = keystore;
	// key: sessionId
	const sessions = useRef<Map<number, WalletStateCredentialIssuanceSession>>(null);
	const [initialized, setInitialized] = useState<boolean>(false);

	const getRememberIssuerAge = useCallback(async (): Promise<number | null> => {
		if (!getCalculatedWalletState) {
			return null;
		}
		const S = getCalculatedWalletState();
		if (!S) {
			return null;
		}
		return parseInt(S.settings['openidRefreshTokenMaxAgeInSeconds']);
	}, [getCalculatedWalletState]);

	const loadSessions = useCallback(() => {
		const S = getCalculatedWalletState();
		if (!S) {
			return;
		}

		const x = new Map();
		S.credentialIssuanceSessions.map((session) => {
			x.set(session.sessionId, session);
		});
		sessions.current = x;
		setInitialized(true);
	}, [getCalculatedWalletState, setInitialized]);

	useEffect(() => {
		loadSessions();
	}, [loadSessions]);

	const isInitialized = useCallback(() => {
		return (initialized);
	}, [initialized]);


	const cleanupExpired = useCallback(async (): Promise<number[]> => {
		if (!sessions.current) {
			return;
		}
		const rememberIssuerForSeconds = await getRememberIssuerAge();
		console.log("Rememeber issuer for seconds = ", rememberIssuerForSeconds)

		if (rememberIssuerForSeconds == null) {
			return;
		}
		const now = Math.floor(new Date().getTime() / 1000);
		const deletedSessions = [];
		for (const [k, v] of sessions.current) {
			if (v.created && typeof v.created === 'number') {
				if (v?.credentialEndpoint?.transactionId && now - v.created > OPENID4VCI_TRANSACTION_ID_LIFETIME_IN_SECONDS) {
					sessions.current.delete(k);
					deletedSessions.push(k);
				}
				else if (!v?.credentialEndpoint?.transactionId && now - v.created > rememberIssuerForSeconds) {
					sessions.current.delete(k);
					deletedSessions.push(k);
				}
			}
		}
		return deletedSessions;
	}, [getRememberIssuerAge]);

	const commitStateChanges = useCallback(async (): Promise<void> => {
		const S = getCalculatedWalletState();
		if (!S) {
			return;
		}
		if (!sessions.current) {
			return;
		}
		const deletedSessions = await cleanupExpired();
		const [{ }, newPrivateData, keystoreCommit] = await saveCredentialIssuanceSessions(Array.from(sessions.current.values()), deletedSessions);
		await api.updatePrivateData(newPrivateData);
		await keystoreCommit();
		console.log("CHANGES WRITTEN")
	}, [getCalculatedWalletState, saveCredentialIssuanceSessions, api, cleanupExpired]);



	const getByCredentialIssuerIdentifierAndCredentialConfigurationId = useCallback(async (
		credentialIssuer: string,
		credentialConfigurationId: string
	): Promise<WalletStateCredentialIssuanceSession | null> => {
		if (!sessions.current) {
			return null;
		}
		const r = Array.from(sessions.current.values()).filter((S) => S.credentialConfigurationId === credentialConfigurationId && S.credentialIssuerIdentifier === credentialIssuer);
		const res = last(r);
		return res ? res : null;
	},
		[]
	);

	const getByState = useCallback(
		async (state: string): Promise<WalletStateCredentialIssuanceSession | null> => {
			if (!sessions.current) {
				return null;
			}
			const r = Array.from(sessions.current.values()).filter((S) => S.state === state);
			const res = last(r);
			return res ? res : null;
		},
		[]
	);

	const create = useCallback(
		async (state: WalletStateCredentialIssuanceSession): Promise<void> => {
			if (!sessions.current) {
				return;
			}
			const existingState = await getByCredentialIssuerIdentifierAndCredentialConfigurationId(
				state.credentialIssuerIdentifier,
				state.credentialConfigurationId
			);

			if (existingState) {
				sessions.current.delete(existingState.sessionId);
			}
			const sessionId = WalletStateUtils.getRandomUint32();
			sessions.current.set(sessionId, { ...state });
		},
		[]
	);

	const updateState = useCallback(
		async (newState: WalletStateCredentialIssuanceSession): Promise<void> => {
			if (!sessions.current) {
				return;
			}
			const fetched = await getByState(newState.state);
			if (!fetched) {
				return;
			}
			sessions.current.set(fetched.sessionId, newState);
		},
		[getByState, isInitialized]
	);

	const getAllStatesWithNonEmptyTransactionId = useCallback(
		async (): Promise<WalletStateCredentialIssuanceSession[]> => {
			if (!sessions.current) {
				return [];
			}
			const pendingTransactions = Array.from(sessions.current.values())
				.filter((session: WalletStateCredentialIssuanceSession) =>
					session.credentialEndpoint && session.credentialEndpoint.transactionId != undefined && typeof session.credentialEndpoint.transactionId === 'string'
				);
			return pendingTransactions;
		}
		, []);

	return useMemo(() => {
		return {
			isInitialized: isInitialized,
			getByCredentialIssuerIdentifierAndCredentialConfigurationId,
			getByState,
			cleanupExpired,
			create,
			updateState,
			commitStateChanges,
			getAllStatesWithNonEmptyTransactionId,
		}
	}, [
		isInitialized,
		sessions,
		getByCredentialIssuerIdentifierAndCredentialConfigurationId,
		getByState,
		cleanupExpired,
		create,
		updateState,
		commitStateChanges,
		getAllStatesWithNonEmptyTransactionId,
	]);
}
