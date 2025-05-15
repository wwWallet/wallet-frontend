// External libraries
import React, { useState, useContext, useEffect, useCallback, useMemo } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import QRCode from "react-qr-code";
import { useTranslation, Trans } from 'react-i18next';
import { BsQrCode, BsCheckCircle } from "react-icons/bs";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSend } from '@fortawesome/pro-regular-svg-icons';
import { faArrowRight, faCircleQuestion } from '@fortawesome/pro-solid-svg-icons';
import { faArrowLeft, faDatabase, faEllipsis, faExclamationTriangle, faLayerGroup, faQrcode } from '@fortawesome/pro-regular-svg-icons';

// Contexts
import SessionContext from '@/context/SessionContext';
import CredentialsContext from '@/context/CredentialsContext';

// Lib
import { useMdocAppCommunication } from '@/lib/services/MdocAppCommunication';

// Hooks
import useFetchPresentations from '@/hooks/useFetchPresentations';
import useScreenType from '@/hooks/useScreenType';
import { useVcEntity } from '@/hooks/useVcEntity';

// Components
import Button from '@/components/Buttons/Button';
import { H1 } from '@/components/Shared/Heading';
import Tooltip from '@/components/Shared/Tooltip';
import Dropdown from '@/components/Shared/Dropdown';
import DeletePopup from '@/components/Popups/DeletePopup';
import PopupLayout from '@/components/Popups/PopupLayout';
import HistoryList from '@/components/History/HistoryList';
import DatasetPopup from '@/components/Popups/DatasetPopup';
import UsageStats from '@/components/Credentials/UsageStats';
import FullscreenPopup from '@/components/Popups/FullscreenImg';
import PageDescription from '@/components/Shared/PageDescription';
import CredentialTabs from '@/components/Credentials/CredentialTabs';
import CredentialInfo from '@/components/Credentials/CredentialInfo';
import CredentialJson from '@/components/Credentials/CredentialJson';
import CredentialImage from '@/components/Credentials/CredentialImage';
import CredentialLayout from '@/components/Credentials/CredentialLayout';
import CredentialDropdown from '@/components/Credentials/CredentialDropdown';
import CredentialDeleteButton from '@/components/Credentials/CredentialDeleteButton';

