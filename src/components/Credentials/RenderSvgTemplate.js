import { useState, useEffect } from 'react';
import jsonpointer from 'jsonpointer';
import { formatDate } from '../../functions/DateFormat';

const RenderSvgTemplate = ({ credential, onSvgGenerated }) => {
	const [svgContent, setSvgContent] = useState(null);

	useEffect(() => {
		const fetchSvgContent = async () => {
			try {
				const response = await fetch(credential.credentialImage.credentialImageSvgTemplateURL);
				if (!response.ok) {
					throw new Error(`Failed to fetch SVG from ${credential.credentialImage.credentialImageSvgTemplateURL}`);
				}

				const svgText = await response.text();
				setSvgContent(svgText);
			} catch (error) {
				console.error(error);
			}
		};

		if (credential.credentialImage.credentialImageSvgTemplateURL) {
			fetchSvgContent();
		}
	}, [credential.credentialImage.credentialImageSvgTemplateURL]);

	useEffect(() => {
		if (svgContent) {
			const regex = /{{([^}]+)}}/g;

			const replacedSvgText = svgContent.replace(regex, (match, content) => {
				let res = jsonpointer.get(credential.beautifiedForm, content.trim());
				res = formatDate(res, 'date');
				return res !== undefined ? res : match;
			});
			const dataUri = `data:image/svg+xml;utf8,${encodeURIComponent(replacedSvgText)}`;
			onSvgGenerated(dataUri);
		}
	}, [svgContent, credential.beautifiedForm, onSvgGenerated]);

	return null;
};

export default RenderSvgTemplate;
