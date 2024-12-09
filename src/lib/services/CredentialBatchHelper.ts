import { compareBy } from "../../util";
import { StorableCredential } from "../types/StorableCredential";

export class CredentialBatchHelper {

	constructor(private updateCredential: (storableCredential: StorableCredential) => Promise<void>) { }

	/**
	 *
	 * @param credentialIdentifier
	 * @param cList all verifiable credentials of the wallet
	 * @returns
	 * Always return credential with the least amount of usages
	 */
	public async getLeastUsedCredential(credentialIdentifier: string, cList: StorableCredential[]): Promise<{ credential: StorableCredential }> {
		const creds = cList.filter((c) => c.credentialIdentifier === credentialIdentifier);
		creds.sort(compareBy((c) => c.sigCount));
		console.log("Ordered by sigCount = ", creds)
		return { credential: creds[0] }
	}

	public async useCredential(storableCredential: StorableCredential): Promise<void> {
		storableCredential.sigCount = storableCredential.sigCount + 1;
		await this.updateCredential(storableCredential);
	}
}
