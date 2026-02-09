import { IOpenID4VP } from "../../interfaces/IOpenID4VP";
import {
	type HandleAuthorizationRequestError as HandleAuthorizationRequestErrorType,
} from "wallet-common";
import type { OpenID4VPServerCredential } from "wallet-common";
import { OpenID4VPServerAPI, ResponseMode } from "wallet-common";
import { OpenID4VPRelyingPartyState } from "../../types/OpenID4VPRelyingPartyState";
import { useOpenID4VPRelyingPartyStateRepository } from "../OpenID4VPRelyingPartyStateRepository";
import { useHttpProxy } from "../HttpProxy/HttpProxy";
import { useCallback, useContext, useMemo } from "react";
import SessionContext from "@/context/SessionContext";
import CredentialsContext from "@/context/CredentialsContext";
import { useTranslation } from "react-i18next";
import { ParsedTransactionData, parseTransactionDataWithUI } from "./TransactionData/parseTransactionData";
import { ExtendedVcEntity } from "@/context/CredentialsContext";
import { getLeastUsedCredentialInstance } from "../CredentialBatchHelper";
import { WalletStateUtils } from "@/services/WalletStateUtils";
import { TransactionDataResponse } from "wallet-common";
import { verifyRequestUriAndCerts } from "../../utils/verifyRequestUriAndCerts";

