import { parseCredential } from "./parseCredential";


export const extractCredentialFriendlyName = async (credential: string | object): Promise<string | undefined> => {
	const parsedCredential = await parseCredential(credential) as any;
	return parsedCredential.name ?? parsedCredential.id;
}
