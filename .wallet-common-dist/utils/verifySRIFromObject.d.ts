export type Algorithm = 'sha256' | 'sha384' | 'sha512';
/**
 * Verifies that a given object matches the expected SRI integrity string.
 * @param obj - The object to verify
 * @param expectedIntegrity - The SRI string (e.g. 'sha256-<base64hash>')
 * @returns Promise resolving to true if valid, false otherwise
 */
export declare function verifySRIFromObject(subtle: SubtleCrypto, obj: Record<string, any>, expectedIntegrity: string): Promise<boolean>;
//# sourceMappingURL=verifySRIFromObject.d.ts.map