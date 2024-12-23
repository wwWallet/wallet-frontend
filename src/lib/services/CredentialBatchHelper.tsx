import { useContext } from "react";
import { compareBy } from "../../util";
import { StorableCredential } from "../types/StorableCredential";
import SessionContext from "../../context/SessionContext";

export function useCredentialBatchHelper() {

	const { api } = useContext(SessionContext);

	async function updateCredential(storableCredential: StorableCredential) {
		await api.post('/storage/vc/update', {
			credential: storableCredential
		});
	}

	/**
	 *
	 * @param credentialIdentifier
	 * @param cList all verifiable credentials of the wallet
	 * @returns
	 * Always return credential with the least amount of usages
	 */

	return {
		async getLeastUsedCredential(credentialIdentifier: string, cList: StorableCredential[]): Promise<{ credential: StorableCredential }> {
			const creds = cList.filter((c) => c.credentialIdentifier === credentialIdentifier);
			creds.sort(compareBy((c) => c.sigCount));
			console.log("Ordered by sigCount = ", creds)
			return { credential: creds[0] }
		},

		async useCredential(storableCredential: StorableCredential): Promise<void> {
			storableCredential.sigCount = storableCredential.sigCount + 1;
			await updateCredential(storableCredential);
		}
	}

}
