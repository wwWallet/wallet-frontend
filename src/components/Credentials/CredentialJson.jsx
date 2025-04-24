// CredentialJson.js

import React from 'react';

const CredentialJson = ({ parsedCredential, textAreaRows='10' }) => {
	const MAX_LENGTH = 120;       // string truncation
	const MAX_ARRAY_LENGTH = 3;   // array truncation

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

	const truncatedJson = parsedCredential
		? JSON.stringify(parsedCredential.signedClaims, replacer, 2)
		: '';

	return (
		<div className='w-full'>
			{parsedCredential && (
				<div>
					<textarea
						rows={textAreaRows}
						readOnly
						className="dark:bg-gray-900 dark:text-white border rounded p-2 text-sm w-full rounded-xl"
						value={truncatedJson}
					/>
				</div>
			)}
		</div>
	);
};

export default CredentialJson;
