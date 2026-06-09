"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateECDHKeypair = generateECDHKeypair;
const jose_1 = require("jose");
const utils_1 = require("../utils");
async function generateECDHKeypair() {
    const { privateKey, publicKey } = await (0, jose_1.generateKeyPair)('ECDH-ES', { extractable: true });
    const [privateKeyJwk, publicKeyJwk] = await Promise.all([
        (0, jose_1.exportJWK)(privateKey),
        (0, jose_1.exportJWK)(publicKey),
    ]);
    const kid = (0, utils_1.generateRandomIdentifier)(20);
    return { privateKeyJwk: { kid, ...privateKeyJwk }, publicKeyJwk: { kid, ...publicKeyJwk } };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRUNESC1FUy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9jb3JlL0VDREgtRVMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFHQSxrREFRQztBQVhELCtCQUFrRDtBQUNsRCxvQ0FBb0Q7QUFFN0MsS0FBSyxVQUFVLG1CQUFtQjtJQUN4QyxNQUFNLEVBQUUsVUFBVSxFQUFFLFNBQVMsRUFBRSxHQUFHLE1BQU0sSUFBQSxzQkFBZSxFQUFDLFNBQVMsRUFBRSxFQUFFLFdBQVcsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO0lBQzFGLE1BQU0sQ0FBQyxhQUFhLEVBQUUsWUFBWSxDQUFDLEdBQUcsTUFBTSxPQUFPLENBQUMsR0FBRyxDQUFDO1FBQ3ZELElBQUEsZ0JBQVMsRUFBQyxVQUFVLENBQUM7UUFDckIsSUFBQSxnQkFBUyxFQUFDLFNBQVMsQ0FBQztLQUNwQixDQUFDLENBQUM7SUFDSCxNQUFNLEdBQUcsR0FBRyxJQUFBLGdDQUF3QixFQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQ3pDLE9BQU8sRUFBRSxhQUFhLEVBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxhQUFhLEVBQUUsRUFBRSxZQUFZLEVBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxZQUFZLEVBQUUsRUFBRSxDQUFDO0FBQzdGLENBQUMifQ==