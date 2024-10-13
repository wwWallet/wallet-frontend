// External libraries
import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Trans } from 'react-i18next';

// Contexts
import SessionContext from '../../context/SessionContext';
import ContainerContext from '../../context/ContainerContext';

// Hooks
import useFetchPresentations from '../../hooks/useFetchPresentations';

// Components
import CredentialTabs from '../../components/Credentials/CredentialTabs';
import CredentialInfo from '../../components/Credentials/CredentialInfo';
import CredentialJson from '../../components/Credentials/CredentialJson';
import HistoryList from '../../components/History/HistoryList';
import CredentialDeleteButton from '../../components/Credentials/CredentialDeleteButton';
import DeletePopup from '../../components/Popups/DeletePopup';
import Button from '../../components/Buttons/Button';
import CredentialLayout from '../../components/Credentials/CredentialLayout';

const Credential = () => {
	const { credentialIdentifier } = useParams();
	const { api } = useContext(SessionContext);
	const container = useContext(ContainerContext);
	const history = useFetchPresentations(api, credentialIdentifier, null);

	const [vcEntity, setVcEntity] = useState(null);
	const [showDeletePopup, setShowDeletePopup] = useState(false);
	const [loading, setLoading] = useState(false);
	const [credentialFiendlyName, setCredentialFriendlyName] = useState(null);
	const isMobileScreen = window.innerWidth < 480;
	const [activeTab, setActiveTab] = useState(0);
	const navigate = useNavigate();

	useEffect(() => {
		const getData = async () => {
			const response = await api.get('/storage/vc');
			const vcEntity = response.data.vc_list
				.filter((vcEntity) => vcEntity.credentialIdentifier === credentialIdentifier)[0];
			if (!vcEntity) {
				throw new Error("Credential not found");
			}
			setVcEntity(vcEntity);
		};

		getData();
	}, [api, credentialIdentifier]);

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

	const infoTabs = [
		{ label: 'Details', component: <CredentialJson credential={vcEntity?.credential} /> },
		{ label: 'History', component: <HistoryList history={history} /> },
	];

	return (
		<CredentialLayout>
			<>
				<div className="flex flex-col lg:flex-row w-full md:w-1/2 lg:mt-5 mt-0">

					{/* Block 2: Information List */}
					{vcEntity && <CredentialInfo credential={vcEntity.credential} />} {/* Use the CredentialInfo component */}
				</div>

				<div className="w-full mt-2 px-2">

					{!isMobileScreen ? (
						<>
							<CredentialTabs tabs={infoTabs} activeTab={activeTab} onTabChange={setActiveTab} />
							<div className='pt-2'>
								{infoTabs[activeTab].component}
							</div>
						</>
					) : (
						<>
							<Button
								variant="primary"
								onClick={() => navigate(`/credential/${credentialIdentifier}/history`)}
								additionalClassName='w-full my-2'
							>
								History
							</Button>
							<Button
								variant="primary"
								onClick={() => navigate(`/credential/${credentialIdentifier}/details`)}
								additionalClassName='w-full my-2'
							>
								Details
							</Button>
						</>
					)}
				</div>
				<div className='pl-2'>
					<CredentialDeleteButton onDelete={() => { setShowDeletePopup(true); }} />
				</div>

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
		</CredentialLayout>
	);
};

export default Credential;
