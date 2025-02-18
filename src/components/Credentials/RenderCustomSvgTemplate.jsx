import axios from 'axios';
import jsonpointer from 'jsonpointer';
import { formatDate } from '../../functions/DateFormat';
import customTemplate from '../../assets/images/custom_template.svg';

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
		const response = await fetch(customTemplate);
		if (!response.ok) throw new Error("Failed to fetch SVG template");

		let svgContent = await response.text();

		const backgroundImageBase64 = await getBase64Image(backgroundImageURL);
		const logoBase64 = await getBase64Image(logoURL);

		svgContent = svgContent
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

		const expiryDate = jsonpointer.get(beautifiedForm, "/expiry_date") ?? new Date(jsonpointer.get(beautifiedForm, "/exp") * 1000).toISOString();
		svgContent = svgContent.replace(/{{\/expiry_date}}/g, expiryDate ? `Expiry Date: ${formatDate(expiryDate, 'date')}` : '');

		return `data:image/svg+xml;utf8,${encodeURIComponent(svgContent)}`;
	} catch (error) {
		console.error("Error rendering SVG template", error);
		return null;
	}
};

export default renderCustomSvgTemplate;
