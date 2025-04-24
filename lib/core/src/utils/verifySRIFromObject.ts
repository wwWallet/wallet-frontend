import { Context } from "../interfaces";

export type Algorithm = 'sha256' | 'sha384' | 'sha512';

/**
 * Verifies that a given object matches the expected SRI integrity string.
 * @param obj - The object to verify
 * @param expectedIntegrity - The SRI string (e.g. 'sha256-<base64hash>')
 * @returns Promise resolving to true if valid, false otherwise
 */
export async function verifySRIFromObject(
	context: Context,
	obj: Record<string, any>,
	expectedIntegrity: string,
): Promise<boolean> {
	const [algorithm, expectedHash] = expectedIntegrity.split('-') as [Algorithm, string];

	if (!algorithm || !expectedHash) {
		throw new Error('Invalid integrity string format');
	}

	const jsonString = JSON.stringify(obj);
	const encoder = new TextEncoder();
	const data = encoder.encode(jsonString);

	const algoMap: Record<Algorithm, string> = {
		sha256: 'SHA-256',
		sha384: 'SHA-384',
		sha512: 'SHA-512',
	};

	const subtleAlgo = algoMap[algorithm.toLowerCase() as Algorithm];
	if (!subtleAlgo) {
		throw new Error(`Unsupported algorithm: ${algorithm}`);
	}

	const digest = await context.subtle.digest(subtleAlgo, data);
	const hashArray = Array.from(new Uint8Array(digest));
	const hashBase64 = btoa(String.fromCharCode(...hashArray));

	return hashBase64 === expectedHash;
}
