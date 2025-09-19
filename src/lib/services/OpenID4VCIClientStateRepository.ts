import { useContext, useCallback, useMemo, useState, useRef, useEffect } from "react";
import SessionContext from "@/context/SessionContext";
import { WalletStateCredentialIssuanceSession } from "@/services/WalletStateOperations";
import { WalletStateUtils } from "@/services/WalletStateUtils";
import { IOpenID4VCIClientStateRepository } from "../interfaces/IOpenID4VCIClientStateRepository";
import { OPENID4VCI_TRANSACTION_ID_LIFETIME_IN_SECONDS } from "@/config";
import { last } from "@/util";

export function useOpenID4VCIClientStateRepository(): IOpenID4VCIClientStateRepository {

	const { api, isLoggedIn, keystore } = useContext(SessionContext);

	const { getCalculatedWalletState, saveCredentialIssuanceSessions } = keystore;
	// key: sessionId
	const sessions = useRef<Map<number, WalletStateCredentialIssuanceSession>>(null);

	const loadSessions = useCallback(() => {
		const S = getCalculatedWalletState();
		if (!S) {
			return;
		}
		if (sessions.current === null || sessions.current.size === 0) {
			sessions.current = new Map<number, WalletStateCredentialIssuanceSession>();
			S.credentialIssuanceSessions.map((session) => {
				sessions.current.set(session.sessionId, session);
			});
		}
	}, [getCalculatedWalletState]);

	const commitStateChanges = useCallback(async (): Promise<void> => {
		const S = getCalculatedWalletState();
		if (!S) {
			return;
		}
		const [{ }, newPrivateData, keystoreCommit] = await saveCredentialIssuanceSessions(Array.from(sessions.current.values()));
		await api.updatePrivateData(newPrivateData);
		await keystoreCommit();
		console.log("CHANGES WRITTEN")
	}, [getCalculatedWalletState, saveCredentialIssuanceSessions, api]);

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

	const getByCredentialIssuerIdentifierAndCredentialConfigurationId = useCallback(async (
		credentialIssuer: string,
		credentialConfigurationId: string
	): Promise<WalletStateCredentialIssuanceSession | null> => {
		loadSessions();
		const r = Array.from(sessions.current.values()).filter((S) => S.credentialConfigurationId === credentialConfigurationId && S.credentialIssuerIdentifier === credentialIssuer);
		const res = last(r);
		return res ? res : null;
	},
		[]
	);

	const getByState = useCallback(
		async (state: string): Promise<WalletStateCredentialIssuanceSession | null> => {
			loadSessions();
			const r = Array.from(sessions.current.values()).filter((S) => S.state === state);
			const res = last(r);
			return res ? res : null;
		},
		[loadSessions]
	);

	const cleanupExpired = useCallback(async (): Promise<void> => {
		loadSessions();
		const rememberIssuerForSeconds = await getRememberIssuerAge();
		console.log("Rememeber issuer for seconds = ", rememberIssuerForSeconds)

		if (rememberIssuerForSeconds == null) {
			return;
		}
		for (const res of Array.from(sessions.current.values())) {
			console.log("Res i: ", res);
			if (res.created &&
				typeof res.created === 'number' &&
				Math.floor(Date.now() / 1000) > res.created + rememberIssuerForSeconds) {
				console.log("Removed session id = ", res.sessionId)
				sessions.current.delete(res.sessionId);
			}
		}
		const now = Math.floor(new Date().getTime() / 1000);
		for (const [k, v] of sessions.current) {
			if (now - v.created > OPENID4VCI_TRANSACTION_ID_LIFETIME_IN_SECONDS) {
				sessions.current.delete(k);
			}
		}
	}, [getRememberIssuerAge, loadSessions]);

	const create = useCallback(
		async (state: WalletStateCredentialIssuanceSession): Promise<void> => {
			loadSessions();
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
		[loadSessions]
	);

	const updateState = useCallback(
		async (newState: WalletStateCredentialIssuanceSession): Promise<void> => {
			loadSessions();
			const fetched = await getByState(newState.state);
			if (!fetched) {
				return;
			}
			sessions.current.set(fetched.sessionId, newState);
		},
		[getByState, loadSessions]
	);

	const getAllStatesWithNonEmptyTransactionId = useCallback(
		async (): Promise<WalletStateCredentialIssuanceSession[]> => {
			loadSessions();
			const pendingTransactions = Array.from(sessions.current.values())
				.filter((session: WalletStateCredentialIssuanceSession) =>
					session.credentialEndpoint && session.credentialEndpoint.transactionId != undefined && typeof session.credentialEndpoint.transactionId === 'string'
				);
			return pendingTransactions;
		}
		, [loadSessions]);

	return useMemo(() => {
		return {
			getByCredentialIssuerIdentifierAndCredentialConfigurationId,
			getByState,
			cleanupExpired,
			create,
			updateState,
			commitStateChanges,
			getAllStatesWithNonEmptyTransactionId,
		}
	}, [
		getByCredentialIssuerIdentifierAndCredentialConfigurationId,
		getByState,
		cleanupExpired,
		create,
		updateState,
		commitStateChanges,
		getAllStatesWithNonEmptyTransactionId,
	]);
}
