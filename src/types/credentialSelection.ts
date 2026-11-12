import type { DcqlCredentialMatch, DcqlSelection } from 'wallet-common';
import type { Dispatch, SetStateAction } from 'react';
import type { ParsedTransactionData } from '@/lib/services/OpenID4VP/TransactionData/parseTransactionData';

export interface RequestedCredentialField {
	name: string;
	purpose: string;
	path?: Array<string | number | null>;
}

export type ConformantCredentialsMap = Map<string, DcqlCredentialMatch>;
export type ConformantCredentialsRecord = Record<string, DcqlCredentialMatch>;

export interface CredentialSelectionOptions {
	conformantCredentialsMap: ConformantCredentialsRecord;
	verifierDomainName: string;
	verifierPurpose: string;
	parsedTransactionData?: ParsedTransactionData[];
}

export interface CredentialSelectionPopupState {
	isOpen: boolean;
	options: CredentialSelectionOptions | null;
	resolve: (value: DcqlSelection) => void;
	reject: () => void;
}

export type SetCredentialSelectionPopupState = Dispatch<SetStateAction<CredentialSelectionPopupState>>;
