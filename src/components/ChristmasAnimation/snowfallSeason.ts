const parseAnnualDate = (value: string): number | undefined => {
	const match = /^(\d{2})\/(\d{2})$/.exec(value);
	if (!match) return undefined;

	const day = Number(match[1]);
	const month = Number(match[2]);
	const candidate = new Date(2000, month - 1, day);

	if (
		candidate.getMonth() !== month - 1
		|| candidate.getDate() !== day
	) {
		return undefined;
	}

	return month * 100 + day;
};

export const isDateInAnnualRange = (
	date: Date,
	dateRange: string,
): boolean => {
	const range = /^(\d{2}\/\d{2})-(\d{2}\/\d{2})$/.exec(dateRange);
	if (!range) return false;

	const start = parseAnnualDate(range[1]);
	const end = parseAnnualDate(range[2]);

	if (start === undefined || end === undefined) return false;

	const current = (date.getMonth() + 1) * 100 + date.getDate();

	return start <= end
		? current >= start && current <= end
		: current >= start || current <= end;
};
