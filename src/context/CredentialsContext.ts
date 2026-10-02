// CredentialsContext.ts
import { CurrentSchema } from '@/services/WalletStateSchema';
import { createContext } from 'react';
import { ParsedCredential, ParsingEngineI, CredentialVerifier } from 'wallet-common';

type WalletStateCredential = CurrentSchema.WalletStateCredential;
type WalletStateCredentialIssuanceSession = CurrentSchema.WalletStateCredentialIssuanceSession;

type CredentialEngine = {
	credentialParsingEngine: ParsingEngineI;
	sdJwtVerifier: CredentialVerifier;
	msoMdocVerifier: CredentialVerifier;
};

export type Instance = {
	instanceId: number;
	sigCount: number;
}

export type ExtendedVcEntity = WalletStateCredential & {
	parsedCredential: ParsedCredential;
	isExpired: boolean;
	instances: Instance[];
	sigCount: number; // calculate usage by parsing all presentation history
}

export type CredentialsContextValue = {
	vcEntityList: ExtendedVcEntity[] | null;
	latestCredentials: Set<number>;
	fetchVcData: (credentialId?: number) => Promise<ExtendedVcEntity[] | null>;
	getData: (shouldPoll?: boolean) => Promise<void>;
	currentSlide: number;
	setCurrentSlide: (slide: number) => void;
	parseCredential: (credential: WalletStateCredential) => Promise<ParsedCredential | null>;
	credentialEngine: CredentialEngine | null;
	pendingTransactions: WalletStateCredentialIssuanceSession[] | null;
};

const defaultContextValue: CredentialsContextValue = {
	vcEntityList: [],
	latestCredentials: new Set<number>(),
	fetchVcData: async () => [],
	getData: async () => { },
	currentSlide: 1,
	setCurrentSlide: () => { },
	parseCredential: async () => null,
	credentialEngine: null,
	pendingTransactions: null,
};
const CredentialsContext = createContext<CredentialsContextValue>(defaultContextValue);

export default CredentialsContext;
