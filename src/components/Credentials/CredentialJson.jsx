import React from 'react';

const CredentialJson = ({ parsedCredential, textAreaRows='10' }) => {
	// string truncation
	const MAX_LENGTH = 120;
	// array truncation
	const MAX_ARRAY_LENGTH = 3;

	// Truncate long strings or arrays (mainly picture/portrait fields)
	const replacer = (key, value) => {
		// picture (sd-jwt)
		if (typeof value === 'string' && value.length > MAX_LENGTH) {
			return value.slice(0, MAX_LENGTH) + '...';
		}
		// portrait (mdoc)
		if (value instanceof Uint8Array) {
			const arr = Array.from(value);
			if (arr.length > MAX_ARRAY_LENGTH) {
				const truncated = arr.slice(0, MAX_ARRAY_LENGTH);
				truncated.push('...');
				return truncated;
			}
			return arr;
		}
		return value;
	};

	//Truncate JSON
	const truncatedJson = parsedCredential
		? JSON.stringify(parsedCredential.signedClaims, replacer, 2)
		: '';

	//Render
	return (
		<div className='w-full'>
			{parsedCredential && (
				<div>
					<textarea
						rows={textAreaRows}
						readOnly
						className={`
							bg-c-lm-gray-200 dark:bg-c-dm-gray-800 border border-c-lm-gray-300 dark:border-c-dm-gray-700 
							text-c-lm-gray-900 dark:text-c-dm-gray-100 p-4 text-sm w-full rounded-xl
							dark:inputDarkModeOverride outline-none focus:ring-2 ring-c-lm-blue dark:ring-c-dm-blue transition-shadow duration-200
						`}
						value={truncatedJson}
					/>
				</div>
			)}
		</div>
	);
};

export default CredentialJson;
