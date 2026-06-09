"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyCertificate = verifyCertificate;
const pkijs = __importStar(require("pkijs"));
const asn1js = __importStar(require("asn1js"));
const buffer_1 = require("buffer");
const uncrypto_1 = __importDefault(require("uncrypto"));
pkijs.setEngine("webcrypto", uncrypto_1.default, new pkijs.CryptoEngine({ name: "", crypto: uncrypto_1.default, subtle: uncrypto_1.default.subtle }));
/**
 * Convert a PEM certificate to an ArrayBuffer
 * @param {string} pem
 * @returns {ArrayBuffer}
 */
function pemToArrayBuffer(pem) {
    const base64 = pem.replace(/(-----(BEGIN|END) CERTIFICATE-----|\s)/g, "");
    const binaryString = buffer_1.Buffer.from(base64, "base64").toString("binary");
    const byteArray = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        byteArray[i] = binaryString.charCodeAt(i);
    }
    return byteArray.buffer;
}
/**
 * Load a certificate from a PEM string
 * @param {string} pem
 * @returns {pkijs.Certificate}
 */
function parseCertificate(pem) {
    const certBuffer = pemToArrayBuffer(pem);
    const asn1 = asn1js.fromBER(certBuffer);
    return new pkijs.Certificate({ schema: asn1.result });
}
/**
 * Verify a certificate using another certificate (CA)
 * @param {string} leafCertPem - The certificate to verify (PEM format)
 * @param {string[]} trustedCerts - The CA certificates (PEM format)
 * @returns {Promise<boolean>}
 *
 * @deprecated Trust evaluation is now delegated to the AuthZEN backend at the
 * protocol level. This function is only used for backwards compatibility.
 * New code should set `delegateTrustToBackend: true` in the Context and rely on
 * protocol-level trust evaluation via AuthZEN before credentials are
 * issued/presented.
 */
async function verifyCertificate(leafCertPem, trustedCerts) {
    // Parse the certificates
    const leafCert = parseCertificate(leafCertPem);
    const caCerts = trustedCerts.map((caCertPem) => parseCertificate(caCertPem));
    // Create a certificate chain verification engine
    const certChainEngine = new pkijs.CertificateChainValidationEngine({
        trustedCerts: [...caCerts], // The CA certificate is the trusted anchor
        certs: [leafCert], // The certificate to verify
    });
    // Perform verification
    const verificationResult = await certChainEngine.verify();
    return verificationResult.result;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmVyaWZ5Q2VydGlmaWNhdGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvdXRpbHMvdmVyaWZ5Q2VydGlmaWNhdGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUE2Q0EsOENBY0M7QUEzREQsNkNBQStCO0FBQy9CLCtDQUFpQztBQUNqQyxtQ0FBZ0M7QUFDaEMsd0RBQWlDO0FBRWpDLEtBQUssQ0FBQyxTQUFTLENBQUMsV0FBVyxFQUFFLGtCQUFTLEVBQUUsSUFBSSxLQUFLLENBQUMsWUFBWSxDQUFDLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxNQUFNLEVBQUUsa0JBQVMsRUFBRSxNQUFNLEVBQUUsa0JBQVMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUE7QUFFMUg7Ozs7R0FJRztBQUNILFNBQVMsZ0JBQWdCLENBQUMsR0FBVztJQUNwQyxNQUFNLE1BQU0sR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDLHlDQUF5QyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQzFFLE1BQU0sWUFBWSxHQUFHLGVBQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUN0RSxNQUFNLFNBQVMsR0FBRyxJQUFJLFVBQVUsQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDdEQsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFlBQVksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztRQUM5QyxTQUFTLENBQUMsQ0FBQyxDQUFDLEdBQUcsWUFBWSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUMzQyxDQUFDO0lBQ0QsT0FBTyxTQUFTLENBQUMsTUFBTSxDQUFDO0FBQ3pCLENBQUM7QUFFRDs7OztHQUlHO0FBQ0gsU0FBUyxnQkFBZ0IsQ0FBQyxHQUFRO0lBQ2pDLE1BQU0sVUFBVSxHQUFHLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ3pDLE1BQU0sSUFBSSxHQUFHLE1BQU0sQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7SUFDeEMsT0FBTyxJQUFJLEtBQUssQ0FBQyxXQUFXLENBQUMsRUFBRSxNQUFNLEVBQUUsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUM7QUFDdkQsQ0FBQztBQUVEOzs7Ozs7Ozs7OztHQVdHO0FBQ0ksS0FBSyxVQUFVLGlCQUFpQixDQUFDLFdBQW1CLEVBQUUsWUFBc0I7SUFDbEYseUJBQXlCO0lBQ3pCLE1BQU0sUUFBUSxHQUFHLGdCQUFnQixDQUFDLFdBQVcsQ0FBQyxDQUFDO0lBQy9DLE1BQU0sT0FBTyxHQUFHLFlBQVksQ0FBQyxHQUFHLENBQUMsQ0FBQyxTQUFTLEVBQUUsRUFBRSxDQUFDLGdCQUFnQixDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7SUFFN0UsaURBQWlEO0lBQ2pELE1BQU0sZUFBZSxHQUFHLElBQUksS0FBSyxDQUFDLGdDQUFnQyxDQUFDO1FBQ2xFLFlBQVksRUFBRSxDQUFDLEdBQUcsT0FBTyxDQUFDLEVBQUUsMkNBQTJDO1FBQ3ZFLEtBQUssRUFBRSxDQUFDLFFBQVEsQ0FBQyxFQUFFLDRCQUE0QjtLQUMvQyxDQUFDLENBQUM7SUFFSCx1QkFBdUI7SUFDdkIsTUFBTSxrQkFBa0IsR0FBRyxNQUFNLGVBQWUsQ0FBQyxNQUFNLEVBQUUsQ0FBQztJQUMxRCxPQUFPLGtCQUFrQixDQUFDLE1BQU0sQ0FBQztBQUNsQyxDQUFDIn0=