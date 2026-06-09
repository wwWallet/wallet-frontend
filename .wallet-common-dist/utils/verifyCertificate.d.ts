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
export declare function verifyCertificate(leafCertPem: string, trustedCerts: string[]): Promise<boolean>;
//# sourceMappingURL=verifyCertificate.d.ts.map