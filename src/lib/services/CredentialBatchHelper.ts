import { useCallback, useMemo } from "react";
import { compareBy } from "../../util";
import { ExtendedVcEntity } from "@/context/CredentialsContext";

export function useCredentialBatchHelper() {

	const getLeastUsedCredential = useCallback(
		async (batchId: number, cList: ExtendedVcEntity[]): Promise<ExtendedVcEntity> => {
			const creds = cList.filter((c) => c.batchId === batchId);
			creds.sort(compareBy((c) => c.sigCount));
			console.log("Ordered by sigCount = ", creds);
			return creds[0];
		},
		[]
	);


	return useMemo(
		() => ({
			getLeastUsedCredential,
		}),
		[getLeastUsedCredential]
	);
}
