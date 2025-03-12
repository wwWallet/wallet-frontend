import React from 'react';
import { formatDate } from '../../functions/DateFormat';
import { getLanguage } from '@/i18n';
import { useTranslation } from 'react-i18next';

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

const CredentialInfo = ({ parsedCredential, mainClassName = "text-sm lg:text-base w-full" }) => {
	const { i18n } = useTranslation();
	const { language, options: { fallbackLng } } = i18n;

	const signedClaims = parsedCredential?.signedClaims;
	const claims = parsedCredential?.metadata?.credential?.metadataDocuments?.[0]?.claims;

	// Define custom claims to display from signedClaims if claims is missing
	const customClaims = [
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
		const rawValue = getValueByPath(claim.path, signedClaims);
		const { label, description } = getLabelAndDescriptionByLang(claim.display, language, fallbackLng);
		if (rawValue && label) {
			const formattedValue = typeof rawValue === 'boolean' ? String(rawValue) : formatDate(rawValue, 'date');
			return {
				label,
				description,
				value: formattedValue
			};
		}
		return null;
	}).filter(claim => claim !== null);

	return (
		<div className={mainClassName} data-testid="credential-info">
			{claimsWithValues.length > 0 && (
				<div>
					{claimsWithValues.map((claim, index) => (
						<p key={index} className='py-1 px-2'>
							<span className='font-bold text-primary dark:text-primary-light'>
								{claim.label}:{' '}
							</span>
							<span className="text-gray-700 dark:text-white">
								{claim.value}
							</span>
						</p>
					))}
				</div>
			)}
		</div>
	)
};

export default CredentialInfo;
