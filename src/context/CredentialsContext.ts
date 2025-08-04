// CredentialsContext.ts
import { WalletBaseStateCredential } from '@/services/WalletStateOperations';
import { createContext } from 'react';
import { ParsedCredential } from 'wallet-common/dist/types';
import { ParsingEngineI,CredentialVerifier } from 'wallet-common/dist/interfaces';

type CredentialEngine = {
	credentialParsingEngine:ParsingEngineI ;
	sdJwtVerifier: CredentialVerifier;
	msoMdocVerifier: CredentialVerifier;
};

export type Instance = {
	instanceId: number;
	sigCount: number;
}

export type ExtendedVcEntity = WalletBaseStateCredential & {
	parsedCredential: ParsedCredential;
	isExpired: boolean;
	instances: Instance[];
	sigCount: number; // calculate usage by parsing all presentation history
}

export type CredentialsContextValue = {
	vcEntityList: ExtendedVcEntity[];
	latestCredentials: Set<number>;
	fetchVcData: (credentialId?: number) => Promise<ExtendedVcEntity[]>;
	getData: (shouldPoll?: boolean) => Promise<void>;
	currentSlide: number;
	setCurrentSlide: (slide: number) => void;
	parseCredential: (rawCredential: unknown) => Promise<ParsedCredential | null>;
	credentialEngine: CredentialEngine | null;
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
};
const CredentialsContext = createContext<CredentialsContextValue>(defaultContextValue);

export default CredentialsContext;
