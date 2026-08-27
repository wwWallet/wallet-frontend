// External libraries
import React, { useState, useEffect, useContext } from 'react';
import { useParams, useMatch, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';

// Hooks
import useScreenType from '@/hooks/useScreenType';
import { useVcEntity } from '@/hooks/useVcEntity';
import { useCredentialName } from '@/hooks/useCredentialName';

// Config
import { DISPLAY_CREDENTIAL_USAGES } from '@/config';

// Contexts
import CredentialsContext from '@/context/CredentialsContext';

// Components
import { H1 } from '../Shared/Heading';
import CredentialImage from './CredentialImage';
import FullscreenPopup from '../Popups/FullscreenImg';
import { ArrowLeft } from 'lucide-react';

const SummaryDetail = ({ label, value, screenType }) => (
	<p className={`min-w-0 truncate text-lm-gray-800 dark:text-dm-gray-200 ${screenType === 'mobile' ? 'text-sm' : 'text-md'}`}>
		{label}: {value}
	</p>
);

const UsageStats = ({ zeroSigCount, sigTotal, screenType, t }) => {
	if (zeroSigCount === null || !sigTotal) return null;

	const usageClass =
		zeroSigCount === 0
			? 'text-lm-orange dark:text-dm-orange'
			: 'text-lm-green dark:text-dm-green';

	return (
		<SummaryDetail
			label={t('pageCredentials.details.availableUsages')}
			value={<><span className={`${usageClass} font-semibold`}>{zeroSigCount}</span>/{sigTotal}</>}
			screenType={screenType}
		/>
	);
};

const CredentialImagePreview = ({
	vcEntity,
	showRibbon,
	className = 'w-full object-cover',
	containerClassName = 'w-full',
	enableFullscreen = true,
	onFullscreen,
	ariaLabel,
	title,
	fixedRatioImage = false,
	preferredOrientation = fixedRatioImage ? 'landscape' : 'portrait',
}) => {
	const ImageContainer = enableFullscreen ? 'button' : 'div';

	return (
		<ImageContainer
			{...(enableFullscreen && {
				id: 'show-full-screen-credential',
				type: 'button',
				onClick: onFullscreen,
				'aria-label': ariaLabel,
				title,
			})}
			className={`relative block rounded-xl xm:rounded-lg overflow-hidden shadow-md ${enableFullscreen ? 'transition-shadow hover:shadow-lg cursor-pointer' : ''} ${containerClassName}`}
		>
			<CredentialImage
				vcEntity={vcEntity}
				parsedCredential={vcEntity.parsedCredential}
				className={className}
				showRibbon={showRibbon}
				fixedRatio={fixedRatioImage}
				preferredOrientation={preferredOrientation}
			/>
		</ImageContainer>
	);
};

const CredentialLayout = ({ children, title = null, summaryActions = null, actionsMenu = null }) => {
	const { batchId } = useParams();
	const screenType = useScreenType();
	const [showFullscreenImgPopup, setShowFullscreenImgPopup] = useState(false);
	const { t } = useTranslation();
	const navigate = useNavigate();
	const [zeroSigCount, setZeroSigCount] = useState(null)
	const [sigTotal, setSigTotal] = useState(null);

	const { vcEntityList, fetchVcData } = useContext(CredentialsContext);
	const vcEntity = useVcEntity(fetchVcData, vcEntityList, batchId);

	useEffect(() => {
		if (vcEntity) {
			setZeroSigCount(vcEntity.instances.filter(instance => instance.sigCount === 0).length || 0);
			setSigTotal(vcEntity.instances.length);
		}
	}, [vcEntity]);

	const credentialName = useCredentialName(
		vcEntity?.parsedCredential?.metadata?.credential?.name,
		vcEntity?.batchId,
		[i18n.language]
	);

	const isCredentialRoot = Boolean(useMatch('/credential/:batchId'));
	if (!vcEntity) return null;

	return (
		<div className="px-6 sm:px-12 w-full">
			<div className='mb-4'>
				<div className='flex items-center gap-1'>
					<button
						id="go-previous"
						onClick={() => navigate(-1)}
						aria-label={t('common.back')}
						className='-ml-2.5 p-2.5 shrink-0 rounded-full cursor-pointer text-lm-gray-900 dark:text-dm-gray-100 hover:bg-lm-gray-300 dark:hover:bg-dm-gray-700'
					>
						<ArrowLeft size={24} />
					</button>
					{isCredentialRoot && <H1 heading={title} flexJustifyContent="start" />}
					{actionsMenu && (
						<div className='ml-auto shrink-0'>{actionsMenu}</div>
					)}
				</div>
			</div>

			<div className="w-full flex flex-col gap-4">
				<div className="md:flex-1 min-w-0 flex flex-col gap-4">
					<CredentialImagePreview
						vcEntity={vcEntity}
						showRibbon
						enableFullscreen={isCredentialRoot}
						onFullscreen={() => setShowFullscreenImgPopup(true)}
						ariaLabel={credentialName}
						title={t('pageCredentials.credentialFullScreenTitle', { friendlyName: credentialName })}
						containerClassName={`mr-auto shrink-0 ${isCredentialRoot
							? 'w-full max-w-sm xm:max-w-none'
							: 'w-[clamp(8rem,20%,12rem)]'}`}
						fixedRatioImage={screenType === 'desktop' || !isCredentialRoot}
						preferredOrientation={screenType === 'desktop' || !isCredentialRoot ? 'landscape' : 'portrait'}
					/>
					{!isCredentialRoot && (
						<p className='truncate text-xl font-bold text-lm-gray-900 dark:text-dm-gray-100'>
							{credentialName}
						</p>
					)}
					{isCredentialRoot && DISPLAY_CREDENTIAL_USAGES && (
						<div>
							<UsageStats zeroSigCount={zeroSigCount} sigTotal={sigTotal} screenType={screenType} t={t} />
						</div>
					)}
					{isCredentialRoot && summaryActions && (
						<div>{summaryActions}</div>
					)}
				</div>
				{children}
			</div>
			{/* Fullscreen credential Popup*/}
			{isCredentialRoot && showFullscreenImgPopup && (
				<FullscreenPopup
					isOpen={showFullscreenImgPopup}
					onClose={() => setShowFullscreenImgPopup(false)}
					content={
						<CredentialImage
							vcEntity={vcEntity}
							className={"max-w-full max-h-full rounded-xl"}
							showRibbon={false}
							fixedRatio={screenType === 'desktop'}
							preferredOrientation={screenType === 'desktop' ? 'landscape' : 'portrait'}
						/>
					}
				/>
			)}

		</div>
	);
};

export default CredentialLayout;
