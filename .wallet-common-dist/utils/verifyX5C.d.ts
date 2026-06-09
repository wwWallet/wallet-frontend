/**
 * Verify an X.509 certificate chain (x5c) against trusted root certificates.
 *
 * @param x5c - Array of base64-encoded certificates (leaf first, root last)
 * @param trustedCertificates - Array of trusted root certificates in PEM format
 * @returns Promise<boolean> - True if chain validates to a trusted root
 *
 * @deprecated Trust evaluation is now delegated to the AuthZEN backend at the
 * protocol level. This function is only used for backwards compatibility.
 * New code should set `delegateTrustToBackend: true` in the Context and rely on
 * protocol-level trust evaluation via AuthZEN before credentials are
 * issued/presented.
 */
export declare function verifyX5C(x5c: string[], trustedCertificates: string[]): Promise<boolean>;
//# sourceMappingURL=verifyX5C.d.ts.map