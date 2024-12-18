const parseJwt = (token: string) => {
	const base64Url = token.split('.')[1];
	const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
	const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
			return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
	}).join(''));

	return JSON.parse(jsonPayload);
}

export const parseJwtVcJsonCredential = async (credential: string | object): Promise<{ beautifiedForm: any; } | { error: string }> => {
	try {
		if (typeof credential == 'string') { // is JWT
			return {
				beautifiedForm: parseJwt(credential),
			}
		}
		return { error: "Could not parse JWT_VC_JSON credential" };
	}
	catch (err) {
		console.error(err);
		return { error: "Could not parse JWT_VC_JSON credential" };
	}
}
