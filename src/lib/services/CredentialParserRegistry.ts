import { ICredentialParser, ICredentialParserRegistry } from "../interfaces/ICredentialParser";
import { calculateHash } from "../utils/digest";


export function useCredentialParserRegistry(): ICredentialParserRegistry {

	const parserList: ICredentialParser[] = [];

	/**
	 * optimize parsing time by caching alread parsed objects because parse() can be called multiple times in a single view
	 */
	const parsedObjectsCache = new Map<string, { credentialFriendlyName: string; credentialImage: { credentialImageURL: string; }; beautifiedForm: any; }>();

	return {
		setParsers(parsers: ICredentialParser[]): void {
			parserList.push(...parsers);
		},
		async parse(rawCredential: object | string) {
			const hash = await calculateHash(JSON.stringify(rawCredential));
			const cacheResult = parsedObjectsCache.get(hash);
			if (cacheResult) {
				return cacheResult;
			}
			for (const p of parserList) {
				const result = await p.parse(rawCredential).catch(() => null);
				if (result && 'beautifiedForm' in result) {
					parsedObjectsCache.set(hash, result);
					return result;
				}
			}
			return { error: "All parsings failed" };
		}
	}
}
