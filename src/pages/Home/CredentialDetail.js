// CredentialDetail.js

import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';

import { AiOutlineCloseCircle } from 'react-icons/ai';
import { BiRightArrowAlt } from 'react-icons/bi';

import { useApi } from '../../api';

import CredentialInfo from '../../components/Credentials/CredentialInfo';
import CredentialJson from '../../components/Credentials/CredentialJson';
import { fetchCredentialData } from '../../components/Credentials/ApiFetchCredential';
import CredentialDeleteButton from '../../components/Credentials/CredentialDeleteButton';
import CredentialDeletePopup from '../../components/Credentials/CredentialDeletePopup';

const CredentialDetail = () => {
	const api = useApi();
	const { id } = useParams();
	const [credential, setCredentials] = useState(null);
	const [isImageModalOpen, setImageModalOpen] = useState(false);
	const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [loading, setLoading] = useState(false);

	useEffect(() => {
		const getData = async () => {

			const newCredential = await fetchCredentialData(api, id);
			console.log(newCredential.json);
			setCredentials(newCredential);
		};
		getData();
	}, [api, id]);

	const handleSureDelete = async () => {
		setLoading(true);
		try {
			await api.del(`/storage/vc/${credential.credentialIdentifier}`);
		} catch (error) {
			console.error('Failed to delete data', error);
		}
		setLoading(false);
		setShowDeletePopup(false);
		window.location.href = '/';
	};

	return (
		<>
			<div className=" sm:px-6">
				<div className="flex flex-col sm:flex-row sm:items-center">
					<div className="flex items-center">
						<Link to="/">
    					<h1 className="text-2xl mb-2 font-bold text-gray-500">Credentials</h1>
				  	</Link>
						<BiRightArrowAlt className="text-2xl mb-2 text-custom-blue" />
					</div>
					{credential && (
						<h1 className="text-2xl mb-2 font-bold text-custom-blue">{credential.type.replace(/([A-Z])/g, ' $1')}</h1>
					)}
				</div>
				<hr className="mb-2 border-t border-custom-blue/80" />
				<p className="italic text-gray-700">View all the information about the chosen credential.</p>

				<div className="flex flex-col lg:flex-row lg:mt-5 mt-0">
					{/* Block 1: credential */}
					<div className='lg:w-1/2'>
						{credential && credential.src ? (
						// Open the modal when the credential is clicked
						<div className="relative rounded-xl xl:w-4/5 pt-5 md:w-full sm:w-full overflow-hidden transition-shadow shadow-md hover:shadow-lg cursor-pointer w-full" onClick={() => setImageModalOpen(true)}>
							<img src={credential.src} alt={credential.alt} className="w-full object-cover rounded-xl" />

						</div>
						) : (
							<p>No credential available</p>
						)}
					</div>

					{/* Block 2: Information List */}
					{credential && <CredentialInfo credential={credential} />} {/* Use the CredentialInfo component */}
				</div>

        <CredentialDeleteButton onDelete={() => { setShowDeletePopup(true); }} />

				<div className="flex flex-col lg:flex-row mt-4">
					<div className="lg:w-1/2">
						<CredentialJson credential={credential} />		
					</div>
				</div>
			</div>

			{/* Modal for Fullscreen credential */}
			{isImageModalOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
					<div className="relative">
						<img src={credential.src} alt={credential.src} className="max-w-full max-h-full rounded-xl" />
					</div>
					<button
							className="absolute top-20 md:top-4 sm:top-4 right-4 text-white text-2xl z-10"
							onClick={() => setImageModalOpen(false)}
					>
							<AiOutlineCloseCircle size={40} />
					</button>
				</div>
			)}

			{/* Delete Credential Modal */}
			{showDeletePopup && credential && (
        <CredentialDeletePopup
          credential={credential}
          onCancel={() => setShowDeletePopup(false)}
          onConfirm={handleSureDelete}
          loading={loading}
        />
      )}
		</>
	);
};

export default CredentialDetail;