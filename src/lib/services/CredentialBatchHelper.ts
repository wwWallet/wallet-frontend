import { WalletState, WalletStateCredential } from "@/services/WalletStateSchemaVersion1";
import { compareBy, reverse } from "../../util";
import { ExtendedVcEntity } from "@/context/CredentialsContext";


export async function getLeastUsedCredentialInstance(batchId: number, cList: ExtendedVcEntity[], walletState: WalletState): Promise<WalletStateCredential | null> {
	const credByBatchId = cList.filter((c) => c.batchId === batchId)[0];
	const instances = credByBatchId.instances;
	instances.sort(compareBy((c) => c.sigCount));
	const leastUsedInstance = instances[0];
	const { instanceId } = leastUsedInstance;
	const credential = walletState.credentials.filter((c) => c.batchId === batchId && c.instanceId === instanceId)[0];
	if (!credential) {
		return null;
	}
	return credential;
}
