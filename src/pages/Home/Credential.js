// External libraries
import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';

// Contexts
import SessionContext from '../../context/SessionContext';
import CredentialsContext from '../../context/CredentialsContext';

// Hooks
import useFetchPresentations from '../../hooks/useFetchPresentations';
import useScreenType from '../../hooks/useScreenType';
import { useVcEntity } from '../../hooks/useVcEntity';

// Components
import CredentialTabs from '../../components/Credentials/CredentialTabs';
import CredentialInfo from '../../components/Credentials/CredentialInfo';
import CredentialJson from '../../components/Credentials/CredentialJson';
import HistoryList from '../../components/History/HistoryList';
import CredentialDeleteButton from '../../components/Credentials/CredentialDeleteButton';
import DeletePopup from '../../components/Popups/DeletePopup';
import Button from '../../components/Buttons/Button';
import CredentialLayout from '../../components/Credentials/CredentialLayout';
import CredentialParserContext from '../../context/CredentialParserContext';

const Credential = () => {
	const { credentialId } = useParams();
	const { api } = useContext(SessionContext);
	const history = useFetchPresentations(api, credentialId, null);
	const [showDeletePopup, setShowDeletePopup] = useState(false);
	const [loading, setLoading] = useState(false);
	const [credentialFiendlyName, setCredentialFriendlyName] = useState(null);
	const screenType = useScreenType();
	const [activeTab, setActiveTab] = useState(0);
	const navigate = useNavigate();
	const { t } = useTranslation();

	const { credentialParserRegistry } = useContext(CredentialParserContext);
	const { vcEntityList, vcEntityListInstances, fetchVcData } = useContext(CredentialsContext);

	const {vcEntity, vcEntityInstances} = useVcEntity(fetchVcData, vcEntityList, vcEntityListInstances, credentialId);

	console.log('-> vcEntity',vcEntity)
	console.log('-> vcEntityInstances',vcEntityInstances)
	useEffect(() => {
		if (!vcEntity) {
			return;
		}
		credentialParserRegistry.parse(vcEntity.credential).then((c) => {
			if ('error' in c) {
				return;
			}
			setCredentialFriendlyName(c.credentialFriendlyName);
		});
	}, [vcEntity, credentialParserRegistry]);

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

	const infoTabs = [
		{ label: t('pageCredentials.datasetTitle'), component: <CredentialJson credential={vcEntity?.credential} /> },
		{
			label: t('pageCredentials.presentationsTitle'), component:
				<>
					{history.length === 0 ? (
						<p className="text-gray-700 dark:text-white">
							{t('pageHistory.noFound')}
						</p>
					) : (
						<HistoryList history={history} />
					)}
				</>
		}
	];

	return (
		<CredentialLayout title={t('pageCredentials.credentialTitle')}>
			<>
				<div className="flex flex-col lg:flex-row w-full md:w-1/2 lg:mt-5 mt-0">

					{/* Block 2: Information List */}
					{vcEntity && <CredentialInfo credential={vcEntity.credential} />} {/* Use the CredentialInfo component */}
				</div>

				<div className="w-full pt-2 px-2">
					{screenType !== 'mobile' ? (
						<>
							<CredentialTabs tabs={infoTabs} activeTab={activeTab} onTabChange={setActiveTab} />
							<div className='py-2'>
								{infoTabs[activeTab].component}
							</div>
						</>
					) : (
						<>
							<Button
								variant="primary"
								onClick={() => navigate(`/credential/${credentialId}/history`)}
								additionalClassName='w-full my-2'
							>
								{t('pageCredentials.presentationsTitle')}
							</Button>
							<Button
								variant="primary"
								onClick={() => navigate(`/credential/${credentialId}/details`)}
								additionalClassName='w-full my-2'
							>
								{t('pageCredentials.datasetTitle')}
							</Button>
						</>
					)}
				</div>
				<div className='px-2 w-full'>
					<CredentialDeleteButton onDelete={() => { setShowDeletePopup(true); }} />
				</div>

				{/* Delete Credential Popup */}
				{showDeletePopup && vcEntity && (
					<DeletePopup
						isOpen={showDeletePopup}
						onConfirm={handleSureDelete}
						onClose={() => setShowDeletePopup(false)}
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
		</CredentialLayout>
	);
};

export default Credential;
