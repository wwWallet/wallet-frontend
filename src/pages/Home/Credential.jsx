// External libraries
import React, { useState, useContext, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
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
import ProximitySharingPopup, { PROXIMITY_SHARING_STATUS } from '../../components/Popups/ProximitySharingPopup';
import CredentialTabsPanel from '@/components/Credentials/CredentialTabsPanel';
import { H2 } from '@/components/Shared/Heading';

import { useMdocAppCommunication } from '@/lib/services/MdocAppCommunication';
import { isBluetoothTransportAvailable, bluetoothConnectRequiresUserGesture } from '@/lib/services/bluetooth';
import { QrCode } from 'lucide-react';
import { DEV_MODE } from '@/config';

const Credential = () => {
	const { batchId } = useParams();
	const { api, keystore } = useContext(SessionContext);
	const history = useFetchPresentations(keystore, batchId, null);
	const [showDeletePopup, setShowDeletePopup] = useState(false);
	const [loading, setLoading] = useState(false);
	const screenType = useScreenType();
	const { generateEngagementQR, startClient, getMdocRequest, sendMdocResponse, terminateSession } = useMdocAppCommunication();
	const [showMdocQR, setShowMdocQR] = useState(false);
	const [mdocQRStatus, setMdocQRStatus] = useState(PROXIMITY_SHARING_STATUS.SCAN);
	const handledMdocStatusRef = useRef(null);
	const [shareWithQr, setShareWithQr] = useState(false);
	const [mdocQRContent, setMdocQRContent] = useState("");
	const [shareWithQrFilter, setShareWithQrFilter] = useState([]);
	const [mdocTypeDetails, setMdocTypeDetails] = useState(null);
	const [bluetoothPairingCancelled, setBluetoothPairingCancelled] = useState(false);
	const navigate = useNavigate();
	const { t } = useTranslation();

	const { vcEntityList, fetchVcData } = useContext(CredentialsContext);
	const vcEntity = useVcEntity(fetchVcData, vcEntityList, batchId);

	useEffect(() => {
		if (vcEntity === undefined) {
			navigate(`/${window.location.search}`, { replace: true });
		}
	}, [vcEntity, navigate]);

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

	const connectClient = async () => {
		setBluetoothPairingCancelled(false);
		setMdocQRStatus(PROXIMITY_SHARING_STATUS.PAIRING);
		const connectionResult = await startClient();
		if (connectionResult === "cancelled") {
			setMdocQRStatus(PROXIMITY_SHARING_STATUS.SCAN);
			setBluetoothPairingCancelled(true);
		} else if (connectionResult === "failed") {
			setMdocQRStatus(PROXIMITY_SHARING_STATUS.CONNECTION_FAILED);
		} else {
			setMdocQRStatus(PROXIMITY_SHARING_STATUS.WAITING_FOR_REQUEST);
		}
	};

	const generateQR = async () => {
		setMdocQRStatus(PROXIMITY_SHARING_STATUS.SCAN);
		setBluetoothPairingCancelled(false);
		setMdocTypeDetails(null);
		setMdocQRContent(await generateEngagementQR(vcEntity));
		setShowMdocQR(true);
		if (bluetoothConnectRequiresUserGesture()) {
			// Web Bluetooth: connecting opens the browser's device-chooser dialog,
			// which would cover the QR before the verifier has scanned it (and no
			// device advertises the engagement UUID until then). Wait for the user
			// to confirm the scan before connecting.
			return;
		}
		await connectClient();
	};

	const handleMdocRequest = useCallback(async () => {
		const { fields, credentialMatchesRequest, requestedDocType, credentialDocType } = await getMdocRequest();
		setShareWithQrFilter(fields);
		setMdocTypeDetails({ requestedDocType, credentialDocType });
		setMdocQRStatus(credentialMatchesRequest ? PROXIMITY_SHARING_STATUS.REVIEW : PROXIMITY_SHARING_STATUS.CREDENTIAL_MISMATCH);
	}, [getMdocRequest]);

	const handleMdocResponse = useCallback(async () => {
		try {
			await sendMdocResponse();
			setMdocQRStatus(PROXIMITY_SHARING_STATUS.SUCCESS);
		} catch (error) {
			console.error("Failed to send mdoc response", error);
			setMdocQRStatus(PROXIMITY_SHARING_STATUS.SHARING_FAILED);
		}
	}, [sendMdocResponse]);

	const consentToShare = () => {
		setMdocQRStatus(PROXIMITY_SHARING_STATUS.SHARING);
	}

	const cancelShare = () => {
		setMdocQRStatus(PROXIMITY_SHARING_STATUS.SCAN);
		setShowMdocQR(false);
		terminateSession();
	}

	useEffect(() => {
		if (handledMdocStatusRef.current === mdocQRStatus) {
			// prevent refiring without an actual status change
			return;
		}
		handledMdocStatusRef.current = mdocQRStatus;
		if (mdocQRStatus === PROXIMITY_SHARING_STATUS.WAITING_FOR_REQUEST) {
			// Got client
			handleMdocRequest();
		} else if (mdocQRStatus === PROXIMITY_SHARING_STATUS.SHARING) {
			// Got consent
			handleMdocResponse();
		}
	}, [mdocQRStatus, handleMdocRequest, handleMdocResponse]);

	useEffect(() => {
		async function shareEligible(vcEntity) {
			if (!isBluetoothTransportAvailable()) {
				setShareWithQr(false);
				return;
			}
			if (vcEntity.format === "mso_mdoc") {
				setShareWithQr(true);
			} else {
				setShareWithQr(false);
			}
		}

		if (vcEntity) {
			shareEligible(vcEntity);
		}
	}, [vcEntity]);

	const presentationsContent = (
		<>
			{history !== null && (history.length === 0 ? (
				<p className="text-lm-gray-900 dark:text-white">
					{t('pageHistory.noFound')}
				</p>
			) : (
				<div className="max-h-[45vh] overflow-y-auto custom-scrollbar pr-2">
					<HistoryList batchId={batchId} history={history} />
				</div>
			))}
		</>
	);

	const infoTabs = DEV_MODE ? [
		{
			label: t('pageCredentials.presentationsTitle'),
			component: presentationsContent
		},
		{
			label: t('pageCredentials.datasetTitle'),
			component:
				<CredentialJson
					parsedCredential={vcEntity?.parsedCredential}
				/>
		}
	] : [];

	return (

		<CredentialLayout title={credentialName} fixedRatioImage={false} displayCredentialInfo={vcEntity && <CredentialInfo parsedCredential={vcEntity.parsedCredential} />}>
			<>
				<div className="w-full pt-2">
					{DEV_MODE ? (
						screenType !== 'mobile' ? (
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
						)
					) : (
						<>
							<H2 heading={t('pageCredentials.presentationsTitle')} />
							{presentationsContent}
						</>
					)}
				</div>
				<div className='px-2 w-full'>
					{shareWithQr && (<Button variant='primary' additionalClassName='xm:w-full' onClick={generateQR}>{<span className='px-1'><QrCode /></span>}{t('qrShareMdoc.shareUsingQR')}</Button>)}
					<ProximitySharingPopup
						isOpen={showMdocQR}
						fullScreen={screenType !== 'desktop'}
						status={mdocQRStatus}
						qrContent={mdocQRContent}
						credential={vcEntity}
						requestedFields={shareWithQrFilter}
						mdocTypeDetails={mdocTypeDetails}
						bluetoothPairingCancelled={bluetoothPairingCancelled}
						requiresUserGesture={bluetoothConnectRequiresUserGesture()}
						onConnect={connectClient}
						onConsent={consentToShare}
						onCancel={cancelShare}
						onClose={() => setShowMdocQR(false)}
					/>
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
