// CredentialDetail.js

import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { BiRightArrowAlt } from 'react-icons/bi';

import { useApi } from '../../api';

import CredentialInfo from '../../components/Credentials/CredentialInfo';
import CredentialJson from '../../components/Credentials/CredentialJson';
import { fetchCredentialData } from '../../components/Credentials/ApiFetchCredential';
import CredentialDeleteButton from '../../components/Credentials/CredentialDeleteButton';
import FullscreenPopup from '../../components/Popups/FullscreenImg';
import DeletePopup from '../../components/Popups/DeletePopup';

const CredentialDetail = () => {
	const api = useApi();
	const { id } = useParams();
	const [credential, setCredentials] = useState(null);
	const [showFullscreenImgPopup, setShowFullscreenImgPopup] = useState(false);
	const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [loading, setLoading] = useState(false);
	const { t } = useTranslation();

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
					<h1 className="text-2xl mb-2 font-bold text-gray-500">{t('common.navItemCredentials')}</h1>
					</Link>
						<BiRightArrowAlt className="text-2xl mb-2 text-custom-blue" />
					</div>
					{credential && (
						<h1 className="text-2xl mb-2 font-bold text-custom-blue">{credential.type.replace(/([A-Z])/g, ' $1')}</h1>
					)}
				</div>
				<hr className="mb-2 border-t border-custom-blue/80" />
				<p className="italic text-gray-700">{t('pageCredentials.details.description')}</p>

				<div className="flex flex-col lg:flex-row lg:mt-5 mt-0">
					{/* Block 1: credential */}
					<div className='lg:w-1/2'>
						{credential && credential.src ? (
						// Open the modal when the credential is clicked
						<div className="relative rounded-xl xl:w-4/5 pt-5 md:w-full sm:w-full overflow-hidden transition-shadow shadow-md hover:shadow-lg cursor-pointer w-full" onClick={() => setShowFullscreenImgPopup(true)}>
							<img src={credential.src} alt={credential.alt} className="w-full object-cover rounded-xl" />

						</div>
						) : (
							<></>
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
			{showFullscreenImgPopup && (
				<FullscreenPopup
					isOpen={showFullscreenImgPopup}
					onClose={() => setShowFullscreenImgPopup(false)}
					content={
						<img src={credential.src} alt={credential.src} className="max-w-full max-h-full rounded-xl" />
					}
				/>
			)}

			{/* Delete Credential Modal */}
			{showDeletePopup && credential && (

				<DeletePopup
				isOpen={showDeletePopup}
				onConfirm={handleSureDelete}
				onCancel={() => setShowDeletePopup(false)}
				message={
					<span>
						{t('pageCredentials.deletePopup.messagePart1')}{' '} <strong> {credential.type.replace(/([A-Z])/g, ' $1')}</strong> {t('pageCredentials.deletePopup.messagePart2')}
						<br /> {t('pageCredentials.deletePopup.messagePart3')}{' '} <strong>{t('pageCredentials.deletePopup.messagePart4')}</strong>					
					</span>
				}
				loading={loading}
			/>
      )}
		</>
	);
};

export default CredentialDetail;
