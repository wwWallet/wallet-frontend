// External libraries
import React, { useState, useContext, useEffect, useCallback, useMemo, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import QRCode from "react-qr-code";
import { useTranslation, Trans } from 'react-i18next';
import { BsQrCode, BsCheckCircle, BsThreeDots } from "react-icons/bs";
import { FaArrowLeft, FaArrowRight, FaExclamationTriangle, FaDatabase, FaQuestionCircle } from 'react-icons/fa';
import { IoSend } from 'react-icons/io5';
import i18n from '@/i18n';

// Contexts
import SessionContext from '@/context/SessionContext';
import CredentialsContext from '@/context/CredentialsContext';

// Lib
import { useMdocAppCommunication } from '@/lib/services/MdocAppCommunication';

// Hooks
import useFetchPresentations from '@/hooks/useFetchPresentations';
import useScreenType from '@/hooks/useScreenType';
import { useVcEntity } from '@/hooks/useVcEntity';
import { useCredentialName } from '@/hooks/useCredentialName';

// Components
import Button from '@/components/Buttons/Button';
import { H1, H2 } from '@/components/Shared/Heading';
import DeletePopup from '@/components/Popups/DeletePopup';
import PopupLayout from '@/components/Popups/PopupLayout';
import DatasetPopup from '@/components/Popups/DatasetPopup';
import HistoryList from '@/components/History/HistoryList';
import UsageStats from '@/components/Credentials/UsageStats';
import FullscreenPopup from '@/components/Popups/FullscreenImg';
import CredentialInfo from '@/components/Credentials/CredentialInfo';
import CredentialImage from '@/components/Credentials/CredentialImage';
import CredentialDeleteButton from '@/components/Credentials/CredentialDeleteButton';

const Credential = () => {
	const navigate = useNavigate();
	const { t } = useTranslation();
	const screenType = useScreenType();
	const { batchId } = useParams();
	const { api, keystore } = useContext(SessionContext);
	const history = useFetchPresentations(keystore, batchId, null);
	const { vcEntityList, fetchVcData } = useContext(CredentialsContext);
	const vcEntity = useVcEntity(fetchVcData, vcEntityList, batchId);
	const { generateEngagementQR, startClient, getMdocRequest, sendMdocResponse, terminateSession } = useMdocAppCommunication();

	// State
	const [loading, setLoading] = useState(false);
	const [mdocQRStatus, setMdocQRStatus] = useState(0); // 0 init; 1 loading; 2 finished;
	const [showMdocQR, setShowMdocQR] = useState(false);
	const [shareWithQr, setShareWithQr] = useState(false);
	const [mdocQRContent, setMdocQRContent] = useState("");
	const [showDeletePopup, setShowDeletePopup] = useState(false);
	const [showDatasetPopup, setShowDatasetPopup] = useState(false);
	const [shareWithQrFilter, setShareWithQrFilter] = useState([]);
	const [showFullscreenImgPopup, setShowFullscreenImgPopup] = useState(false);
	const [showActionsDropdown, setShowActionsDropdown] = useState(false);
	const [cachedUser, setCachedUser] = useState(null);

	//Refs
	const dropdownRef = useRef(null);

	// Variables
	const credentialName = useCredentialName(
		vcEntity?.parsedCredential?.metadata?.credential?.name,
		vcEntity?.batchId,
		[i18n.language]
	);

	const credentialFriendlyName = useMemo(() =>
		vcEntity ? credentialName : ""
	, [vcEntity, credentialName]);

	// Effects
	useEffect(() => {
		if (vcEntity === undefined) {
			navigate(`/${window.location.search}`, { replace: true });
		}
	}, [vcEntity, navigate]);

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
	};

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

	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (event) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
				setShowActionsDropdown(false);
			}
		};

		if (showActionsDropdown) {
			document.addEventListener('mousedown', handleClickOutside);
			return () => document.removeEventListener('mousedown', handleClickOutside);
		}
	}, [showActionsDropdown]);

	// Handlers
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
		navigate('/');
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

	if (!vcEntity) return null;

	return (
		<div className="px-6 sm:px-12 w-full">
			{/* Mobile Expired Warning */}
			{screenType === 'mobile' && vcEntity?.isExpired && (
				<div className="bg-orange-100 dark:bg-orange-900 p-3 shadow-lg rounded-lg mb-8 flex items-center">
					<div className="mr-3 text-orange-500">
						<FaExclamationTriangle className="text-lg" />
					</div>
					<p className="text-sm text-orange-800 dark:text-orange-200">
						{t('pageCredentials.details.expired')}
					</p>
				</div>
			)}

			{/* Desktop Header */}
			{screenType !== 'mobile' && (
				<div className="flex items-center justify-between mb-8">
					<div className="flex-1">
						<H1
							heading={<Link to="/">{t('common.navItemCredentials')}</Link>}
							flexJustifyContent="start"
							textColorClass="text-gray-500 hover:text-primary dark:text-primary-light dark:hover:text-primary-light hover:underline"
						>
							<FaArrowRight size={20} className="mx-2 text-2xl mb-2 text-primary dark:text-primary-light" />

							<H1 heading={credentialFriendlyName} hr={false} />
						</H1>
						<p className="mt-3 text-gray-700 dark:text-gray-300">
							{t('pageCredentials.details.description')}
						</p>
					</div>

					<div className="flex items-center gap-2">
						{shareWithQr && (
							<Button
								variant="primary"
								additionalClassName="mr-2"
								onClick={generateQR}
							>
								<BsQrCode className="mr-2" />
								{t('qrShareMdoc.shareUsingQR') || 'Share using QR Code'}
							</Button>
						)}

						<div className="relative ml-4" ref={dropdownRef}>
							<Button
								id="credential-actions"
								variant="cancel"
								additionalClassName="py-3 px-2"
								onClick={() => setShowActionsDropdown(!showActionsDropdown)}
								ariaLabel="Credential actions"
							>
								<BsThreeDots size={20} />
							</Button>

							{showActionsDropdown && (
								<div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50">
									<div className="py-2">
										<button
											onClick={() => {
												setShowDatasetPopup(true);
												setShowActionsDropdown(false);
											}}
											className="w-full flex items-center px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-150"
										>
											<FaDatabase size={16} className="mr-3" />
											<span>{t('pageCredentials.actions.viewDataset') || 'View Dataset'}</span>
										</button>
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
			)}

			{/* Mobile Header */}
			{screenType === 'mobile' && (
				<div className="flex items-center mb-6">
					<button
						id="go-previous"
						onClick={() => navigate(-1)}
						className="mr-4 p-2 -ml-2"
						aria-label="Go back to the previous page"
					>
						<FaArrowLeft size={20} className="text-primary dark:text-white" />
					</button>
					<h1 className="text-2xl font-semibold leading-tight tracking-tight text-gray-900 dark:text-white">
						{t('common.navItemCredentials')}
					</h1>
				</div>
			)}

			{/* Credential Information - Two Column Layout */}
			<div className="flex flex-col lg:flex-row items-start mt-0 lg:mt-6 gap-8">
				{/* Left Side: Credential Image */}
				<div className="w-full lg:w-1/2">
					{vcEntity && (
						<div className="flex flex-col gap-4">
							<button
								id="show-full-screen-credential"
								className="relative rounded-xl overflow-hidden transition-shadow shadow-md hover:shadow-lg cursor-pointer w-full"
								onClick={() => setShowFullscreenImgPopup(true)}
								aria-label={credentialFriendlyName}
								title={t('pageCredentials.credentialFullScreenTitle', { friendlyName: credentialFriendlyName })}
							>
								<CredentialImage
									vcEntity={vcEntity}
									className="w-full object-cover"
									showRibbon={screenType !== 'mobile'}
								/>
							</button>

							{screenType !== 'mobile' && (
								<UsageStats vcEntity={vcEntity} className="flex lg:hidden" />
							)}
						</div>
					)}

					{/* Mobile credential info and stats */}
					{screenType === 'mobile' && (
						<div className="flex-1 mt-4 lg:mt-0">
							<h2 className="text-xl font-bold text-primary dark:text-white mb-2">{credentialFriendlyName}</h2>
							<UsageStats vcEntity={vcEntity} className="flex lg:hidden" />
						</div>
					)}
				</div>

				{/* Right Side: Information List (Desktop only) */}
				{screenType !== 'mobile' && (
					<div className="w-full lg:w-1/2">
						{vcEntity && (
							<>
								<CredentialInfo parsedCredential={vcEntity.parsedCredential} />
								<div className="mt-6 mb-6 border-t border-gray-300 dark:border-gray-600 max-w-[200px] hidden lg:block" />
								<UsageStats vcEntity={vcEntity} className="hidden lg:flex" />
							</>
						)}
					</div>
				)}
			</div>

			{/* Mobile credential info */}
			{screenType === 'mobile' && vcEntity && (
				<div className="mt-6">
					<CredentialInfo parsedCredential={vcEntity.parsedCredential} />
				</div>
			)}

			{/* Full width divider */}
			<div className="w-full mt-11 border-t border-gray-300 dark:border-gray-600" />

			{/* Presentations Section */}
			{screenType !== 'mobile' && (
				<div className="mt-8 rounded-lg border border-gray-300 dark:border-gray-600">
					<div className="px-4 sm:px-6 py-4 flex flex-row items-center justify-between border-b border-gray-300 dark:border-gray-600">
						<div className="flex items-center">
							<H2 heading={t('pageCredentials.presentations')} />
						</div>

						<Button
							id="send-credential"
							variant="primary"
							disabled={!vcEntity}
							onClick={() => navigate("/send")}
							additionalClassName={history.length === 0 ? 'opacity-20 pointer-events-none' : ''}
						>
							<IoSend className="mr-2" />
							{t('pageCredentials.sendCredential')}
						</Button>
					</div>

					{history.length === 0 ? (
						<div className="px-4 sm:px-6 py-24 flex flex-col items-center text-center">
							<h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
								{t('pageCredentials.noPresentationsFound')}
							</h3>
							<p className="text-gray-700 dark:text-gray-300 max-w-lg mb-8">
								{t('pageCredentials.presentationsDescription')}
							</p>
							<Button
								variant="primary"
								onClick={() => navigate("/send")}
							>
								<IoSend className="mr-2" />
								{t('pageCredentials.sendCredential')}
							</Button>
						</div>
					) : (
						<div className="p-4 sm:p-6">
							<HistoryList batchId={batchId} />
						</div>
					)}
				</div>
			)}

			{/* Delete Credential Section */}
			{screenType !== 'mobile' && (
				<div className="mt-8 rounded-lg border border-gray-300 dark:border-gray-600">
					<div className="px-4 sm:px-6 py-4 flex flex-row items-center justify-between border-b border-gray-300 dark:border-gray-600">
						<H2 heading={t('pageCredentials.deleteCredential')} />
					</div>

					<div className="p-4 sm:p-6">
						<p className="mb-4 text-gray-700 dark:text-gray-300">
							{t('pageCredentials.deleteWarning')}
						</p>
						<CredentialDeleteButton onDelete={() => setShowDeletePopup(true)} />
					</div>
				</div>
			)}

			{/* Mobile Action Buttons */}
			{screenType === 'mobile' && (
				<div className="mt-8 mb-4 space-y-3">
					<Button
						id="navigate-credential-history"
						variant="primary"
						additionalClassName="w-full"
						onClick={() => navigate(`/credential/${batchId}/history`)}
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

					<CredentialDeleteButton onDelete={() => setShowDeletePopup(true)} additionalClassName="w-full" />

					{shareWithQr && (
						<Button
							variant="primary"
							additionalClassName="w-full"
							onClick={generateQR}
						>
							<BsQrCode className="mr-2" />
							{t('qrShareMdoc.shareUsingQR')}
						</Button>
					)}
				</div>
			)}

			{/* Mdoc QR Popup */}
			<PopupLayout fullScreen={true} isOpen={showMdocQR}>
				<div className="flex items-start justify-between mb-2">
					<h2 className="text-lg font-bold mb-2 text-primary dark:text-white">
						{t('qrShareMdoc.shareUsingQR')}
					</h2>
				</div>
				<hr className="mb-2 border-t border-primary/80 dark:border-white/80" />
				<span>
					{mdocQRStatus === -1 && (
						<span className="text-gray-700 italic dark:text-white text-sm mt-2 mb-4">
							{t('qrShareMdoc.enablePermissions')}
						</span>
					)}
					{mdocQRStatus === 0 && (
						<div className='flex items-center justify-center'>
							<QRCode value={mdocQRContent} />
						</div>
					)}
					{(mdocQRStatus === 1 || mdocQRStatus === 3) && (
						<span className="text-gray-700 italic dark:text-white text-sm mt-2 mb-4">
							{t('qrShareMdoc.communicating')}
						</span>
					)}
					{mdocQRStatus === 2 && (
						<span className='pb-16'>
							<p className="text-gray-700 dark:text-white text-sm mt-2 mb-4">
								{t('qrShareMdoc.nearbyVerifierRequested')}{' '}
								<strong>
									{shareWithQrFilter.map(key => key.split("_").map(word => `${word[0].toUpperCase()}${word.slice(1)}`).join(" ")).join(", ")}
								</strong>
							</p>
							<CredentialImage
								vcEntity={vcEntity}
								vcEntityInstances={vcEntity.instances}
								key={vcEntity.batchId}
								className="w-full object-cover rounded-xl"
							/>
							<div className={`flex flex-wrap justify-center flex flex-row justify-center items-center mb-2 pb-[20px] ${screenType === 'desktop' && 'overflow-y-auto items-center custom-scrollbar max-h-[20vh]'} ${screenType === 'tablet' && 'px-24'}`}>
								{vcEntity && (
									<CredentialInfo
										mainClassName="text-xs w-full"
										parsedCredential={vcEntity.parsedCredential}
										fallbackClaims={shareWithQrFilter.map(key => ({
											path: [key],
											display: [{
												lang: 'en',
												label: key.split("_").map(word => `${word[0].toUpperCase()}${word.slice(1)}`).join(" ")
											}]
										}))}
										showToggle={false}
									/>
								)}
							</div>
							<div className={`flex justify-between pt-4 z-10 ${screenType !== 'desktop' && 'fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 flex px-6 pb-6 flex shadow-2xl rounded-t-lg w-auto'}`}>
								<Button variant='cancel' onClick={() => setShowMdocQR(false)}>
									{t('common.cancel')}
								</Button>
								<Button variant='primary' onClick={consentToShare}>
									{t('qrShareMdoc.send')}
								</Button>
							</div>
						</span>
					)}
					{mdocQRStatus === 4 && (
						<span className='flex items-center justify-center mt-10'>
							<BsCheckCircle color='green' size={100} />
						</span>
					)}
					{![1, 2].includes(mdocQRStatus) && (
						<div className={`flex justify-end pt-4 z-10 ${screenType !== 'desktop' && 'fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 flex px-6 pb-6 flex shadow-2xl rounded-t-lg w-auto'}`}>
							<Button variant='primary' onClick={() => setShowMdocQR(false)}>
								{t('messagePopup.close')}
							</Button>
						</div>
					)}
				</span>
			</PopupLayout>

			{/* Fullscreen credential Popup */}
			{showFullscreenImgPopup && vcEntity && (
				<FullscreenPopup
					isOpen={showFullscreenImgPopup}
					onClose={() => setShowFullscreenImgPopup(false)}
					content={
						<CredentialImage
							vcEntity={vcEntity}
							className="max-w-full max-h-full rounded-xl"
							showRibbon={false}
						/>
					}
				/>
			)}

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

			{/* Dataset Popup */}
			{showDatasetPopup && vcEntity && (
				<DatasetPopup
					vcEntity={vcEntity}
					isOpen={showDatasetPopup}
					onClose={() => setShowDatasetPopup(false)}
				/>
			)}
		</div>
	);
};

export default Credential;
