// CredentialsContext.ts
import { createContext } from 'react';
import { ParsedCredential } from 'core/dist/types';

type Instance = {
	instanceId: number;
	sigCount: number;
}

export type ExtendedVcEntity = {
	id: number;
	holderDID: string;
	credentialIdentifier: string;
	credential: string;
	format: string;
	credentialConfigurationId: string;
	credentialIssuerIdentifier: string;
	instanceId: number;
	sigCount: number;
	parsedCredential: ParsedCredential;
	isExpired: boolean;
	instances: Instance[];
}

type CredentialsContextValue = {
	vcEntityList: ExtendedVcEntity[];
	latestCredentials: Set<number>;
	fetchVcData: (credentialId?: string) => Promise<ExtendedVcEntity[]>;
	getData: (shouldPoll?: boolean) => Promise<void>;
	currentSlide: number;
	setCurrentSlide: (slide: number) => void;
	parseCredential: (credential: string) => Promise<ParsedCredential>;
};

const defaultContextValue: CredentialsContextValue = {
	vcEntityList: [],
	latestCredentials: new Set<number>(),
	fetchVcData: async () => [],
	getData: async () => { },
	currentSlide: 1,
	setCurrentSlide: () => { },
	parseCredential: async () => ({}),
};
const CredentialsContext = createContext<CredentialsContextValue>(defaultContextValue);

export default CredentialsContext;
