import axios from 'axios';
import jsonpointer from 'jsonpointer';
import { formatDate } from '../../functions/DateFormat';
import customTemplate from '../../assets/images/custom_template.svg';

// Helper function to fetch an image and convert it to Base64
async function getBase64Image(url) {
	if (url) {
		try {
			const response = await axios.get(url, { responseType: 'blob' }); // Get the image as a Blob
			console.log(url, response);
			const blob = response.data;


			// Convert Blob to Base64 using FileReader
			return await new Promise((resolve, reject) => {
				const reader = new FileReader();
				reader.onloadend = () => resolve(reader.result);
				reader.onerror = reject;
				reader.readAsDataURL(blob); // This will output a Data URI (Base64 encoded)
			});
		} catch (error) {
			console.error("Failed to load image", url);
			return null;
		}
	}
	return null;
}

const renderCustomSvgTemplate = async ({ beautifiedForm, name, description, logoURL, logoAltText, backgroundColor, textColor, backgroundImageURL }) => {
	let svgContent = null;

	console.log('backgroundImageURL', backgroundImageURL);
	try {
		const response = await axios.get(customTemplate);
		if (response.status !== 200) {
			throw new Error(`Failed to fetch SVG`);
		}
		svgContent = response.data;
	} catch (error) {
		return null; // Return null if fetching fails
	}

	const backgroundImageBase64 = await getBase64Image(backgroundImageURL);
	const logoBase64 = await getBase64Image(logoURL);

	if (svgContent) {

		svgContent = svgContent.replace(/{{backgroundColor}}/g, backgroundColor || '#808080')
		svgContent = svgContent.replace(
			/{{backgroundImageBase64}}/g,
			backgroundImageBase64
				? `<image xlink:href="${backgroundImageBase64}" x="0" y="0" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" />`
				: ''
		);
		svgContent = svgContent.replace(
			/{{logoBase64}}/g,
			logoBase64
				? `<image xlink:href="${logoBase64}" x="50" y="380" height="20%">
						//  <title>${logoAltText || 'Logo'}</title>
					 </image>`
				: ''
		);

		svgContent = svgContent.replace(
			/{{name}}/g,
			name
				? `${name}`
				: ''
		);

		svgContent = svgContent.replace(
			/{{textColor}}/g,
			textColor
				? `${textColor}`
				: ''
		);

		svgContent = svgContent.replace(
			/{{description}}/g,
			description
				? `${description}`
				: ''
		);

		const expiryDate = jsonpointer.get(beautifiedForm, "/expiry_date");
		if (expiryDate) {
			svgContent = svgContent.replace(/{{\/expiry_date}}/g, `Expiry Date: ${formatDate(expiryDate, 'date')}`);
		} else {
			svgContent = svgContent.replace(/{{\/expiry_date}}/g, ``);
		}

		const dataUri = `data:image/svg+xml;utf8,${encodeURIComponent(svgContent)}`;
		return dataUri; // Return the data URI for the SVG
	}

	return null; // Return null if no SVG content is available
};

export default renderCustomSvgTemplate;
