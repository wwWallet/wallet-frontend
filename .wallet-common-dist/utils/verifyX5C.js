"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyX5C = verifyX5C;
const verifyCertificate_1 = require("./verifyCertificate");
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
async function verifyX5C(x5c, trustedCertificates) {
    if (x5c.length === 0) {
        return true;
    }
    const lastCertificate = x5c[x5c.length - 1];
    const lastCertificatePem = `-----BEGIN CERTIFICATE-----\n${lastCertificate}\n-----END CERTIFICATE-----`;
    const certificateValidationResult = await (0, verifyCertificate_1.verifyCertificate)(lastCertificatePem, trustedCertificates);
    const lastCertificateIsRootCa = trustedCertificates.map((c) => c.trim()).includes(lastCertificatePem);
    if (!certificateValidationResult && !lastCertificateIsRootCa) {
        return false;
    }
    return await verifyX5C(x5c.slice(0, -1), [lastCertificate]);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmVyaWZ5WDVDLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3V0aWxzL3ZlcmlmeVg1Qy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQWVBLDhCQWNDO0FBN0JELDJEQUF3RDtBQUV4RDs7Ozs7Ozs7Ozs7O0dBWUc7QUFDSSxLQUFLLFVBQVUsU0FBUyxDQUFDLEdBQWEsRUFBRSxtQkFBNkI7SUFDM0UsSUFBSSxHQUFHLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDO1FBQ3RCLE9BQU8sSUFBSSxDQUFDO0lBQ2IsQ0FBQztJQUNELE1BQU0sZUFBZSxHQUFXLEdBQUcsQ0FBQyxHQUFHLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBQ3BELE1BQU0sa0JBQWtCLEdBQUcsZ0NBQWdDLGVBQWUsNkJBQTZCLENBQUM7SUFDeEcsTUFBTSwyQkFBMkIsR0FBRyxNQUFNLElBQUEscUNBQWlCLEVBQUMsa0JBQWtCLEVBQUUsbUJBQW1CLENBQUMsQ0FBQztJQUNyRyxNQUFNLHVCQUF1QixHQUFHLG1CQUFtQixDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsUUFBUSxDQUFDLGtCQUFrQixDQUFDLENBQUM7SUFFdEcsSUFBSSxDQUFDLDJCQUEyQixJQUFJLENBQUMsdUJBQXVCLEVBQUUsQ0FBQztRQUM5RCxPQUFPLEtBQUssQ0FBQztJQUNkLENBQUM7SUFFRCxPQUFPLE1BQU0sU0FBUyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDO0FBQzdELENBQUMifQ==