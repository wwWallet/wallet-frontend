const PARAM_REQUEST_URI = 'request_uri';

// @todo: return type
export const requestFromUrl = async (url: string) => {
	const parsedUrl = new URL(url);
	try {
		const response = await fetch(parsedUrl.searchParams.get(PARAM_REQUEST_URI), {});
		return await response.text();
	} catch (err) {
		console.error(err);
		return;
	}
};
