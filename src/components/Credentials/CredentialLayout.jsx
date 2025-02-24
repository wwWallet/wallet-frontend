// External libraries
import React, { useState, useEffect, useContext } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaArrowLeft, FaArrowRight, FaExclamationTriangle } from "react-icons/fa";
import { PiCardsBold } from "react-icons/pi";

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

const CredentialLayout = ({ children, title = null }) => {
	const { credentialId } = useParams();
	const screenType = useScreenType();
	const [showFullscreenImgPopup, setShowFullscreenImgPopup] = useState(false);
	const [credentialFiendlyName, setCredentialFriendlyName] = useState(null);
	const { t } = useTranslation();
	const navigate = useNavigate();
	const [zeroSigCount, setZeroSigCount] = useState(null)
	const [sigTotal, setSigTotal] = useState(null);

	const { vcEntityList, fetchVcData } = useContext(CredentialsContext);
	const vcEntity = useVcEntity(fetchVcData, vcEntityList, credentialId);

	useEffect(() => {
		if (vcEntity) {
			setZeroSigCount(vcEntity.instances.filter(instance => instance.sigCount === 0).length || 0);
			setSigTotal(vcEntity.instances.length);
			setCredentialFriendlyName(vcEntity.parsedCredential.metadata.credential.name);
		}
	}, [vcEntity]);

	const UsageStats = ({ zeroSigCount, sigTotal }) => {
		if (zeroSigCount === null || sigTotal === null) return null;

		const usageClass = zeroSigCount === 0 ? 'text-orange-600 dark:text-orange-500' : 'text-green-600 dark:text-green-500';

		return (
			<div className={`flex items-center text-gray-800 dark:text-white ${screenType === 'mobile' ? 'text-sm' : 'text-md'}`}>
				<PiCardsBold size={18} className=' mr-1' />
				<p className=' font-base'>
					<span className={`${usageClass} font-semibold`}>{zeroSigCount}</span>
					<span>/{sigTotal}</span> {t('pageCredentials.details.availableUsages')}
				</p>
			</div>
		);
	};

	return (
		<div className=" sm:px-6">
			{screenType !== 'mobile' ? (
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
				<div className='flex'>
					<button onClick={() => navigate(-1)} className="mr-2 mb-2" aria-label="Go back to the previous page">
						<FaArrowLeft size={20} className="text-2xl text-primary dark:text-white" />
					</button>
					{title && <H1 heading={title} hr={false} />}
				</div>
			)}
			<PageDescription description={t('pageCredentials.details.description')} />

			<div className="flex flex-wrap mt-0 lg:mt-5">
				{/* Block 1: credential */}
				<div className='flex flex-row w-full lg:w-1/2'>
					<div className={`flex flex-row items-center gap-5 mt-2 mb-4 px-2`}>
						{vcEntity && (
							// Open the modal when the credential is clicked
							<div className='flex flex-col gap-4 w-4/5 xm:w-4/12'>
								<button className="relative rounded-xl xm:rounded-lg w-full overflow-hidden transition-shadow shadow-md hover:shadow-lg cursor-pointer w-full"
									onClick={() => setShowFullscreenImgPopup(true)}
									aria-label={`${credentialFiendlyName}`}
									title={t('pageCredentials.credentialFullScreenTitle', { friendlyName: credentialFiendlyName })}
								>
									<CredentialImage vcEntity={vcEntity} parsedCredential={vcEntity.parsedCredential} className={"w-full object-cover"} showRibbon={screenType !== 'mobile'} />
								</button>
								{screenType !== 'mobile' && zeroSigCount !== null && sigTotal &&
									<UsageStats zeroSigCount={zeroSigCount} sigTotal={sigTotal} />
								}
							</div>
						)}

						<div>
							{screenType === 'mobile' && (
								<div className='flex flex-start flex-col gap-1'>
									<p className='text-xl font-bold text-primary dark:text-white'>{credentialFiendlyName}</p>
									<UsageStats zeroSigCount={zeroSigCount} sigTotal={sigTotal} />
								</div>
							)}
						</div>
					</div>
				</div>

				{screenType === 'mobile' && (
					<>
						{vcEntity && vcEntity.isExpired && (
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
						<CredentialImage vcEntity={vcEntity} className={"max-w-full max-h-full rounded-xl"} showRibbon={false} />
					}
				/>
			)}
		</div>
	);
};

export default CredentialLayout;
