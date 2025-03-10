import React from 'react';
import { formatDate } from '../../functions/DateFormat';
import { getLanguage } from '@/i18n';
import { useTranslation } from 'react-i18next';

const CredentialInfo = ({ signedClaims, claims, mainClassName = "text-sm lg:text-base w-full" }) => {
	const { i18n } = useTranslation();
	const defaultLang = i18n.language;

	console.log('signedClaims', signedClaims);
	console.log('claims', claims);

	// Enhanced function to get label based on language preferences
	const getLabelByLang = (displayArray, lang) => {
		const fallbackLang = i18n.options.fallbackLng;
		// Try to find label in the preferred language
		let displayObj = displayArray.find(d => getLanguage(d.lang) === lang);

		// If not found, try the i18n fallback language
		if (!displayObj) {
			displayObj = displayArray.find(d => getLanguage(d.lang) === fallbackLang);
		}

		// If still not found, default to the first available language
		if (!displayObj && displayArray.length > 0) {
			displayObj = displayArray[0];
		}

		return displayObj ? displayObj.label : '';
	};

	// Function to retrieve value from signedClaims based on path array
	const getValueByPath = (pathArray) => {
		console.log('pathArray', pathArray)
		return pathArray.reduce((acc, key) => acc[key], signedClaims);
	};

	// Safely access claims if claims is defined and claims are array
	const claimsWithValues = claims && Array.isArray(claims[0])
		? claims[0].map(claim => ({
			...claim,
			label: getLabelByLang(claim.display, defaultLang),
			value: formatDate(getValueByPath(claim.path), 'date')
		}))
		: []; // Fallback to empty array if undefined or null

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
	);
};

export default CredentialInfo;
