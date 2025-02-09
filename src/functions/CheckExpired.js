// CheckExpired.js
export function CheckExpired(claims) {
	if (!claims || !claims.exp || typeof claims.exp != 'number') {
		return false;
	}
	const parsedExpiryDate = new Date(claims.exp * 1000);
	return parsedExpiryDate < new Date();
};
