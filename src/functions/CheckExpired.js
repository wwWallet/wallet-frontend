// CheckExpired.js
export function CheckExpired(expiry_date) {
	if (!expiry_date) {
		return false;
	}

	const parsedExpiryDate = typeof expiry_date == 'string' ? expiry_date : new Date(expiry_date * 1000).toISOString();
	const today = new Date();
	const expirationDate = new Date(parsedExpiryDate);
	return expirationDate < today;
};
