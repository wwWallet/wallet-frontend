import { toBase64Url } from "@/util";

const encoder = new TextEncoder();

export async function convertTransactionDataB65uToHash(x: string) {
	const data = encoder.encode(x);
	const hashBuffer = await crypto.subtle.digest("SHA-256", data);
	const td_hash = toBase64Url(hashBuffer);
	return td_hash;
}
