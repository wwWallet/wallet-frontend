import React from 'react';
import JsonViewer from '../JsonViewer/JsonViewer'

const CredentialJson = ({ parsedCredential }) => {
	if (!parsedCredential?.signedClaims) return null;

	return (
		<div className='w-full'>
			{parsedCredential && (
		<div className="dark:bg-gray-800 dark:text-white border rounded p-2 text-sm w-full rounded-xl">
		<JsonViewer value={parsedCredential.signedClaims} />
	</div>
			)}
		</div>
	);
};
export default CredentialJson;
