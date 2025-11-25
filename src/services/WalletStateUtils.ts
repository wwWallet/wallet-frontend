const encoder = new TextEncoder();

export async function sha256(input: string): Promise<string> {
	const data = encoder.encode(input);
	const hashBuffer = await crypto.subtle.digest("SHA-256", data);
	return [...new Uint8Array(hashBuffer)]
		.map(b => b.toString(16).padStart(2, "0"))
		.join("");
}

export namespace WalletStateUtils {
	export function getRandomUint32() {
		const array = new Uint32Array(1);
		crypto.getRandomValues(array);
		return array[0] === 0 ? 1 : array[0];
	}
}
