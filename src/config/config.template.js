
const STORE_BACKEND_HOST = "localhost";
const STORE_BACKEND_PORT = 8001;

const SIGNATORY_BACKEND_HOST = "localhost";
const SIGNATORY_BACKEND_PORT = 8002;

const config = {
	host: 'localhost',
	storeBackend: {
		url: `http://${STORE_BACKEND_HOST}:${STORE_BACKEND_PORT}`,
		vc_storage_url: `http://${STORE_BACKEND_HOST}:${STORE_BACKEND_PORT}/storage`
	},
	signatoryBackend: {
		url: `http://${SIGNATORY_BACKEND_HOST}:${SIGNATORY_BACKEND_PORT}`,
	}
}

export default config;