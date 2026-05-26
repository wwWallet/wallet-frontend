type CborDateWrapper = {
	date: Date | string | number;
};

/**
 * Detects CBOR tag 1004 date wrapper objects.
 */
export const isCborDate = (value: unknown): value is CborDateWrapper => {
	if (typeof value !== 'object' || value === null) {
		return false;
	}

	if (!('date' in value)) {
		return false;
	}

	const dateValue = value.date;

	return (
		dateValue instanceof Date ||
		typeof dateValue === 'string' ||
		typeof dateValue === 'number'
	);
};

/**
 * Formats a CBOR date wrapper into a localized date string.
 */
export const formatCborDate = (
	value: CborDateWrapper,
	locales: string | string[] = 'en-GB',
): string => {
	const rawDate = value.date;

	const parsedDate =
		rawDate instanceof Date
			? rawDate
			: new Date(rawDate);

	if (Number.isNaN(parsedDate.getTime())) {
		return String(rawDate);
	}

	return parsedDate.toLocaleDateString(locales);
};
