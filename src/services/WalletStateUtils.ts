import { WalletSessionEvent } from "./WalletStateOperations";


export namespace WalletStateUtils {
	export function getRandomUint32() {
		const array = new Uint32Array(1);
		crypto.getRandomValues(array);
		return array[0] === 0 ? 1 : array[0];
	}

	export async function sha256(input: string): Promise<string> {
		const encoder = new TextEncoder();
		const data = encoder.encode(input);
		const hashBuffer = await crypto.subtle.digest("SHA-256", data);
		return [...new Uint8Array(hashBuffer)]
			.map(b => b.toString(16).padStart(2, "0"))
			.join("");
	}

	export async function calculateEventHash(event: WalletSessionEvent): Promise<string> {
		return WalletStateUtils.sha256(JSON.stringify(event));
	}

}
