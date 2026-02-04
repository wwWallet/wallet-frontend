import { fromBase64Url, toBase64Url } from "@/util";

const encoder = new TextEncoder();

export async function convertTransactionDataB65uToHash(x: string) {
	const decoded = fromBase64Url(x);
	const hashBuffer = await crypto.subtle.digest("SHA-256", decoded);
	const td_hash = toBase64Url(hashBuffer);
	return td_hash;
}
