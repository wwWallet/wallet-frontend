import * as pkijs from "pkijs";
import * as asn1js from "asn1js";
import { Buffer } from "buffer";
import webcrypto from "uncrypto";

pkijs.setEngine("webcrypto", webcrypto, new pkijs.CryptoEngine({ name: "", crypto: webcrypto, subtle: webcrypto.subtle }))

/**
 * Convert a PEM certificate to an ArrayBuffer
 * @param {string} pem
 * @returns {ArrayBuffer}
 */
function pemToArrayBuffer(pem: string) {
	const base64 = pem.replace(/(-----(BEGIN|END) CERTIFICATE-----|\s)/g, "");
	const binaryString = Buffer.from(base64, "base64").toString("binary");
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
function parseCertificate(pem: any) {
	const certBuffer = pemToArrayBuffer(pem);
	const asn1 = asn1js.fromBER(certBuffer);
	return new pkijs.Certificate({ schema: asn1.result });
}

/**
 * Verify a certificate using another certificate (CA)
 * @param {string} leafCertPem - The certificate to verify (PEM format)
 * @param {string} caCertPem - The CA certificate (PEM format)
 * @returns {Promise<boolean>}
 */
export async function verifyCertificate(leafCertPem: string, trustedCerts: string[]) {
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

