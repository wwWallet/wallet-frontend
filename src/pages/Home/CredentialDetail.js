import React, { useState, useEffect, useContext } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import { BiRightArrowAlt } from 'react-icons/bi';

import SessionContext from '../../context/SessionContext';

import CredentialInfo from '../../components/Credentials/CredentialInfo';
import CredentialJson from '../../components/Credentials/CredentialJson';
import CredentialDeleteButton from '../../components/Credentials/CredentialDeleteButton';
import FullscreenPopup from '../../components/Popups/FullscreenImg';
import DeletePopup from '../../components/Popups/DeletePopup';
import { CredentialImage } from '../../components/Credentials/CredentialImage';
import { H1 } from '../../components/Heading';
import ContainerContext from '../../context/ContainerContext';


const CredentialDetail = () => {
	const { api } = useContext(SessionContext);
	const { id } = useParams();
	const [vcEntity, setVcEntity] = useState(null);
	const [showFullscreenImgPopup, setShowFullscreenImgPopup] = useState(false);
	const [showDeletePopup, setShowDeletePopup] = useState(false);
	const [loading, setLoading] = useState(false);
	const { t } = useTranslation();
	const [credentialFiendlyName, setCredentialFriendlyName] = useState(null);

	const container = useContext(ContainerContext);

	useEffect(() => {
		const getData = async () => {
			const response = await api.get('/storage/vc');
			const vcEntity = response.data.vc_list
				.filter((vcEntity) => vcEntity.credentialIdentifier === id)[0];
			if (!vcEntity) {
				throw new Error("Credential not found");
			}
			setVcEntity(vcEntity);
		};

		getData();
	}, [api, id]);

	useEffect(() => {
		if (!vcEntity) {
			return;
		}
		container.credentialParserRegistry.parse(vcEntity.credential).then((c) => {
			if ('error' in c) {
				return;
			}
			setCredentialFriendlyName(c.credentialFriendlyName);
		});
	}, [vcEntity, container]);

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
				<H1
					heading={<Link to="/">{t('common.navItemCredentials')}</Link>}
					flexJustifyContent="start"
					textColorClass="text-gray-500 hover:text-primary dark:text-primary-light dark:hover:text-primary-light hover:underline"
				>
					<BiRightArrowAlt className="text-2xl mb-2 text-primary dark:text-primary-light" />
					{vcEntity && (
						<H1 heading={credentialFiendlyName} hr={false} />
					)}
				</H1>
				<p className="italic text-gray-700 dark:text-gray-300">{t('pageCredentials.details.description')}</p>

				<div className="flex flex-col lg:flex-row lg:mt-5 mt-0">
					{/* Block 1: credential */}
					<div className='lg:w-1/2'>
						{vcEntity ? (
							// Open the modal when the credential is clicked
							<button className="relative rounded-xl xl:w-4/5 mt-5 md:w-full sm:w-full overflow-hidden transition-shadow shadow-md hover:shadow-lg cursor-pointer w-full"
								onClick={() => setShowFullscreenImgPopup(true)}
								aria-label={`${credentialFiendlyName}`}
								title={t('pageCredentials.credentialFullScreenTitle', { friendlyName: credentialFiendlyName })}
							>
								<CredentialImage credential={vcEntity.credential} className={"w-full object-cover rounded-xl"} />
							</button>
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
						{vcEntity && <CredentialJson credential={vcEntity.credential} />}
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
						<Trans
							i18nKey="pageCredentials.deletePopupMessage"
							values={{ credentialName: credentialFiendlyName }}
							components={{ strong: <strong />, br: <br /> }}
						/>
					}
					loading={loading}
				/>
			)}
		</>
	);
};

export default CredentialDetail;
