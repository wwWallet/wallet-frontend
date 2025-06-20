import { useContext, useCallback, useMemo, useState, useRef, useEffect } from "react";
import { OpenID4VCIClientState } from "../types/OpenID4VCIClientState";
import SessionContext from "@/context/SessionContext";
import { WalletBaseStateCredentialIssuanceSession } from "@/services/WalletStateOperations";
import { WalletStateUtils } from "@/services/WalletStateUtils";
import { IOpenID4VCIClientStateRepository } from "../interfaces/IOpenID4VCIClientStateRepository";

export function useOpenID4VCIClientStateRepository(): IOpenID4VCIClientStateRepository {

	const { api, isLoggedIn, keystore } = useContext(SessionContext);

	// key: sessionId
	const sessions = useRef(new Map<number, WalletBaseStateCredentialIssuanceSession>());

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
	): Promise<WalletBaseStateCredentialIssuanceSession | null> => {
		const res = Array.from(sessions.current.values()).filter((S) => S.credentialConfigurationId === credentialConfigurationId && S.credentialIssuerIdentifier === credentialIssuer)[0];
		return res ? res : null;
	},
		[]
	);

	const getByState = useCallback(
		async (state: string): Promise<WalletBaseStateCredentialIssuanceSession | null> => {
			const res = Array.from(sessions.current.values()).filter((S) => S.state === state)[0];
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
		async (state: WalletBaseStateCredentialIssuanceSession): Promise<void> => {
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
		async (newState: WalletBaseStateCredentialIssuanceSession): Promise<void> => {
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
