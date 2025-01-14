import { useContext, useCallback, useMemo } from "react";
import { compareBy } from "../../util";
import { StorableCredential } from "../types/StorableCredential";
import SessionContext from "../../context/SessionContext";

export function useCredentialBatchHelper() {
	const { api } = useContext(SessionContext);

	const updateCredential = useCallback(async (storableCredential: StorableCredential) => {
		await api.post("/storage/vc/update", {
			credential: storableCredential,
		});
	}, [api]);

	const getLeastUsedCredential = useCallback(
		async (credentialIdentifier: string, cList: StorableCredential[]): Promise<{ credential: StorableCredential }> => {
			const creds = cList.filter((c) => c.credentialIdentifier === credentialIdentifier);
			creds.sort(compareBy((c) => c.sigCount));
			console.log("Ordered by sigCount = ", creds);
			return { credential: creds[0] };
		},
		[]
	);

	const useCredential = useCallback(async (storableCredential: StorableCredential): Promise<void> => {
		storableCredential.sigCount += 1;
		await updateCredential(storableCredential);
	}, [updateCredential]);

	return useMemo(
		() => ({
			getLeastUsedCredential,
			useCredential,
		}),
		[getLeastUsedCredential, useCredential]
	);
}
