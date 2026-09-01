// External libraries
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Braces, History, List, QrCode } from 'lucide-react';
import { Trans, useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';

// Config
import { DEV_MODE } from '@/config';
import i18n from '@/i18n';

// Contexts
import CredentialsContext from '@/context/CredentialsContext';
import SessionContext from '@/context/SessionContext';
import StatusContext from '@/context/StatusContext';

// Hooks
import { useCredentialName } from '@/hooks/useCredentialName';
import useFetchPresentations from '@/hooks/useFetchPresentations';
import { useMdocAppCommunication } from '@/lib/services/MdocAppCommunication';
import useScreenType from '@/hooks/useScreenType';
import { useVcEntity } from '@/hooks/useVcEntity';

// Services
import { bluetoothConnectRequiresUserGesture, isBluetoothTransportAvailable } from '@/lib/services/bluetooth';

// Components
import ActivityEmptyState from '@/components/History/ActivityEmptyState';
import Button from '@/components/Buttons/Button';
import CredentialActionsMenu from '@/components/Credentials/CredentialActionsMenu';
import CredentialDeleteButton from '@/components/Credentials/CredentialDeleteButton';
import CredentialInfo from '@/components/Credentials/CredentialInfo';
import CredentialJson from '@/components/Credentials/CredentialJson';
import CredentialLayout from '@/components/Credentials/CredentialLayout';
import CredentialShareMenu from '@/components/Credentials/CredentialShareMenu';
import CredentialTabsPanel from '@/components/Credentials/CredentialTabsPanel';
import DeletePopup from '@/components/Popups/DeletePopup';
import HistoryList from '@/components/History/HistoryList';
import ProximitySharingPopup, { PROXIMITY_SHARING_STATUS } from '@/components/Popups/ProximitySharingPopup';

const Credential = () => {
	const { batchId } = useParams();
	const { api, keystore } = useContext(SessionContext);
	const { isOnline } = useContext(StatusContext);
	const history = useFetchPresentations(keystore, batchId, null);
	const [showDeletePopup, setShowDeletePopup] = useState(false);
	const [loading, setLoading] = useState(false);
	const screenType = useScreenType();
	const isDesktop = screenType === 'desktop';
	const { generateEngagementQR, startClient, getMdocRequest, sendMdocResponse, terminateSession } = useMdocAppCommunication();
	const [showMdocQR, setShowMdocQR] = useState(false);
	const [mdocQRStatus, setMdocQRStatus] = useState(PROXIMITY_SHARING_STATUS.SCAN);
	const handledMdocStatusRef = useRef(null);
	const shareSessionRef = useRef(0); // bumped on new shares, used to invalidate abandoned connections
	const [shareWithQr, setShareWithQr] = useState(false);
	const [verifiers, setVerifiers] = useState(null);
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
		const fetchVerifiers = async () => {
			try {
				const fetchedVerifiers = await api.getAllVerifiers();
				setVerifiers(Array.isArray(fetchedVerifiers) ? fetchedVerifiers : []);
			} catch (error) {
				console.error('Error fetching verifiers:', error);
				setVerifiers([]);
			}
		};
		fetchVerifiers();
	}, [api]);


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

	const redirectToVerifier = (verifier) => {
		window.location.href = verifier.url;
	};

	const shareMenu = (fullWidth = false) => {
		if (verifiers === null) {
			return null;
		}

		if (verifiers.length === 0) {
			if (!shareWithQr) {
				return null;
			}

			return (
				<Button
					id="share-credential-qr"
					variant="primary"
					size={!isDesktop ? 'md' : 'sm'}
					additionalClassName={fullWidth ? 'w-full' : ''}
					onClick={generateQR}
				>
					<QrCode size={20} aria-hidden="true" />
					{t('qrShareMdoc.shareUsingQR')}
				</Button>
			);
		}

		return (
			<CredentialShareMenu
				canShareWithQr={shareWithQr}
				isOnline={isOnline}
				verifiers={verifiers}
				onShareWithQr={generateQR}
				onSelectVerifier={redirectToVerifier}
				align={isDesktop ? 'right' : 'left'}
				fullWidth={fullWidth}
				largeButton={!isDesktop}
				useBottomSheet={!isDesktop}
			/>
		);
	};

	const connectClient = async () => {
		setBluetoothPairingCancelled(false);
		setMdocQRStatus(PROXIMITY_SHARING_STATUS.SELECTING_DEVICE);
		const session = shareSessionRef.current;
		const connectionResult = await startClient(() => {
			if (shareSessionRef.current === session) {
				setMdocQRStatus(PROXIMITY_SHARING_STATUS.PAIRING);
			}
		});
		if (shareSessionRef.current !== session) {
			// The user cancelled (or restarted) the share while connecting
			return;
		}
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
		shareSessionRef.current += 1;
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
		shareSessionRef.current += 1;
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

	const activityContent = (
		<>
			{history !== null && (history.length === 0 ? (
				<ActivityEmptyState credentialSpecific />
			) : (
				<div className="max-h-[45vh] overflow-y-auto custom-scrollbar pr-2">
					<HistoryList batchId={batchId} history={history} />
				</div>
			))}
		</>
	);

	const infoTabs = [
		{
			label: t('pageCredentials.detailsTitle'),
			icon: <List size={18} aria-hidden="true" />,
			component: <CredentialInfo parsedCredential={vcEntity?.parsedCredential} />
		},
		{
			label: t('pageCredentials.activityTitle'),
			icon: <History size={18} aria-hidden="true" />,
			component: activityContent
		},
		...(DEV_MODE && isDesktop ? [{
			label: t('pageCredentials.datasetTitle'),
			icon: <Braces size={18} aria-hidden="true" />,
			component: <CredentialJson parsedCredential={vcEntity?.parsedCredential} />
		}] : []),
	];

	return (
		<CredentialLayout
			title={credentialName}
			summaryActions={!isDesktop ? (
				<div className='flex flex-wrap gap-2 xm:w-full'>
					{shareMenu(screenType === 'mobile')}
					<Button
						id="navigate-credential-history"
						variant='outline'
						additionalClassName='xm:w-full'
						onClick={() => navigate(`/credential/${batchId}/history`)}
					>
						<History size={20} aria-hidden="true" />
						{t('pageCredentials.activityTitle')}
					</Button>
					{DEV_MODE && (
						<Button
							id="navigate-credential-dataset"
							variant='outline'
							additionalClassName='xm:w-full'
							onClick={() => navigate(`/credential/${batchId}/details`)}
						>
							<Braces size={20} aria-hidden="true" />
							{t('pageCredentials.datasetTitle')}
						</Button>
					)}
				</div>
			) : null}
			actionsMenu={
				<div className='flex items-center gap-1'>
					{isDesktop && shareMenu()}
					<CredentialActionsMenu>
						<CredentialDeleteButton onDelete={() => setShowDeletePopup(true)} />
					</CredentialActionsMenu>
				</div>
			}
		>
			<div className='mt-2'>
				{!isDesktop ? (
					<CredentialInfo parsedCredential={vcEntity?.parsedCredential} />
				) : (
					<CredentialTabsPanel tabs={infoTabs} />
				)}
			</div>

			<ProximitySharingPopup
				isOpen={showMdocQR}
				fullScreen={!isDesktop}
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
		</CredentialLayout>
	);
};

export default Credential;
