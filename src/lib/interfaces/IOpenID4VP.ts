import type { DcqlSelection } from 'wallet-common';
import { ExtendedVcEntity } from '@/context/CredentialsContext';
import { ParsedTransactionData } from '../services/OpenID4VP/TransactionData/parseTransactionData';
import type { ConformantCredentialsMap, ConformantCredentialsRecord } from '@/types/credentialSelection';

export type SendAuthorizationResponseResult = {
	state: 'skipped' | 'success';
	redirect_uri?: string;
};

export interface IOpenID4VP {
	handleAuthorizationRequest(
		url: string,
		vcEntitylist: ExtendedVcEntity[],
	): Promise<{
		conformantCredentialsMap: ConformantCredentialsMap;
		verifierDomainName: string;
		verifierPurpose: string;
		parsedTransactionData: ParsedTransactionData[] | null;
	}>;
	promptForCredentialSelection(
		conformantCredentialsMap: ConformantCredentialsRecord,
		verifierDomainName: string,
		verifierPurpose: string,
		parsedTransactionData?: ParsedTransactionData[],
	): Promise<DcqlSelection>;
	sendAuthorizationResponse(
		selectionMap: DcqlSelection,
		vcEntitylist: ExtendedVcEntity[],
	): Promise<SendAuthorizationResponseResult>;
}
