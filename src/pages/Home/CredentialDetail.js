// External libraries
import React, { useState, useEffect, useContext } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";

// Contexts
import SessionContext from '../../context/SessionContext';
import ContainerContext from '../../context/ContainerContext';

// Hooks
import useFetchPresentations from '../../hooks/useFetchPresentations';

// Components
import { H1 } from '../../components/Heading';
import Tabs from '../../components/Tabs';
import CredentialInfo from '../../components/Credentials/CredentialInfo';
import CredentialJson from '../../components/Credentials/CredentialJson';
import CredentialHistory from '../../components/Credentials/History/CredentialHistory';
import CredentialDeleteButton from '../../components/Credentials/CredentialDeleteButton';
import CredentialImage from '../../components/Credentials/CredentialImage';
import FullscreenPopup from '../../components/Popups/FullscreenImg';
import DeletePopup from '../../components/Popups/DeletePopup';

const CredentialDetail = () => {
	const { id } = useParams();
	const { api } = useContext(SessionContext);
	const container = useContext(ContainerContext);
	const history = useFetchPresentations(api, id);
	const [vcEntity, setVcEntity] = useState(null);
	const [showFullscreenImgPopup, setShowFullscreenImgPopup] = useState(false);
	const [showDeletePopup, setShowDeletePopup] = useState(false);
	const [loading, setLoading] = useState(false);
	const [credentialFiendlyName, setCredentialFriendlyName] = useState(null);
	const { t } = useTranslation();
	const isMobileScreen = window.innerWidth < 480;
	const [activeTab, setActiveTab] = useState(0);

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

	const tabs = [
		{ label: 'Details', component: <CredentialJson credential={vcEntity?.credential} /> },
		{ label: 'History', component: <CredentialHistory history={history} /> },
	];

	return (
		<>
			<div className=" sm:px-6">
				{!isMobileScreen ? (
					<H1
						heading={<Link to="/">{t('common.navItemCredentials')}</Link>}
						flexJustifyContent="start"
						textColorClass="text-gray-500 hover:text-primary dark:text-primary-light dark:hover:text-primary-light hover:underline"
					>
						<FaArrowRight size={20} className="mx-2 text-2xl mb-2 text-primary dark:text-primary-light" />

						{vcEntity && (
							<H1 heading={credentialFiendlyName} hr={false} />
						)}
					</H1>
				) : (
					<FaArrowLeft className="mr-2 text-2xl mb-2 text-primary dark:text-primary-light" />
				)}

				{!isMobileScreen && (
					<p className="italic text-gray-700 dark:text-gray-300">{t('pageCredentials.details.description')}</p>
				)}
				<div className="flex flex-col lg:flex-row lg:mt-5 mt-0">
					{/* Block 1: credential */}
					<div className='flex flex-row'>
						<div className='flex flex-row items-center gap-5 mt-2 px-2'>
							{vcEntity && (
								// Open the modal when the credential is clicked
								<button className="relative rounded-xl max480:rounded-lg w-1/2 lg:w-4/5 max480:w-4/12 overflow-hidden transition-shadow shadow-md hover:shadow-lg cursor-pointer w-full"
									onClick={() => setShowFullscreenImgPopup(true)}
									aria-label={`${credentialFiendlyName}`}
									title={t('pageCredentials.credentialFullScreenTitle', { friendlyName: credentialFiendlyName })}
								>
									<CredentialImage credential={vcEntity.credential} className={"w-full object-cover"} />
								</button>
							)}
							<div>
								{isMobileScreen && (
									<p className='text-xl font-bold text-primary dark:text-white'>{credentialFiendlyName}</p>
								)}
							</div>
						</div>
					</div>

					{/* Block 2: Information List */}
					{vcEntity && <CredentialInfo credential={vcEntity.credential} />} {/* Use the CredentialInfo component */}
				</div>

				<div className="my-4 p-2">
					<Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
					<div className='pt-2'>
						{tabs[activeTab].component}
					</div>
				</div>
				<div className='pl-2'>
					<CredentialDeleteButton onDelete={() => { setShowDeletePopup(true); }} />
				</div>
			</div>

			{/* Fullscreen credential Popup*/}
			{showFullscreenImgPopup && vcEntity && (
				<FullscreenPopup
					isOpen={showFullscreenImgPopup}
					onClose={() => setShowFullscreenImgPopup(false)}
					content={
						<CredentialImage credential={vcEntity.credential} className={"max-w-full max-h-full rounded-xl"} showRibbon={false} />
					}
				/>
			)}

			{/* Delete Credential Popup */}
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
