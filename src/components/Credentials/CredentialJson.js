// CredentialJson.js

import React from 'react';

const CredentialJson = ({ parsedCredential, textAreaRows='10' }) => {

	return (
		<div className='w-full'>
			{parsedCredential && (
				<div>
					<textarea
						rows={textAreaRows}
						readOnly
						className="dark:bg-gray-900 dark:text-white border rounded p-2 text-sm w-full rounded-xl"
						value={JSON.stringify(parsedCredential.signedClaims, null, 2)}
					/>
				</div>
			)}
		</div>
	);
};

export default CredentialJson;
