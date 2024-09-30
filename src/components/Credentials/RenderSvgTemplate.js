import { useState, useEffect } from 'react';
import jsonpointer from 'jsonpointer';
import { formatDate } from '../../functions/DateFormat';

const RenderSvgTemplate = ({ credential, onSvgGenerated }) => {
	const [svgContent, setSvgContent] = useState(null);

	useEffect(() => {
		const fetchSvgContent = async () => {
			try {
				const response = await fetch(credential.renderMethod.id);
				if (!response.ok) {
					throw new Error(`Failed to fetch SVG from ${credential.renderMethod.id}`);
				}

				const svgText = await response.text();
				setSvgContent(svgText);
			} catch (error) {
				console.error(error);
			}
		};

		if (credential.renderMethod.id) {
			fetchSvgContent();
		}
	}, [credential.renderMethod.id]);

	useEffect(() => {
		if (svgContent) {
			const regex = /{{([^}]+)}}/g;
			const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/; // Matches ISO date format
			const replacedSvgText = svgContent.replace(regex, (match, content) => {
				const res = jsonpointer.get(credential, content.trim());
				// Check if the resolved value is a date and format it
				if (typeof res === 'string' && dateRegex.test(res)) {
					return formatDate(res);
				}
				return res !== undefined ? res : match;
			});
			const dataUri = `data:image/svg+xml;utf8,${encodeURIComponent(replacedSvgText)}`;
			onSvgGenerated(dataUri);
		}
	}, [svgContent, credential, onSvgGenerated]);

	return null; // No need to render anything, we're just generating the SVG
};

export default RenderSvgTemplate;
