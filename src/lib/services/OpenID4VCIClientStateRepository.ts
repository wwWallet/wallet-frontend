import { useContext, useCallback, useMemo, useState, useRef, useEffect } from "react";
import SessionContext from "@/context/SessionContext";
import { WalletStateCredentialIssuanceSession } from "@/services/WalletStateOperations";
import { WalletStateUtils } from "@/services/WalletStateUtils";
import { IOpenID4VCIClientStateRepository } from "../interfaces/IOpenID4VCIClientStateRepository";

export function useOpenID4VCIClientStateRepository(): IOpenID4VCIClientStateRepository {

	const { api, isLoggedIn, keystore } = useContext(SessionContext);

	// key: sessionId
	const sessions = useRef(new Map<number, WalletStateCredentialIssuanceSession>());

	useEffect(() => {
		if (keystore && sessions.current.size === 0) {
			const S = keystore.getCalculatedWalletState();
			if (!S) {
				return;
			}
			S.credentialIssuanceSessions.map((session) => {
				sessions.current.set(session.sessionId, session);
			});
			console.log("Loaded Credential Issuance Sessions from keystore = ", Array.from(sessions.current.values()));
		}
	}, [keystore]);

	const commitStateChanges = useCallback(async (): Promise<void> => {
		const [{ }, newPrivateData, keystoreCommit] = await keystore.saveCredentialIssuanceSessions(Array.from(sessions.current.values()));
		await api.updatePrivateData(newPrivateData);
		await keystoreCommit();
	}, [keystore, api]);

	const getRememberIssuerAge = useCallback(async (): Promise<number | null> => {
		if (!keystore) {
			return null;
		}
		const S = keystore.getCalculatedWalletState();
		if (!S) {
			return null;
		}
		return parseInt(S.settings['openidRefreshTokenMaxAgeInSeconds']);
	}, [keystore]);

	const getByCredentialIssuerIdentifierAndCredentialConfigurationId = useCallback(async (
		credentialIssuer: string,
		credentialConfigurationId: string
	): Promise<WalletStateCredentialIssuanceSession | null> => {
		const r = Array.from(sessions.current.values()).filter((S) => S.credentialConfigurationId === credentialConfigurationId && S.credentialIssuerIdentifier === credentialIssuer);
		const res = r[r.length-1];
		return res ? res : null;
	},
		[]
	);

	const getByState = useCallback(
		async (state: string): Promise<WalletStateCredentialIssuanceSession | null> => {
			const r = Array.from(sessions.current.values()).filter((S) => S.state === state);
			const res = r[r.length-1];
			return res ? res : null;
		},
		[]
	);

	const cleanupExpired = useCallback(async (): Promise<void> => {
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
	}, [getRememberIssuerAge]);

	const create = useCallback(
		async (state: WalletStateCredentialIssuanceSession): Promise<void> => {
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
			const fetched = await getByState(newState.state);
			if (!fetched) {
				return;
			}
			sessions.current.set(fetched.sessionId, newState);
		},
		[getByState]
	);

	return useMemo(() => {
		return {
			getByCredentialIssuerIdentifierAndCredentialConfigurationId,
			getByState,
			cleanupExpired,
			create,
			updateState,
			commitStateChanges,
		}
	}, [
		getByCredentialIssuerIdentifierAndCredentialConfigurationId,
		getByState,
		cleanupExpired,
		create,
		updateState,
		commitStateChanges,
	]);
}
