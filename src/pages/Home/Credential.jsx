// External libraries
import React, { useState, useContext, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import { BsQrCode, BsCheckCircle } from "react-icons/bs";
import QRCode from "react-qr-code";
import i18n from '@/i18n';

// Contexts
import SessionContext from '@/context/SessionContext';
import CredentialsContext from '@/context/CredentialsContext';
import { useCredentialName } from '@/hooks/useCredentialName';

// Hooks
import useFetchPresentations from '../../hooks/useFetchPresentations';
import useScreenType from '../../hooks/useScreenType';
import { useVcEntity } from '../../hooks/useVcEntity';

// Components
import CredentialInfo from '../../components/Credentials/CredentialInfo';
import CredentialJson from '../../components/Credentials/CredentialJson';
import HistoryList from '../../components/History/HistoryList';
import CredentialDeleteButton from '../../components/Credentials/CredentialDeleteButton';
import DeletePopup from '../../components/Popups/DeletePopup';
import Button from '../../components/Buttons/Button';
import CredentialLayout from '../../components/Credentials/CredentialLayout';
import PopupLayout from '../../components/Popups/PopupLayout';
import CredentialImage from '../../components/Credentials/CredentialImage';
import CredentialTabsPanel from '@/components/Credentials/CredentialTabsPanel';

import { useMdocAppCommunication } from '@/lib/services/MdocAppCommunication';

const Credential = () => {
	const { batchId } = useParams();
	const { api, keystore } = useContext(SessionContext);
	const history = useFetchPresentations(keystore, batchId, null);
	const [showDeletePopup, setShowDeletePopup] = useState(false);
	const [loading, setLoading] = useState(false);
	const screenType = useScreenType();
	const { generateEngagementQR, startClient, getMdocRequest, sendMdocResponse, terminateSession } = useMdocAppCommunication();
	const [showMdocQR, setShowMdocQR] = useState(false);
	const [mdocQRStatus, setMdocQRStatus] = useState(0); // 0 init; 1 loading; 2 finished;
	const [shareWithQr, setShareWithQr] = useState(false);
	const [mdocQRContent, setMdocQRContent] = useState("");
	const [shareWithQrFilter, setShareWithQrFilter] = useState([]);
	const navigate = useNavigate();
	const { t } = useTranslation();

	const { vcEntityList, fetchVcData } = useContext(CredentialsContext);
	const vcEntity = useVcEntity(fetchVcData, vcEntityList, batchId);

	useEffect(() => {
		if (vcEntity === undefined) {
			navigate(`/${window.location.search}`, { replace: true });
		}
	}, [vcEntity]);

	const credentialName = useCredentialName(
		vcEntity?.parsedCredential?.metadata?.credential?.name,
		vcEntity?.batchId,
		[i18n.language]
	);

	const [cachedUser, setCachedUser] = useState(null);


	useEffect(() => {
		const userHandle = keystore.getUserHandleB64u();
		if (!userHandle) {
			return;
		}
		const u = keystore.getCachedUsers().filter((user) => user.userHandleB64u === userHandle)[0];
		if (u) {
			setCachedUser(u);
		}
	}, [keystore, setCachedUser]);

	const handleSureDelete = async () => {
		setLoading(true);
		if (!cachedUser) {
			return;
		}
		const result = await api.syncPrivateData(cachedUser);
		if (!result.ok) {
			setLoading(false);
			return;
		}
		const [, newPrivateData, keystoreCommit] = await keystore.deleteCredentialsByBatchId(parseInt(batchId));
		await api.updatePrivateData(newPrivateData);
		await keystoreCommit();

		setLoading(false);
		setShowDeletePopup(false);
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
		terminateSession();
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
		{
			label: t('pageCredentials.presentationsTitle'),
			component:
				<>
					{history.length === 0 ? (
						<p className="text-gray-700 dark:text-white">
							{t('pageHistory.noFound')}
						</p>
					) : (
						<HistoryList batchId={batchId} history={history} />
					)}
				</>
		},
		{
			label: t('pageCredentials.datasetTitle'),
			component:
				<CredentialJson
					parsedCredential={vcEntity?.parsedCredential}
				/>
		}
	];

	return (

		<CredentialLayout title={t('pageCredentials.credentialTitle')} displayCredentialInfo={vcEntity && <CredentialInfo parsedCredential={vcEntity.parsedCredential} />}>
			<>
				<div className="w-full pt-2 px-2">
					{screenType !== 'mobile' ? (
						<CredentialTabsPanel tabs={infoTabs} />
					) : (
						<>
							<Button
								id="navigate-credential-history"
								variant="primary"
								onClick={() => navigate(`/credential/${batchId}/history`)}
								additionalClassName='w-full my-2'
							>
								{t('pageCredentials.presentationsTitle')}
							</Button>
							<Button
								id="navigate-credential-details"
								variant="primary"
								onClick={() => navigate(`/credential/${batchId}/details`)}
								additionalClassName='w-full my-2'
							>
								{t('pageCredentials.datasetTitle')}
							</Button>
						</>
					)}
				</div>
				<div className='px-2 w-full'>
					{shareWithQr && (<Button variant='primary' additionalClassName='w-full my-2' onClick={generateQR}>{<span className='px-1'><BsQrCode /></span>}{t('qrShareMdoc.shareUsingQR')}</Button>)}
					<PopupLayout fullScreen={true} isOpen={showMdocQR}>
						<div className="flex items-start justify-between mb-2">
							<h2 className="text-lg font-bold mb-2 text-primary dark:text-white">
								{t('qrShareMdoc.shareUsingQR')}
							</h2>
						</div>
						<hr className="mb-2 border-t border-primary/80 dark:border-white/80" />
						<span>
							{mdocQRStatus === -1 && <span className="text-gray-700 italic dark:text-white text-sm mt-2 mb-4">{t('qrShareMdoc.enablePermissions')}</span>}
							{mdocQRStatus === 0 && <div className='flex items-center justify-center'><QRCode value={mdocQRContent} /></div>}
							{(mdocQRStatus === 1 || mdocQRStatus === 3) && <span className="text-gray-700 italic dark:text-white text-sm mt-2 mb-4">{t('qrShareMdoc.communicating')}</span>}
							{mdocQRStatus === 2 && <span className='pb-16'>
								<p className="text-gray-700 dark:text-white text-sm mt-2 mb-4">
									{t('qrShareMdoc.nearbyVerifierRequested')}{' '}
									<strong>
										{
											shareWithQrFilter.map(key => key.split("_").map(word => `${word[0].toUpperCase()}${word.slice(1)}`).join(" ")).join(", ")
										}
									</strong>
								</p>
								<CredentialImage
									vcEntity={vcEntity}
									vcEntityInstances={vcEntity.instances}
									key={vcEntity.batchId}
									parsedCredential={vcEntity.parsedCredential}
									className="w-full object-cover rounded-xl"
								/>
								<div className={`flex flex-wrap justify-center flex flex-row justify-center items-center mb-2 pb-[20px] ${screenType === 'desktop' && 'overflow-y-auto items-center custom-scrollbar max-h-[20vh]'} ${screenType === 'tablet' && 'px-24'}`}>
									{vcEntity && <CredentialInfo mainClassName={"text-xs w-full"} parsedCredential={vcEntity.parsedCredential} />}
								</div>
								<div className={`flex justify-between pt-4 z-10 ${screenType !== 'desktop' && 'fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 flex px-6 pb-6 flex shadow-2xl rounded-t-lg w-auto'}`}>
									<Button variant='cancel' onClick={cancelShare}>{t('common.cancel')}</Button>
									<Button variant='primary' onClick={consentToShare}>{t('qrShareMdoc.send')}</Button>
								</div>
							</span>}
							{mdocQRStatus === 4 && <span className='flex items-center justify-center mt-10'><BsCheckCircle color='green' size={100} /></span>}
							{![1, 2].includes(mdocQRStatus) &&
								<div className={`flex justify-end pt-4 z-10 ${screenType !== 'desktop' && 'fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 flex px-6 pb-6 flex shadow-2xl rounded-t-lg w-auto'}`}>
									<Button variant='primary' onClick={() => setShowMdocQR(false)}>{t('messagePopup.close')}</Button>
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
								values={{ credentialName }}
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
