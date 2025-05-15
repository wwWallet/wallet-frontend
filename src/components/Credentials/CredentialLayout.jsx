// External libraries
import React, { useState, useEffect, useContext, useMemo } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaArrowLeft, FaArrowRight, FaExclamationTriangle } from "react-icons/fa";

// Hooks
import useScreenType from '../../hooks/useScreenType';
import { useVcEntity } from '../../hooks/useVcEntity';

// Contexts
import CredentialsContext from '@/context/CredentialsContext';

// Components
import { H1 } from '../Shared/Heading';
import CredentialImage from './CredentialImage';
import FullscreenPopup from '../Popups/FullscreenImg';
import PageDescription from '../Shared/PageDescription';
import Button from '../Buttons/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/pro-solid-svg-icons';
import { faEllipsis, faLayerGroup } from '@fortawesome/pro-regular-svg-icons';
import UsageStats from './UsageStats';

const CredentialLayout = ({ children, title = null }) => {
	//General
	const { t } = useTranslation();
	const navigate = useNavigate();
	const screenType = useScreenType();
	const { credentialId } = useParams();
	const { vcEntityList, fetchVcData } = useContext(CredentialsContext);
	const vcEntity = useVcEntity(fetchVcData, vcEntityList, credentialId);

	//State
	const [showFullscreenImgPopup, setShowFullscreenImgPopup] = useState(false);
	
	//Variables
	const credentialFriendlyName = useMemo(() => 
		vcEntity ? vcEntity.parsedCredential.metadata.credential.name : ""
	, [vcEntity])

	//Render
	return (
		<div className="sm:px-12 pt-10 pb-20 w-full max-w-[1064px] mx-auto">
			{screenType !== 'mobile' ? (
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

					<Button
						id="credential-actions"
						variant="cancel"
						size='xl'
						textSize='md'
						square
					>
						<FontAwesomeIcon icon={faEllipsis} className="text-md" />
					</Button>
				</div>
			) : (
				<div className='flex'>
					<button
						id="go-previous"
						onClick={() => navigate(-1)}
						className="mr-2 mb-2"
						aria-label="Go back to the previous page"
					>
						<FaArrowLeft size={20} className="text-2xl text-primary dark:text-white" />
					</button>

					{title && <H1 heading={title} hr={false} />}
				</div>
			)}

			<div className="flex flex-wrap items-start mt-0 lg:mt-11">
				{/* Block 1: credential */}
				<div className='flex flex-row w-full lg:w-1/2'>
					<div className={`flex flex-row items-start gap-5`}>
						{vcEntity && (
							// Open the modal when the credential is clicked
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

								{screenType !== 'mobile' && 
									<UsageStats 
										vcEntity={vcEntity}
									/>
								}
							</div>
						)}

						<div>
							{screenType === 'mobile' && (
								<div className='flex flex-start flex-col gap-1'>
									<p className='text-xl font-bold text-primary dark:text-white'>{credentialFriendlyName}</p>

									<UsageStats 
										vcEntity={vcEntity}
									/>
								</div>
							)}
						</div>
					</div>
				</div>

				{screenType === 'mobile' && (
					<>
						{vcEntity?.isExpired && (
							<div className="bg-orange-100 mx-2 p-2 shadow-lg text-sm rounded-lg mb-4 flex items-center">
								<div className="mr-2 text-orange-500">
									<FaExclamationTriangle size={18} />
								</div>

								<p>{t('pageCredentials.details.expired')}</p>
							</div>
						)}
					</>
				)}

				{children}
			</div>

			{/* Fullscreen credential Popup*/}
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
		</div>
	);
};

export default CredentialLayout;
