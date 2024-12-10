import axios from 'axios';
import jsonpointer from 'jsonpointer';
import { formatDate } from '../../functions/DateFormat';

const svgContent = `
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="829"
	height="504" version="1.1">

	<rect width="100%" height="100%" fill="{{backgroundColor}}" />

	{{backgroundImageBase64}}
	{{logoBase64}}

	<text x="50" y="80" font-family="Arial, Helvetica, sans-serif" font-size="35" fill="{{textColor}}" font-weight="normal">{{name}}</text>
	<text x="50" y="120" font-family="Arial, Helvetica, sans-serif" font-size="20" fill="{{textColor}}" font-weight="normal">{{description}}</text>
	<text x="790" y="431" text-anchor="end" font-family="Arial, Helvetica, sans-serif" font-size="25" fill="{{textColor}}" font-weight="normal">{{/expiry_date}}</text>
</svg>
`;

async function getBase64Image(url) {
	if (!url) return null;
	try {
		const response = await axios.get(url, { responseType: 'blob' });
		const blob = response.data;

		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onloadend = () => resolve(reader.result);
			reader.onerror = reject;
			reader.readAsDataURL(blob);
		});
	} catch (error) {
		console.error("Failed to load image", url);
		return null;
	}
}

const renderCustomSvgTemplate = async ({ beautifiedForm, name, description, logoURL, logoAltText, backgroundColor, textColor, backgroundImageURL }) => {
	try {
		const backgroundImageBase64 = await getBase64Image(backgroundImageURL);
		const logoBase64 = await getBase64Image(logoURL);

		let content = svgContent
			.replace(/{{backgroundColor}}/g, backgroundColor)
			.replace(
				/{{backgroundImageBase64}}/g,
				backgroundImageBase64
					? `<image xlink:href="${backgroundImageBase64}" x="0" y="0" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" />`
					: ''
			)
			.replace(
				/{{logoBase64}}/g,
				logoBase64
					? `<image xlink:href="${logoBase64}" x="50" y="380" height="20%"><title>${logoAltText}</title></image>`
					: ''
			)
			.replace(/{{name}}/g, name)
			.replace(/{{textColor}}/g, textColor)
			.replace(/{{description}}/g, description);

		const expiryDate = jsonpointer.get(beautifiedForm, "/expiry_date");
		content = content.replace(/{{\/expiry_date}}/g, expiryDate ? `Expiry Date: ${formatDate(expiryDate, 'date')}` : '');

		return `data:image/svg+xml;utf8,${encodeURIComponent(content)}`;
	} catch (error) {
		console.error("Error rendering SVG template", error);
		return null;
	}
};

export default renderCustomSvgTemplate;
