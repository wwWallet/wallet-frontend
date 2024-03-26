import { parseCredential } from "./parseCredential"

export const extractCredentialImageURL = async (credential: string | object): Promise<string | undefined> => {
	const parsedCredential = await parseCredential(credential) as any;
	return parsedCredential?.credentialBranding?.image?.url;
}
