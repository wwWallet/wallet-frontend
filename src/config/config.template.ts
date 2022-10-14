
const STORE_BACKEND_HOST = "localhost";
const STORE_BACKEND_PORT = 8001;

const SIGNATORY_BACKEND_HOST = "localhost";
const SIGNATORY_BACKEND_PORT = 8002;

const FRONTEND_HOST = "localhost";
const FRONTEND_PORT = 3000;

const config = {
	host: FRONTEND_HOST,
	storeBackend: {
		url: `http://${STORE_BACKEND_HOST}:${STORE_BACKEND_PORT}`,
		vcStorageUrl: `http://${STORE_BACKEND_HOST}:${STORE_BACKEND_PORT}/storage`
	},
	signatoryBackend: {
		url: `http://${SIGNATORY_BACKEND_HOST}:${SIGNATORY_BACKEND_PORT}`,
	},
	oid4ci: {
		redirectUri: `http://${FRONTEND_HOST}:${FRONTEND_PORT}/consent`
	},
	devIssuer: { // will be removed when issuer urls are stored on the TIR
		usage: false,
		did: 'did:ebsi:zfGwMsrwZjJgpj6NmnjFMXM',
		url: '',
		authorizationEndpoint: "http://localhost:8000/issuer/authorize",
		tokenEndpoint: "http://localhost:8000/issuer/token",
		credentialEndpoint: "http://localhost:8000/issuer/credential"
	},
	devConformance: {
		usage: false,
		credential_type: "https://api.conformance.intebsi.xyz/trusted-schemas-registry/v2/schemas/zDMJPVx4yD3dMZ8n2pP5YEFwofkK5j65a7zwbhonsBVsf",
		conformanceHeader: "67005bfa-5f9d-4199-8a70-0bb842a3f15f",
		authorization_details: `[{"type":"openid_credential","credential_type":"https://api.conformance.intebsi.xyz/trusted-schemas-registry/v2/schemas/zDMJPVx4yD3dMZ8n2pP5YEFwofkK5j65a7zwbhonsBVsf","format":"jwt_vc"}]`,
	}
}

export default config;