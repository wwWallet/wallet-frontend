import { WalletSessionEvent, WalletSessionEventNewKeypair } from "./WalletStateOperations";

const encoder = new TextEncoder();


function normalize(obj: any) {
	if (Array.isArray(obj)) {
		return obj.map(normalize);
	} else if (obj && typeof obj === 'object' && obj.constructor === Object) {
		return Object.keys(obj)
			.sort()
			.reduce((acc: any, key: any) => {
				acc[key] = normalize(obj[key]);
				return acc;
			}, {});
	}
	return obj;
}


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

	export async function calculateEventHash(event: WalletSessionEvent): Promise<string> {
		// if new new_keypair event, then don't include the wrappedPrivateKey because it changes after every change of the keystore
		if (event.type === 'new_keypair') {
			return sha256(JSON.stringify(normalize({
				...event,
				keypair: {
					...event.keypair,
					wrappedPrivateKey: null,
				},
			} as WalletSessionEventNewKeypair)));
		}
		return sha256(JSON.stringify(normalize(event)));
	}

	export async function reparent(childEvent: WalletSessionEvent, parentEvent: WalletSessionEvent): Promise<WalletSessionEvent> {
		return {
			...childEvent,
			parentHash: await calculateEventHash(parentEvent),
		};
	}

}
