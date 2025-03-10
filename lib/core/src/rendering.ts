import jsonpointer from 'jsonpointer';
import { formatDate } from './functions/formatDate';
import { CredentialRendering } from './interfaces';
import { escapeSVG } from './utils/escapeSVG';

export function CredentialRenderingService(): CredentialRendering {
	const renderSvgTemplate = async ({ json, credentialImageSvgTemplate, sdJwtVcMetadataClaims }: { json: any, credentialImageSvgTemplate: string, sdJwtVcMetadataClaims: any }) => {

		let svgContent = null;
		try {
			svgContent = credentialImageSvgTemplate;
		} catch (error) {
			return null; // Return null if fetching fails
		}

		if (svgContent) {
			// Build pathMap from credentialHeader.vctm.claims
			const pathMap = sdJwtVcMetadataClaims.reduce((acc: any, claim: any) => {
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
					let value = escapeSVG(jsonpointer.get(json, jsonPointerPath));

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

	return {
		renderSvgTemplate,
	}
}
