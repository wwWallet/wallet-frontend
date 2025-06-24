import { compareBy } from "../../util";
import { ExtendedVcEntity } from "@/context/CredentialsContext";
import { WalletBaseStatePresentation } from "@/services/WalletStateOperations";

export async function getLeastUsedCredentialInstance(batchId: number, cList: ExtendedVcEntity[]) {
	const credsByBatchId = cList.filter((c) => c.batchId === batchId);
	credsByBatchId.sort(compareBy((c) => c.sigCount));
	return credsByBatchId[0];
}
