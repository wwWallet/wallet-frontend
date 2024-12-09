import { ICredentialParser, ICredentialParserRegistry } from "../interfaces/ICredentialParser";
import { PresentationDefinitionType } from "../types/presentationDefinition.type";
import { calculateHash } from "../utils/digest";


export class CredentialParserRegistry implements ICredentialParserRegistry {

	private parserList: ICredentialParser[] = [];

	/**
	 * optimize parsing time by caching alread parsed objects because parse() can be called multiple times in a single view
	 */
	private parsedObjectsCache = new Map<string, { credentialFriendlyName: string; credentialImage: { credentialImageURL: string; }; beautifiedForm: any; }>();

	addParser(parser: ICredentialParser): void {
		this.parserList.push(parser);
	}

	async parse(rawCredential: object | string, presentationDefinitionFilter?: PresentationDefinitionType) {
		const hash = await calculateHash(JSON.stringify(rawCredential));
		const cacheResult = this.parsedObjectsCache.get(hash);
		if (cacheResult) {
			return cacheResult;
		}
		for (const p of this.parserList) {
			const result = await p.parse(rawCredential, presentationDefinitionFilter).catch(() => null);
			if (result && 'beautifiedForm' in result) {
				this.parsedObjectsCache.set(hash, result);
				return result;
			}
		}
		return { error: "All parsings failed" };
	}

}
