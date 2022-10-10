
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
		usage: true,
		did: 'did:ebsi:zfGwMsrwZjJgpj6NmnjFMXM',
		url: 'http://localhost:8000'	
	}
}

export default config;