const Credential = () => {
	//General
	const navigate = useNavigate();
	const { t } = useTranslation();
	const screenType = useScreenType();
	const { credentialId } = useParams();
	const { api } = useContext(SessionContext);
	const history = useFetchPresentations(api, credentialId, null);
	const { vcEntityList, fetchVcData } = useContext(CredentialsContext);
	const vcEntity = useVcEntity(fetchVcData, vcEntityList, credentialId);
	const { generateEngagementQR, startClient, getMdocRequest, sendMdocResponse } = useMdocAppCommunication();
	
	//State
	const [loading, setLoading] = useState(false);
	const [activeTab, setActiveTab] = useState(0);
	const [mdocQRStatus, setMdocQRStatus] = useState(0); // 0 init; 1 loading; 2 finished;
	const [showMdocQR, setShowMdocQR] = useState(false);
	const [shareWithQr, setShareWithQr] = useState(false);
	const [mdocQRContent, setMdocQRContent] = useState("");
	const [showDeletePopup, setShowDeletePopup] = useState(false);
	const [showDatasetPopup, setShowDatasetPopup] = useState(false);
	const [shareWithQrFilter, setShareWithQrFilter] = useState([]);
	const [showFullscreenImgPopup, setShowFullscreenImgPopup] = useState(false);

	//Variables
	const credentialFriendlyName = useMemo(() => 
		vcEntity ? vcEntity.parsedCredential.metadata.credential.name : ""
	, [vcEntity])

	//Effects
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

	//Handlers
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

	//Render
	return (
		<div className="sm:px-12 pt-10 pb-20 w-full max-w-[1064px] mx-auto">
			{/* Expired Credential Warning */}
			{screenType === 'mobile' && vcEntity?.isExpired && 
				<div className="bg-c-lm-red-bg-hover bg:text-c-dm-red-bg-hover p-2 px-3 shadow-lg rounded-lg mb-8 flex items-center">
					<div className="mr-3 text-c-lm-red dark:text-c-dm-red">
						<FontAwesomeIcon icon={faExclamationTriangle} className='text-md' />
					</div>

					<p className='text-sm text-c-lm-gray-900 dark:text-c-dm-gray-100'>
						{t('pageCredentials.details.expired')}
					</p>
				</div>
			}

			{/* Desktop Header */}
			{screenType !== 'mobile' &&
				<div className='flex items-center justify-between'>
					<div className='flex-1'>
						<h1 className="text-2xl md:text-3xl font-semibold leading-tight tracking-tight text-c-lm-gray-900 dark:text-c-dm-gray-100">
							<Link to="/" className='text-c-lm-gray-600 dark:text-c-dm-gray-400'>
								<Button
									variant="link"
									linkLineSize="large"
									linkClassName="text-c-lm-gray-600 dark:text-c-dm-gray-400"
								>
									{t('common.navItemCredentials')}
								</Button>
							</Link>

							<FontAwesomeIcon icon={faArrowRight} className="mx-2 mb-0.5 text-xl text-c-lm-gray-600 dark:text-c-dm-gray-400" />
							
							{credentialFriendlyName}
						</h1>

						<p className="mt-3 text-c-lm-gray-700 dark:text-c-dm-gray-300">
							{t('pageCredentials.details.description')}
						</p>
					</div>

					{shareWithQr && 
						<Button 
							variant='tertiary' 
							additionalClassName='mr-2' 
							onClick={generateQR}
							size='lg'
							textSize='md'
						>
							<div className='flex items-center justify-center h-6 mr-3'>
								<FontAwesomeIcon icon={faQrcode} className='text-md' />
							</div>

							{"Share using QR Code"}
						</Button>
					}

					<Dropdown
						options={[
							{ value: 0, icon: faDatabase, label: "View dataset", className: "font-medium" },
						]}
						selectedOption={0}
						onSelect={() => { setShowDatasetPopup(true); }}
						renderButton={(selectedOption, isOpen, setIsOpen) => 
							<Button
								id="credential-actions"
								variant="cancel"
								size='lg'
								textSize='md'
								square
								onClick={() => setIsOpen(!isOpen)}
							>
								<div className='flex items-center justify-center h-6 w-6'>
									<FontAwesomeIcon icon={faEllipsis} className="text-md" />
								</div>
							</Button>
						}
						className=""
						verticalPosition="bottom"
						horizontalPosition="right"
						listWidthClass="min-w-48"
					/>
				</div>
			}

			{/* Mobile Header */}
			{screenType === 'mobile' &&
				<div className='flex'>
					<button
						id="go-previous"
						onClick={() => navigate(-1)}
						className="mr-3 flex items-center justify-center"
						aria-label="Go back to the previous page"
					>
						<FontAwesomeIcon icon={faArrowLeft} size={20} className="text-xl text-primary dark:text-white" />
					</button>

					<h1 className="text-2xl font-semibold leading-tight tracking-tight text-c-lm-gray-900 dark:text-c-dm-gray-100">
						{t('common.navItemCredentials')}
					</h1>
				</div>
			}

			{/* Credential Information */}
			<div className="flex items-start mt-11">
				{/* Left Side: Credential Image */}
				<div className="flex-1">
					{vcEntity && 
						<div className='relative flex items-center justify-center flex-col gap-4 xm:w-4/12'>
							<button
								id="show-full-screen-credential"
								className="relative rounded-xl xm:rounded-lg w-full overflow-hidden transition-shadow shadow-md hover:shadow-lg cursor-pointer w-full"
								onClick={() => setShowFullscreenImgPopup(true)}
								aria-label={`${credentialFriendlyName}`}
								title={t('pageCredentials.credentialFullScreenTitle', { friendlyName: credentialFriendlyName })}
							>
								<CredentialImage 
									vcEntity={vcEntity} 
									parsedCredential={vcEntity.parsedCredential} 
									className={"w-full object-cover"} 
									showRibbon={screenType !== 'mobile'} 
								/>
							</button>
						</div>
					}
				</div>

				{/* Right Side: Information List */}
				<div className="flex-1 pl-12">
					{vcEntity && 
						<CredentialInfo parsedCredential={vcEntity.parsedCredential} />
					}

					<div className='mt-3 mb-5 border-t border-c-lm-gray-400 dark:border-c-dm-gray-600 max-w-[200px]' />

					<UsageStats 
						vcEntity={vcEntity}
					/>
				</div>

				{screenType === 'mobile' && 
					<div className="w-full pt-2 px-2">
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
					</div>
				}

			</div>
			
			<div className='w-full mt-11 border-t border-c-lm-gray-400 dark:border-c-dm-gray-600' />

			<div className="w-full mt-11 overflow-hidden rounded-lg border border-c-lm-gray-400 dark:border-c-dm-gray-600">
				<div className={`pl-6 py-4 pr-4 flex flex-row items-center justify-between border-b border-c-lm-gray-400 dark:border-c-dm-gray-600`}>
					<div className='flex-1 flex items-center'>
						<h2 className={`text-xl font-semibold text-c-lm-gray-900 dark:text-c-dm-gray-100`}>
							{"Presentations"}
						</h2>

						<div 
							className='ml-3'
							id={`add-credential-tip`}
						>
							<FontAwesomeIcon
								icon={faCircleQuestion} 
								className="text-c-lm-gray-700 dark:text-c-dm-gray-300 text-sm cursor-pointer hover:text-c-lm-gray-900 dark:hover:text-c-dm-gray-100 transition-all duration-150" 
							/>
						</div>

						<Tooltip
						offset={8} 
						text="This section shows the history of presentations for this credential. As you send this credential, more verifiers will start to appear here." 
						id={`add-credential-tip`} 
						place="bottom"
						/>
					</div>
		

					<Button
						size='md'
						textSize='md'
						variant='tertiary'
						disabled={history.length === 0}
						onClick={() => navigate("/send")}
					>
						<FontAwesomeIcon icon={faSend} className='mr-3' />
						
						{"Send credential"}
					</Button>
				</div>

				{history.length === 0 && 
					<div className="px-6 py-24 flex flex-col items-center">
						<h3 className="text-lg font-medium text-c-lm-gray-900 dark:text-c-dm-gray-100">
							{"You don't have any history for this credential."}
						</h3>
						
						<p className="text-c-lm-gray-700 dark:text-c-dm-gray-300 max-w-lg text-center mt-6">
							{"This credential has not been used yet. When you send this credential to a verifier, you will be able to see the history here."}
						</p>

						<Button
							additionalClassName='mt-8'
							size='lg'
							textSize='md'
							variant='tertiary'
							onClick={() => navigate("/send")}
						>
							<FontAwesomeIcon icon={faSend} className='mr-3' />
							
							{"Send credential"}
						</Button>
					</div>
				}
				
				{history.length > 0 && 
					<div className="">
						<HistoryList history={history} />
					</div>
				}
			</div>
			
			<div className="w-full mt-11 rounded-lg border border-c-lm-gray-400 dark:border-c-dm-gray-600">
				<div className="pl-6 py-4 pr-4 flex flex-row items-center justify-between border-b border-c-lm-gray-400 dark:border-c-dm-gray-600">
					<h2 className={`text-xl font-semibold text-c-lm-gray-900 dark:text-c-dm-gray-100`}>
						{"Delete credential"}
					</h2>

					<div className='h-10' />
				</div>

				<div className="p-6 flex flex-col items-start">
					<p className="text-c-lm-gray-700 dark:text-c-dm-gray-300">
						{t('pageSettings.deleteAccount.description')}
					</p>

					<CredentialDeleteButton 
					onDelete={() => { setShowDeletePopup(true); }} 
					/>
				</div>
			</div>

			{/* Mdoc QR Popup */}
			<PopupLayout 
				fullScreen={true} 
				isOpen={showMdocQR}
			>
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
							</span>
						}

						{mdocQRStatus === 0 && 
							<div className='flex items-center justify-center'>
								<QRCode value={mdocQRContent} />
							</div>
						}

						{(mdocQRStatus === 1 || mdocQRStatus === 3) && 
							<span>Communicating with verifier...</span>
						}

						{mdocQRStatus === 2 && 
							<span className='pb-16'>
								<p className="text-gray-700 dark:text-white text-sm mt-2 mb-4">
									A nearby verifier requested the following fields:
								</p>

								<CredentialImage
									vcEntity={vcEntity}
									vcEntityInstances={vcEntity.instances}
									key={vcEntity.credentialIdentifier}
									parsedCredential={vcEntity.parsedCredential}
									className="w-full object-cover rounded-xl"
									supportHover={false}
								/>

								<div className={`flex flex-wrap justify-center flex flex-row justify-center items-center mb-2 pb-[20px] ${screenType === 'desktop' && 'overflow-y-auto items-center custom-scrollbar max-h-[20vh]'} ${screenType === 'tablet' && 'px-24'}`}>
									{vcEntity && 
										<CredentialInfo 
											mainClassName={"text-xs w-full"} 
											parsedCredential={vcEntity.parsedCredential} 
											fallbackClaims={shareWithQrFilter.map(key => ({ 
												path: [key], 
												display: [{ 
													lang: 'en', 
													label: key.split("_").map(word => `${word[0].toUpperCase()}${word.slice(1)}`).join(" ") 
												}] 
											}))}
										/>
									}
								</div>

								<div className={`flex justify-between pt-4 z-10 ${screenType !== 'desktop' && 'fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 flex px-6 pb-6 flex shadow-2xl rounded-t-lg w-auto'}`}>
									<Button 
										variant='cancel' 
										onClick={consentToShare}
									>
										Cancel
									</Button>

									<Button 
										variant='primary' 
										onClick={consentToShare}
									>
										Send
									</Button>
								</div>
							</span>
						}

						{mdocQRStatus === 4 && 
							<span className='flex items-center justify-center mt-10'>
								<BsCheckCircle color='green' size={100} />
							</span>
						}

						{![1,2].includes(mdocQRStatus) &&
							<div className={`flex justify-end pt-4 z-10 ${screenType !== 'desktop' && 'fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 flex px-6 pb-6 flex shadow-2xl rounded-t-lg w-auto'}`}>
								<Button 
									variant='primary' 
									onClick={() => setShowMdocQR(false)}
								>
									Close
								</Button>
							</div>
						}
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
							className={"max-w-full max-h-full rounded-xl"} 
							showRibbon={false} 
							supportHover={false}
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
					title={t('pageSettings.title.confirmDeleteCredentialPopup')}
					message={
						<Trans
							i18nKey="pageCredentials.deletePopupMessage"
							values={{ credentialName: vcEntity.parsedCredential.metadata.credential.name }}
							components={{ strong: <strong /> }}
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
