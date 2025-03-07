export function escapeSVG(str: string) {
	if (typeof str !== "string") return str;

	return str.replace(/[<>&"']/g, function (match) {
		switch (match) {
			case '<': return '&lt;';
			case '>': return '&gt;';
			case '&': return '&amp;';
			case '"': return '&quot;';
			case "'": return '&apos;';
			default: return match;
		}
	});
}
