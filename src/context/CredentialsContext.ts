// CredentialsContext.ts
import { createContext } from 'react';

export type CredentialsContextValue = {
    vcEntityList: any;
    latestCredentials: Set<number>;
    fetchVcData: (credentialId?: any) => Promise<any[]>; // Updated return type
    getData: (shouldPoll?: boolean) => Promise<void>;
    currentSlide: number;
    setCurrentSlide: (slide: number) => void;
    parseCredential: (credential: any) => Promise<any>;
};

const CredentialsContext = createContext<CredentialsContextValue | undefined>(undefined);

export default CredentialsContext;
