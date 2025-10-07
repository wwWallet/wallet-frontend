const prettyDomain = (raw) => {
	if (!raw) return '';
	let value = raw.trim();

	if (value.startsWith('origin:')) value = value.slice(7);
	if (value.startsWith('x509_san_dns:')) value = value.slice(13);

	try {
		const url = new URL(value);
		return url.host || value;
	} catch {
		return value;
	}
};

export default prettyDomain;
