import React from 'react';
import { getLanguage } from '@/i18n';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLayerGroup } from '@fortawesome/pro-regular-svg-icons';

import { formatDate } from '@/functions/DateFormat';

const getLabelAndDescriptionByLang = (displayArray, lang, fallbackLang) => {
	// Finding the display object based on language or fallback language
	let displayObj = displayArray.find(d => getLanguage(d.lang) === lang) ||
		displayArray.find(d => getLanguage(d.lang) === fallbackLang);
	return {
		label: displayObj ? displayObj.label : displayArray[0]?.label || '',
		description: displayObj ? displayObj.description : displayArray[0]?.description || ''
	};
};

const getValueByPath = (pathArray, source) => {
	return pathArray.reduce((acc, key) => acc ? acc[key] : undefined, source);
};

const CredentialInfo = ({ parsedCredential, mainClassName = "text-sm lg:text-base w-full", fallbackClaims, fullWidth = false }) => {
	//General
	const { i18n } = useTranslation();
	const { language, options: { fallbackLng } } = i18n;

	//Data
	const signedClaims = parsedCredential?.signedClaims;
	const claims = parsedCredential?.metadata?.credential?.metadataDocuments?.[0]?.claims;

	// Define custom claims to display from signedClaims if claims is missing
	const customClaims = fallbackClaims ? fallbackClaims :
	[
		{ path: ['given_name'], display: [{ lang: 'en', label: 'Given Name' }] },
		{ path: ['family_name'], display: [{ lang: 'en', label: 'Family Name' }] },
		{ path: ['birth_date'], display: [{ lang: 'en', label: 'Birth Date' }] },
		{ path: ['document_number'], display: [{ lang: 'en', label: 'Document Number' }] },
		{ path: ['issuance_date'], display: [{ lang: 'en', label: 'Issuance Date' }] },
		{ path: ['expiry_date'], display: [{ lang: 'en', label: 'Expiry Date' }] },
	];

	// Check each customClaims for existence in signedClaims before displaying
	const existingCustomClaims = customClaims.filter(field => getValueByPath(field.path, signedClaims) !== undefined);

	// Prepare display claims
	const displayClaims = claims && Array.isArray(claims) ? claims : existingCustomClaims;

	// Filter and prepare claims for display
	const claimsWithValues = displayClaims.map(claim => {
		if (!claim.display || !claim.path) {
			return null;
		}
		const rawValue = getValueByPath(claim.path, signedClaims);
		const { label, description } = getLabelAndDescriptionByLang(claim.display, language, fallbackLng);
		if (rawValue && label) {
			let formattedValue = "";
			if (typeof rawValue === 'boolean') {
				formattedValue = String(rawValue);
			}
			else if (typeof rawValue !== 'string' && typeof rawValue !== 'number') {
				formattedValue = JSON.stringify(rawValue);
			}
			else {
				formattedValue = formatDate(rawValue, 'date'); // to handle dates and other types of values
			}

			return {
				label,
				description,
				value: formattedValue
			};
		}
		return null;
	}).filter(claim => claim !== null);

	//Render
	return (
		<div 
			data-testid="credential-info" 
		>
			{claimsWithValues.length > 0 && 
				<table className={`${fullWidth ? "w-full" : ""}`}>
					<tbody>
						{claimsWithValues.map((claim, index) => (
							<tr key={index}>
								<td className={`py-2 font-regular text-c-lm-gray-700 dark:text-c-dm-gray-300`}>
									{claim.label}
								</td>

								<td className={`${fullWidth ? "text-right" : "min-w-min max-w-[70%] pl-16"} py-2 font-regular text-c-lm-gray-900 dark:text-c-dm-gray-100`}>
									{claim.value}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			}
		</div>
	)
};

export default CredentialInfo;
