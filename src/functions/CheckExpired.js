// CheckExpired.js
export function CheckExpired(data) {

	if (!data.exp || typeof data.exp != 'number') {
		return false;
	}
	const parsedExpiryDate = new Date(data.exp * 1000);
	console.log("Parsed expiry date = ", parsedExpiryDate)
	return parsedExpiryDate < new Date();
};
