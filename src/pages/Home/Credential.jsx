// External libraries
import React, { useState, useContext, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import { BsQrCode, BsCheckCircle } from "react-icons/bs";
import QRCode from "react-qr-code";

// Contexts
import SessionContext from '@/context/SessionContext';
import CredentialsContext from '@/context/CredentialsContext';

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
import PopupLayout from '../../components/Popups/PopupLayout';
import CredentialImage from '../../components/Credentials/CredentialImage';


import { useMdocAppCommunication } from '@/lib/services/MdocAppCommunication';


const Credential = () => {
	const { credentialId } = useParams();
	const { api } = useContext(SessionContext);
	const history = useFetchPresentations(api, credentialId, null);
	const [showDeletePopup, setShowDeletePopup] = useState(false);
	const [loading, setLoading] = useState(false);
	const screenType = useScreenType();
	const [activeTab, setActiveTab] = useState(0);
	const { generateEngagementQR, startClient, getMdocRequest, sendMdocResponse } = useMdocAppCommunication();
	const [showMdocQR, setShowMdocQR] = useState(false);
	const [mdocQRStatus, setMdocQRStatus] = useState(0); // 0 init; 1 loading; 2 finished;
	const [shareWithQr, setShareWithQr] = useState(false);
	const [mdocQRContent, setMdocQRContent] = useState("");
	const [shareWithQrFilter, setShareWithQrFilter] = useState([]);
	const navigate = useNavigate();
	const { t } = useTranslation();

	const { vcEntityList, fetchVcData } = useContext(CredentialsContext);
	const vcEntity = useVcEntity(fetchVcData, vcEntityList, credentialId);

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

	const generateQR = async () => {
		setMdocQRStatus(0);
		setMdocQRContent(await generateEngagementQR(vcEntity));
		setShowMdocQR(true);
		const client = await startClient();
		if (!client) {
			setMdocQRStatus(-1);
		} else {
			setMdocQRStatus(1);
		}
	};

	const handleMdocRequest = useCallback(async () => {
		const fields = await getMdocRequest();
		setShareWithQrFilter(fields);
		setMdocQRStatus(2);
	}, [getMdocRequest]);

	const handleMdocResponse = useCallback(async () => {
		await sendMdocResponse();
		setMdocQRStatus(4);
	}, [sendMdocResponse]);

	const consentToShare = () => {
		setMdocQRStatus(3);
	}

	const cancelShare = () => {
		setMdocQRStatus(0);
		setShowMdocQR(false);
	}

	useEffect(() => {
		if (mdocQRStatus === 1) {
			// Got client
			handleMdocRequest();
		} else if (mdocQRStatus === 3) {
			// Got consent
			handleMdocResponse();
		}
	}, [mdocQRStatus, handleMdocRequest, handleMdocResponse]);

	useEffect(() => {
		async function shareEligible(vcEntity) {
			if (!window.nativeWrapper) {
				setShareWithQr(false);
				return;
			}
			if (vcEntity.format == "mso_mdoc") {
				setShareWithQr(true);
			} else {
				setShareWithQr(false);
			}
		}

		if (vcEntity) {
			shareEligible(vcEntity);
		}
	}, [vcEntity]);

	const infoTabs = [
		{ label: t('pageCredentials.datasetTitle'), component: <CredentialJson parsedCredential={vcEntity?.parsedCredential} /> },
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
					{vcEntity && <CredentialInfo parsedCredential={vcEntity.parsedCredential} />} {/* Use the CredentialInfo component */}
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
								id="navigate-credential-history"
								variant="primary"
								onClick={() => navigate(`/credential/${credentialId}/history`)}
								additionalClassName='w-full my-2'
							>
								{t('pageCredentials.presentationsTitle')}
							</Button>
							<Button
								id="navigate-credential-details"
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
				{shareWithQr && (<Button variant='primary' additionalClassName='w-full my-2' onClick={generateQR}>{<span className='px-1'><BsQrCode/></span>}Share using QR Code</Button>)}
					<PopupLayout fullScreen={true} isOpen={showMdocQR}>
					<div className="flex items-start justify-between mb-2">
						<h2 className="text-lg font-bold text-primary">
							Share using QRCode
						</h2>
						</div>
						<hr className="mb-2 border-t border-primary/80" />
						<span>
								{mdocQRStatus === -1 &&
									<span>
										We couldn't access nearby device features. Please enable nearby devices permissions in your settings and restart the app to "Share with QRCode".
									</span>}
								{mdocQRStatus === 0 && <div className='flex items-center justify-center'><QRCode value={mdocQRContent} /></div>}
								{(mdocQRStatus === 1 || mdocQRStatus === 3) && <span>Communicating with verifier...</span>}
								{mdocQRStatus === 2 && <span className='pb-16'>
									<p className="text-gray-700 dark:text-white text-sm mt-2 mb-4">
										A nearby verifier requested the following fields:{' '}
										<strong>
											{
												shareWithQrFilter.map(key => key.split("_").map(word => `${word[0].toUpperCase()}${word.slice(1)}`).join(" ")).join(", ")
											}
										</strong>
									</p>
									<CredentialImage
										vcEntity={vcEntity}
										vcEntityInstances={vcEntity.instances}
										key={vcEntity.credentialIdentifier}
										parsedCredential={vcEntity.parsedCredential}
										className="w-full object-cover rounded-xl"
									/>
									<div className={`flex flex-wrap justify-center flex flex-row justify-center items-center mb-2 pb-[20px] ${screenType === 'desktop' && 'overflow-y-auto items-center custom-scrollbar max-h-[20vh]'} ${screenType === 'tablet' && 'px-24'}`}>
										{vcEntity && <CredentialInfo mainClassName={"text-xs w-full"} parsedCredential={vcEntity.parsedCredential}/>}
									</div>
									<div className={`flex justify-between pt-4 z-10 ${screenType !== 'desktop' && 'fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 flex px-6 pb-6 flex shadow-2xl rounded-t-lg w-auto'}`}>
										<Button variant='cancel' onClick={cancelShare}>Cancel</Button>
										<Button variant='primary' onClick={consentToShare}>Send</Button>
									</div>
									</span>}
								{mdocQRStatus === 4 && <span className='flex items-center justify-center mt-10'><BsCheckCircle color='green' size={100}/></span>}
								{![1,2].includes(mdocQRStatus) &&
									<div className={`flex justify-end pt-4 z-10 ${screenType !== 'desktop' && 'fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 flex px-6 pb-6 flex shadow-2xl rounded-t-lg w-auto'}`}>
										<Button variant='primary' onClick={() => setShowMdocQR(false)}>Close</Button>
								</div>}
						</span>
					</PopupLayout>
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
								values={{ credentialName: vcEntity.parsedCredential.metadata.credential.name }}
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
