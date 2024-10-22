// CredentialJson.js

import React, { useEffect, useState, useContext } from 'react';

import ContainerContext from '../../context/ContainerContext';

const CredentialJson = ({ credential, textAreaRows='10' }) => {
	const container = useContext(ContainerContext);
	const [parsedCredential, setParsedCredential] = useState(null);

	useEffect(() => {
		if (container) {
			container.credentialParserRegistry.parse(credential.vc || credential).then((c) => {
				if ('error' in c) {
					return;
				}
				setParsedCredential(c.beautifiedForm);
			});
		}
	}, [credential, container]);

	return (
		<div className='w-full'>
			{parsedCredential && (
				<div>
					<textarea
						rows={textAreaRows}
						readOnly
						className="dark:bg-gray-900 dark:text-white border rounded p-2 text-sm w-full rounded-xl"
						value={JSON.stringify(parsedCredential, null, 2)}
					/>
				</div>
			)}
		</div>
	);
};

export default CredentialJson;
