import { CredentialOfferSchema } from "../schemas/CredentialOfferSchema";
import ProxyClient from '../http/proxy-client';

const PARAM_CREDENTIAL_OFFER = 'credential_offer';
const PARAM_CREDENTIAL_OFFER_URI = 'credential_offer_uri';

// @todo: return type
export const credentialOfferFromUrl = async (url: string) => {
	const parsedUrl = new URL(url);
	if (parsedUrl.searchParams.get(PARAM_CREDENTIAL_OFFER)) {
		return CredentialOfferSchema.parse(JSON.parse(parsedUrl.searchParams.get(PARAM_CREDENTIAL_OFFER)));
	}
	try {
		const { data } = await ProxyClient.get(parsedUrl.searchParams.get(PARAM_CREDENTIAL_OFFER_URI), {});
		return data;
	} catch (err) {
		console.error(err);
		return;
	}
};
