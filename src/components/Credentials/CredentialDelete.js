// CredentialJson.js

import React, { useState } from 'react';

import { MdDelete } from "react-icons/md";
import Spinner from '../../components/Spinner';
import {useApi} from '../../api';

const CredentialDelete = ({ credential }) => {
	const [showPopup, setShowPopup] = useState(false);
	const [loading, setLoading] = useState(false);
	const api = useApi();

	console.log(credential);
	const handleDeleteCredential = () => {
		setShowPopup(true);
	};

  const handleCancelDelete = () => {
    setShowPopup(false);
  };

	const handleSureDelete = async () => {
		setLoading(true);
		try {
			await api.del(`/storage/vc/${credential.credentialIdentifier}`);
		} catch (error) {
			console.error('Failed to delete data', error);
		}
		setLoading(false);
		setShowPopup(false);
		window.location.href = '/';
	};
  return (
		<div className=" lg:p-0 p-2 w-full">
			{credential && (
			<button
				className="lg:mt-5 mt-2 text-white cursor-pointer flex items-center bg-red-600 hover:bg-red-800 font-medium rounded-lg text-sm px-4 py-2 text-center"
				onClick={() => handleDeleteCredential(credential)}
			>
				<MdDelete size={20}/> Delete
			</button>
			)}
			{showPopup && credential &&(
				<div className="fixed inset-0 flex items-center justify-center z-50">
					<div className="absolute inset-0 bg-black opacity-50"></div>
					<div className="bg-white p-4 rounded-lg shadow-lg w-full lg:w-[33.33%] sm:w-[66.67%] z-10 relative m-4">
						{loading ? (
							<div className="flex items-center justify-center h-24">
								<Spinner />
							</div>
						) : (
							<>
								<h2 className="text-lg font-bold mb-2 text-custom-blue">
									<MdDelete size={20} className="inline mr-1 mb-1" /> 
									Delete: {credential.type.replace(/([A-Z])/g, ' $1')}
								</h2>
								<hr className="mb-2 border-t border-custom-blue/80" />
								<p className="mb-2 mt-4 text-md">
									Are you sure you want to delete the <strong> {credential.type.replace(/([A-Z])/g, ' $1')}</strong> credential? 
									<br></br>
									If you delete it, <strong>all historical presentations related to this credential will also be deleted</strong>.
								</p>
								<div className="flex justify-end space-x-2 pt-4">
									<button className="px-4 py-2 text-gray-900 bg-gray-300 hover:bg-gray-400 font-medium rounded-lg text-sm px-5 py-2.5 text-center" onClick={handleCancelDelete}>
										Cancel
									</button>
									<button className="px-4 py-2 text-white bg-red-600 hover:bg-red-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center" onClick={handleSureDelete}>
										Delete
									</button>
								</div>
							</>
						)}
					</div>
				</div>
			)}

		</div>
	);
};

export default CredentialDelete;