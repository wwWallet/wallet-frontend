// CredentialJson.js

import React, { useState } from 'react';

import { AiOutlineDown, AiOutlineUp } from 'react-icons/ai';

const CredentialJson = ({ credential }) => {
	const [showJsonCredentials, setShowJsonCredentials] = useState(false);

	return (
		<div className=" lg:p-0 p-2 w-full">
			<div className="mb-2 flex items-center">
				<button
					onClick={() => setShowJsonCredentials(!showJsonCredentials)}
					className="px-2 py-2 mb-2 text-white cursor-pointer flex items-center bg-custom-blue hover:bg-custom-blue-hover focus:ring-custom-blue font-medium rounded-lg text-sm px-4 py-2 text-center dark:bg-custom-blue-hover dark:hover:bg-custom-blue-hover dark:focus:ring-custom-blue-hover"
				>
					{showJsonCredentials ? 'Hide Credentials Details' : 'Show Credentials Details'}
					{showJsonCredentials ? (
						<AiOutlineUp className="ml-1" />
					) : (
						<AiOutlineDown className="ml-1" />
					)}
				</button>
			</div>

			<hr className="my-2 border-t border-gray-500 py-2" />

			{showJsonCredentials && credential ? (
				<div>
					<textarea
						rows="10"
						readOnly
						className="w-full border rounded p-2 rounded-xl"
						value={credential.json}
					/>
				</div>
			) : (
				<p></p>
			)}
		</div>
	);
};

export default CredentialJson;
