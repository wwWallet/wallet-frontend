import axios from "axios";
import { importX509, jwtVerify } from "jose";

import { RP_REGISTRAR_CA_URL } from "@/config";

async function fetchRegistrarRootCert() {
	try {
		const res = await axios.get(RP_REGISTRAR_CA_URL, {
			headers: {
				Accept: "application/json"
			}
		});
		console.log("Registrar cert:", res.data);
		return res.data;
	} catch (err) {
		console.error("Failed to fetch registrar root cert:", err);
		throw err;
	}
}

export async function verifyAttestationWithRegistrar(attestationJwt: string) {
	const registrarCertPem = await fetchRegistrarRootCert();
	const registrarPublicKey = await importX509(registrarCertPem, "ES256");
	const { payload, protectedHeader } = await jwtVerify(attestationJwt, registrarPublicKey);

	if (payload.exp && payload.exp * 1000 < Date.now()) {
		throw new Error("Verifier attestation expired");
	}
	if (!payload.credentials || !Array.isArray(payload.credentials)) {
		throw new Error("Verifier attestation missing credentials array");
	}

	return {
		privacy_policy: payload.privacy_policy,
		purpose: payload.purpose,
		credentials: payload.credentials.map(c => ({
			format: c.format,
			vct_values: c.meta?.vct_values || [],
			claims: c.claims?.map(cl => cl.path) || []
		}))
	};
}