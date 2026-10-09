import type { Dispatch, SetStateAction } from 'react';
import type { ParsedTransactionData } from '@/lib/services/OpenID4VP/TransactionData/parseTransactionData';

export interface RequestedCredentialField {
	name: string;
	purpose: string;
	path: Array<string | null>;
}

export interface ConformantCredentialEntry {
	credentials: number[];
	requestedFields: RequestedCredentialField[];
}

export type ConformantCredentialsMap = Map<string, ConformantCredentialEntry>;
export type ConformantCredentialsRecord = Record<string, ConformantCredentialEntry>;

export interface CredentialSelectionOptions {
	conformantCredentialsMap: ConformantCredentialsRecord;
	verifierDomainName: string;
	verifierPurpose: string;
	parsedTransactionData?: ParsedTransactionData[];
}

export interface CredentialSelectionPopupState {
	isOpen: boolean;
	options: CredentialSelectionOptions | null;
	resolve: (value: Map<string, number>) => void;
	reject: () => void;
}

export type SetCredentialSelectionPopupState = Dispatch<SetStateAction<CredentialSelectionPopupState>>;
