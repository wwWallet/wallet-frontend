// CheckExpired.js
export function CheckExpired(expiry_date) {
	const today = new Date();
	const expirationDate = new Date(expiry_date);
	return expirationDate < today;
};
