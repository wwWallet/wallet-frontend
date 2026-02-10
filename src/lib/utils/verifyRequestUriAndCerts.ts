import axios from "axios";
import { BACKEND_URL, OPENID4VP_SAN_DNS_CHECK_SSL_CERTS, OPENID4VP_SAN_DNS_CHECK } from "../../config";
import { extractSAN } from "./pki";

export async function verifyRequestUriAndCerts(request_uri: string, response_uri: string, parsedHeader: any) {
	if (new URL(request_uri).hostname !== new URL(response_uri).hostname) {
		throw new Error("NONTRUSTED_VERIFIER: Hostname mismatch");
	}

	const altNames = await extractSAN(
		"-----BEGIN CERTIFICATE-----\n" + parsedHeader.x5c[0] + "\n-----END CERTIFICATE-----"
	);

	if (OPENID4VP_SAN_DNS_CHECK && (!altNames || altNames.length === 0)) {
		throw new Error("NONTRUSTED_VERIFIER: SAN not found");
	}

	if (OPENID4VP_SAN_DNS_CHECK && !altNames.includes(new URL(response_uri).hostname)) {
		throw new Error("NONTRUSTED_VERIFIER: Hostname not in SAN");
	}

	if (OPENID4VP_SAN_DNS_CHECK_SSL_CERTS) {
		const response = await axios.post(`${BACKEND_URL}/helper/get-cert`, {
			url: request_uri
		}, {
			timeout: 2500,
			headers: {
				Authorization: 'Bearer ' + JSON.parse(sessionStorage.getItem('appToken')!)
			}
		}).catch(() => null);

		if (!response) {
			throw new Error("Could not get SSL certificate for " + new URL(request_uri).hostname);
		}
		const { x5c } = response.data;
		if (x5c[0] !== parsedHeader.x5c[0]) {
			throw new Error("x509 SAN DNS: Invalid signer certificate");
		}
	}
}
