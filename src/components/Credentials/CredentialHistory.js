// CredentialJson.js

import React, { useContext } from 'react';

import useFetchPresentations from '../../hooks/useFetchPresentations';
import SessionContext from '../../context/SessionContext';
import { formatDate } from '../../functions/DateFormat';

const CredentialHistory = ({ credentialIdentifier }) => {
	const { api } = useContext(SessionContext);
	const history = useFetchPresentations(api, credentialIdentifier);

	return (
		<div className=" lg:p-0 p-2">

			{history ? (
					<div className="my-4 overflow-auto space-y-2" style={{ maxHeight: '85vh' }}>
					{history.map((item) => (
						<button
							key={item.id}
							className="bg-white dark:bg-gray-800 text-sm px-4 py-2 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 break-words w-full text-left"
							style={{ wordBreak: 'break-all' }}
						>
							<div className="font-bold">{item.audience}</div>
							<div>{formatDate(item.issuanceDate)}</div>
						</button>
					))}
				</div>
			) : (
				<p></p>
			)}
		</div>
	);
};

export default CredentialHistory;
