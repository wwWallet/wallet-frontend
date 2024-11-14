import axios from 'axios';
import jsonpointer from 'jsonpointer';
import { formatDate } from '../../functions/DateFormat';

const renderSvgTemplate = async ({ beautifiedForm, credentialImageSvgTemplateURL, claims }) => {

	let svgContent = null;
	try {
		const response = await axios.get(credentialImageSvgTemplateURL);
		if (response.status !== 200) {
			throw new Error(`Failed to fetch SVG`);
		}
		svgContent = response.data;
	} catch (error) {
		return null; // Return null if fetching fails
	}

	if (svgContent) {
		// Build pathMap from credentialHeader.vctm.claims
		const pathMap = claims.reduce((acc, claim) => {
			if (claim.svg_id && claim.path) {
				acc[claim.svg_id] = claim.path;
			}
			return acc;
		}, {});

		// Regular expression to match {{svg_id}} placeholders
		const regex = /{{([^}]+)}}/g;
		const replacedSvgText = svgContent.replace(regex, (_match, svgId) => {
			// Retrieve the path array for the current svgId from pathMap
			const pathArray = pathMap[svgId];

			// If pathArray exists, convert it to a JSON pointer path
			if (Array.isArray(pathArray)) {
				const jsonPointerPath = `/${pathArray.join('/')}`;

				// Retrieve the value from beautifiedForm using jsonpointer
				let value = jsonpointer.get(beautifiedForm, jsonPointerPath);

				if (value !== undefined) {
					value = formatDate(value, 'date');
					return value;
				}
			}
			return '-';
		});
		const dataUri = `data:image/svg+xml;utf8,${encodeURIComponent(replacedSvgText)}`;
		return dataUri; // Return the data URI for the SVG
	}

	return null;
};

export default renderSvgTemplate;
