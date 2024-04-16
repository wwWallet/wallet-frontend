// CredentialDetail.js

import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { extractCredentialFriendlyName } from "../../functions/extractCredentialFriendlyName";
import { BiRightArrowAlt } from 'react-icons/bi';

import { useApi } from '../../api';

import CredentialInfo from '../../components/Credentials/CredentialInfo';
import CredentialJson from '../../components/Credentials/CredentialJson';
import CredentialDeleteButton from '../../components/Credentials/CredentialDeleteButton';
import FullscreenPopup from '../../components/Popups/FullscreenImg';
import DeletePopup from '../../components/Popups/DeletePopup';
import { CredentialImage } from '../../components/Credentials/CredentialImage';

const CredentialDetail = () => {
	const api = useApi();
	const { id } = useParams();
	const [vcEntity, setVcEntity] = useState(null);
	const [showFullscreenImgPopup, setShowFullscreenImgPopup] = useState(false);
	const [showDeletePopup, setShowDeletePopup] = useState(false);
	const [loading, setLoading] = useState(false);
	const { t } = useTranslation();
	const [credentialFiendlyName, setCredentialFriendlyName] = useState(null);




	useEffect(() => {
		const getData = async () => {
			const response = await api.get('/storage/vc');
			const vcEntity = response.data.vc_list
				.filter((vcEntity) => vcEntity.credentialIdentifier == id)[0];
			if (!vcEntity) {
				throw new Error("Credential not found");
			}
			setVcEntity(vcEntity);
		};

		getData();
	}, [api, id]);

	useEffect(() => {
		if (vcEntity && vcEntity.credential) {
			extractCredentialFriendlyName(vcEntity.credential).then((name) => {
				setCredentialFriendlyName(name);
			});
		}
	}, [vcEntity]);

	const handleSureDelete = async () => {
		setLoading(true);
		try {
			await api.del(`/storage/vc/${vcEntity.credentialIdentifier}`);
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
						<BiRightArrowAlt className="text-2xl mb-2 text-primary" />
					</div>
					{vcEntity && (
						<h1 className="text-2xl mb-2 font-bold text-primary">{credentialFiendlyName}</h1>
					)}
				</div>
				<hr className="mb-2 border-t border-primary/80" />
				<p className="italic text-gray-700">{t('pageCredentials.details.description')}</p>

				<div className="flex flex-col lg:flex-row lg:mt-5 mt-0">
					{/* Block 1: credential */}
					<div className='lg:w-1/2'>
						{vcEntity ? (
							// Open the modal when the credential is clicked
							<div className="relative rounded-xl xl:w-4/5 pt-5 md:w-full sm:w-full overflow-hidden transition-shadow shadow-md hover:shadow-lg cursor-pointer w-full" onClick={() => setShowFullscreenImgPopup(true)}>
								<CredentialImage credential={vcEntity.credential} className={"w-full object-cover rounded-xl"} />
							</div>
						) : (
							<></>
						)}
					</div>

					{/* Block 2: Information List */}
					{vcEntity && <CredentialInfo credential={vcEntity.credential} />} {/* Use the CredentialInfo component */}
				</div>

				<CredentialDeleteButton onDelete={() => { setShowDeletePopup(true); }} />

				<div className="flex flex-col lg:flex-row mt-4">
					<div className="lg:w-1/2">
						{vcEntity && <CredentialJson credential={vcEntity.credential} /> }
					</div>
				</div>
			</div>

			{/* Modal for Fullscreen credential */}
			{showFullscreenImgPopup && vcEntity && (
				<FullscreenPopup
					isOpen={showFullscreenImgPopup}
					onClose={() => setShowFullscreenImgPopup(false)}
					content={
						<CredentialImage credential={vcEntity.credential} className={"max-w-full max-h-full rounded-xl"} showRibbon={false} />
					}
				/>
			)}

			{/* Delete Credential Modal */}
			{showDeletePopup && vcEntity && (

				<DeletePopup
					isOpen={showDeletePopup}
					onConfirm={handleSureDelete}
					onCancel={() => setShowDeletePopup(false)}
					message={
						<span>
							{t('pageCredentials.deletePopup.messagePart1')}{' '} <strong> {credentialFiendlyName}</strong> {t('pageCredentials.deletePopup.messagePart2')}
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
