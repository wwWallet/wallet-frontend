"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifySRIFromObject = verifySRIFromObject;
/**
 * Verifies that a given object matches the expected SRI integrity string.
 * @param obj - The object to verify
 * @param expectedIntegrity - The SRI string (e.g. 'sha256-<base64hash>')
 * @returns Promise resolving to true if valid, false otherwise
 */
async function verifySRIFromObject(subtle, obj, expectedIntegrity) {
    const [algorithm, expectedHash] = expectedIntegrity.split('-');
    if (!algorithm || !expectedHash) {
        throw new Error('Invalid integrity string format');
    }
    const jsonString = JSON.stringify(obj);
    const encoder = new TextEncoder();
    const data = encoder.encode(jsonString);
    const algoMap = {
        sha256: 'SHA-256',
        sha384: 'SHA-384',
        sha512: 'SHA-512',
    };
    const subtleAlgo = algoMap[algorithm.toLowerCase()];
    if (!subtleAlgo) {
        throw new Error(`Unsupported algorithm: ${algorithm}`);
    }
    const digest = await subtle.digest(subtleAlgo, data);
    const hashArray = Array.from(new Uint8Array(digest));
    const hashBase64 = btoa(String.fromCharCode(...hashArray));
    return hashBase64 === expectedHash;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmVyaWZ5U1JJRnJvbU9iamVjdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlscy92ZXJpZnlTUklGcm9tT2JqZWN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBU0Esa0RBK0JDO0FBckNEOzs7OztHQUtHO0FBQ0ksS0FBSyxVQUFVLG1CQUFtQixDQUN4QyxNQUFvQixFQUNwQixHQUF3QixFQUN4QixpQkFBeUI7SUFFekIsTUFBTSxDQUFDLFNBQVMsRUFBRSxZQUFZLENBQUMsR0FBRyxpQkFBaUIsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUF3QixDQUFDO0lBRXRGLElBQUksQ0FBQyxTQUFTLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztRQUNqQyxNQUFNLElBQUksS0FBSyxDQUFDLGlDQUFpQyxDQUFDLENBQUM7SUFDcEQsQ0FBQztJQUVELE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDdkMsTUFBTSxPQUFPLEdBQUcsSUFBSSxXQUFXLEVBQUUsQ0FBQztJQUNsQyxNQUFNLElBQUksR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0lBRXhDLE1BQU0sT0FBTyxHQUE4QjtRQUMxQyxNQUFNLEVBQUUsU0FBUztRQUNqQixNQUFNLEVBQUUsU0FBUztRQUNqQixNQUFNLEVBQUUsU0FBUztLQUNqQixDQUFDO0lBRUYsTUFBTSxVQUFVLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQyxXQUFXLEVBQWUsQ0FBQyxDQUFDO0lBQ2pFLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztRQUNqQixNQUFNLElBQUksS0FBSyxDQUFDLDBCQUEwQixTQUFTLEVBQUUsQ0FBQyxDQUFDO0lBQ3hELENBQUM7SUFFRCxNQUFNLE1BQU0sR0FBRyxNQUFNLE1BQU0sQ0FBQyxNQUFNLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQ3JELE1BQU0sU0FBUyxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztJQUNyRCxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxHQUFHLFNBQVMsQ0FBQyxDQUFDLENBQUM7SUFFM0QsT0FBTyxVQUFVLEtBQUssWUFBWSxDQUFDO0FBQ3BDLENBQUMifQ==