export function useOpenID4VP({
	showCredentialSelectionPopup,
	showStatusPopup,
	showTransactionDataConsentPopup,
}: {
	showCredentialSelectionPopup: (
		conformantCredentialsMap: any,
		verifierDomainName: string,
		verifierPurpose: string,
		parsedTransactionData?: ParsedTransactionData[],
	) => Promise<Map<string, number>>,
	showStatusPopup: (
		message: { title: string, description: string },
		type: 'error' | 'success',
	) => Promise<void>,
	showTransactionDataConsentPopup: (options: Record<string, unknown>) => Promise<boolean>,
}): IOpenID4VP {

	const openID4VPRelyingPartyStateRepository = useOpenID4VPRelyingPartyStateRepository();
	const httpProxy = useHttpProxy();
	const { parseCredential } = useContext(CredentialsContext);
	const { keystore, api } = useContext(SessionContext);
	const { t } = useTranslation();

	const promptForCredentialSelection = useCallback(
		async (
			conformantCredentialsMap: any,
			verifierDomainName: string,
			verifierPurpose: string,
			parsedTransactionData: ParsedTransactionData[],
		): Promise<Map<string, number>> => {
			return showCredentialSelectionPopup(conformantCredentialsMap, verifierDomainName, verifierPurpose, parsedTransactionData);
		},
		[showCredentialSelectionPopup]
	);
	const openID4VPServer = useMemo(() => {
		const lastUsedNonceStore = {
			get: () => sessionStorage.getItem('last_used_nonce'),
			set: (nonce: string) => sessionStorage.setItem('last_used_nonce', nonce),
		};
		const rpStateStore = {
			store: async (stateObject: any): Promise<void> => {
				await openID4VPRelyingPartyStateRepository.store(new OpenID4VPRelyingPartyState(
					stateObject.nonce,
					stateObject.response_uri,
					stateObject.client_id,
					stateObject.state,
					stateObject.client_metadata,
					stateObject.response_mode as ResponseMode,
					stateObject.transaction_data,
					stateObject.dcql_query
				));
			},
			retrieve: async () => {
				const stored = await openID4VPRelyingPartyStateRepository.retrieve();
				return {
					nonce: stored.nonce,
					response_uri: stored.response_uri,
					client_id: stored.client_id,
					state: stored.state,
					client_metadata: stored.client_metadata,
					response_mode: stored.response_mode as ResponseMode,
					transaction_data: stored.transaction_data,
					dcql_query: stored.dcql_query,
				};
			},
		};
		const selectCredentialForBatch = async (batchId: number, vcEntityList: ExtendedVcEntity[]): Promise<OpenID4VPServerCredential | null> => {
			const walletState = keystore.getCalculatedWalletState();
			if (!walletState) {
				throw new Error("Empty wallet state");
			}
			return getLeastUsedCredentialInstance(batchId, vcEntityList, walletState);
		};

		return new OpenID4VPServerAPI<OpenID4VPServerCredential, ParsedTransactionData>({
			httpClient: { get: httpProxy.get },
			rpStateStore,
			parseCredential,
			selectCredentialForBatch,
			keystore,
			strings: {
				purposeNotSpecified: t('selectCredentialPopup.purposeNotSpecified'),
				allClaimsRequested: t('selectCredentialPopup.allClaimsRequested'),
			},
			lastUsedNonceStore,
			parseTransactionData: parseTransactionDataWithUI,
			transactionDataResponseGenerator: TransactionDataResponse,
			verifyRequestUriAndCerts: async ({ request_uri, response_uri, parsedHeader }) =>
				verifyRequestUriAndCerts(request_uri, response_uri, parsedHeader),
		});
	}, [
		httpProxy.get,
		openID4VPRelyingPartyStateRepository,
		parseCredential,
		keystore,
		t,
	]);

	const handleAuthorizationRequest = useCallback(async (
		url: string,
		vcEntityList: ExtendedVcEntity[],
	): Promise<
		{
			conformantCredentialsMap: Map<string, any>,
			verifierDomainName: string,
			verifierPurpose: string,
			parsedTransactionData: ParsedTransactionData[] | null,
		}
		| { error: HandleAuthorizationRequestErrorType }
	> => {
		const result = await openID4VPServer.handleAuthorizationRequest(url, vcEntityList);
		if ("error" in result) {
			return { error: result.error as HandleAuthorizationRequestErrorType };
		}
		return result;
	}, [openID4VPServer]);

	const sendAuthorizationResponse = useCallback(async (selectionMap, vcEntityList) => {
		const response = await openID4VPServer.createAuthorizationResponse(selectionMap, vcEntityList);
		if (!response || !(response as any).formData) {
			return {};
		}
		const { formData, generatedVPs, filteredVCEntities, response_uri, client_id } = response as {
			formData: URLSearchParams;
			generatedVPs: string[];
			filteredVCEntities: ExtendedVcEntity[];
			response_uri: string;
			client_id: string;
		};

		const transactionId = WalletStateUtils.getRandomUint32();
		const [, newPrivateData, keystoreCommit] = await keystore.addPresentations(generatedVPs.map((vpData, index) => {
			console.log("Presentation: ")

			return {
				transactionId: transactionId,
				data: vpData,
				usedCredentialIds: [filteredVCEntities[index].credentialId],
				audience: client_id,
			}
		}));
		await api.updatePrivateData(newPrivateData);
		await keystoreCommit();

		const bodyString = formData.toString();
		console.log('bodyString: ', bodyString)
		try {
			const res = await httpProxy.post(response_uri, formData.toString(), {
				'Content-Type': 'application/x-www-form-urlencoded'
			});
			const responseData = res.data as { presentation_during_issuance_session?: string, redirect_uri?: string };
			console.log("Direct post response = ", JSON.stringify(res.data));
			if (responseData.presentation_during_issuance_session) {
				return { presentation_during_issuance_session: responseData.presentation_during_issuance_session };
			}
			if (responseData.redirect_uri) {
				return { url: responseData.redirect_uri };
			}
			showStatusPopup({
				title: "Verification succeeded",
				description: "The verification process has been completed",
			}, 'success');
		} catch (err) {
			console.error(err);
			showStatusPopup({
				title: "Error in verification",
				description: "The verification process was not completed successfully",
			}, 'error');
			return {};
		}
	}, [
		httpProxy,
		showStatusPopup,
		api,
		keystore,
		openID4VPServer,
	]);

	return useMemo(() => {
		return {
			promptForCredentialSelection,
			handleAuthorizationRequest,
			sendAuthorizationResponse,
		}
	}, [
		promptForCredentialSelection,
		handleAuthorizationRequest,
		sendAuthorizationResponse,
	]);
}
