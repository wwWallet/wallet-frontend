import { CredentialOfferSchema } from '../schemas/CredentialOfferSchema';

const PARAM_CREDENTIAL_OFFER = 'credential_offer';
const PARAM_CREDENTIAL_OFFER_URI = 'credential_offer_uri';

// @todo: return type
export const credentialOfferFromUrl = async (url: string) => {
	const parsedUrl = new URL(url);
	if (parsedUrl.searchParams.get(PARAM_CREDENTIAL_OFFER)) {
		return CredentialOfferSchema.parse(JSON.parse(parsedUrl.searchParams.get(PARAM_CREDENTIAL_OFFER)));
	}
	try {
		const response = await fetch(parsedUrl.searchParams.get(PARAM_CREDENTIAL_OFFER_URI), {});
		return await response.json();
	} catch (err) {
		console.error(err);
		return;
	}
};