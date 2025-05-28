import React from 'react';
import JsonViewer from '../JsonViewer/JsonViewer'

const CredentialJson = ({ parsedCredential }) => {
	if (!parsedCredential?.signedClaims) return null;

	return (
		<div className='w-full py-2'>
			{parsedCredential && (
				<div className="h-60 resize-y overflow-auto min-h-32 bg-white dark:bg-gray-800 dark:text-white border rounded p-2 text-sm rounded-xl">
					<JsonViewer value={parsedCredential.signedClaims} />
				</div>
			)}
		</div>
	);
};
export default CredentialJson;
