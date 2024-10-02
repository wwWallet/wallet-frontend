// CredentialJson.js

import React, { useEffect, useState, useContext } from 'react';

import { AiOutlineDown, AiOutlineUp } from 'react-icons/ai';
import GetButton from '../Buttons/GetButton';
import ContainerContext from '../../context/ContainerContext';

const CredentialJson = ({ credential }) => {
	const [showJsonCredentials, setShowJsonCredentials] = useState(false);


	const container = useContext(ContainerContext);

	const [parsedCredential, setParsedCredential] = useState(null);

	useEffect(() => {
		if (container) {
			container.credentialParserRegistry.parse(credential).then((c) => {
				if ('error' in c) {
					return;
				}
				setParsedCredential(c.beautifiedForm);
			});
		}
	}, [credential, container]);

	return (
		<div className=" lg:p-0 p-2 w-full">
			<div className="mb-4 flex items-center">
				<GetButton
					content={
						<>
							{showJsonCredentials ? 'Hide Credentials Details' : 'Show Credentials Details'}
							{showJsonCredentials ? (
								<AiOutlineUp className="ml-1" />
							) : (
								<AiOutlineDown className="ml-1" />
							)}
						</>
					}
					onClick={() => setShowJsonCredentials(!showJsonCredentials)}
					variant="primary"
				/>
			</div>

			<hr className="my-2 border-t border-primary dark:border-primary-light py-2" />

			{showJsonCredentials && parsedCredential ? (
				<div>
					<textarea
						rows="10"
						readOnly
						className="w-full dark:bg-gray-900 dark:text-white border rounded p-2 rounded-xl"
						value={JSON.stringify(parsedCredential, null, 2)}
					/>
				</div>
			) : (
				<p></p>
			)}
		</div>
	);
};

export default CredentialJson;
