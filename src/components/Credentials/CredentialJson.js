// CredentialJson.js

import React, { useEffect, useState, useContext } from 'react';
import CredentialParserContext from "../../context/CredentialParserContext";


const CredentialJson = ({ credential, textAreaRows='10' }) => {
	const { credentialParserRegistry } = useContext(CredentialParserContext);
	const [parsedCredential, setParsedCredential] = useState(null);

	useEffect(() => {
		if (credentialParserRegistry) {
			credentialParserRegistry.parse(credential).then((c) => {
				if ('error' in c) {
					return;
				}
				setParsedCredential(c.beautifiedForm);
			});
		}
	}, [credential, credentialParserRegistry]);

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
