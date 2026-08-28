// External libraries
import React, { useContext, useState } from 'react';
import { ArrowLeft, CircleAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useMatch, useNavigate, useParams } from 'react-router-dom';

// Config
import { DISPLAY_CREDENTIAL_USAGES } from '@/config';
import i18n from '@/i18n';

// Contexts
import CredentialsContext from '@/context/CredentialsContext';

// Hooks
import { useCredentialName } from '@/hooks/useCredentialName';
import useScreenType from '@/hooks/useScreenType';
import { useVcEntity } from '@/hooks/useVcEntity';

// Components
import CredentialImage from '@/components/Credentials/CredentialImage';
import FullscreenPopup from '@/components/Popups/FullscreenImg';
import { H1 } from '@/components/Shared/Heading';

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
				showRibbon={false}
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

	const { vcEntityList, fetchVcData } = useContext(CredentialsContext);
	const vcEntity = useVcEntity(fetchVcData, vcEntityList, batchId);
	const sigTotal = vcEntity?.instances?.length ?? 0;
	const zeroSigCount = vcEntity?.instances?.filter(instance => instance.sigCount === 0).length ?? 0;

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
						title={t('common.back')}
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
			{ isCredentialRoot && vcEntity.isExpired && (
				<div
					role="alert"
					className="mb-4 flex items-center gap-2 rounded-xl border border-lm-red/20 bg-lm-red-light/50 p-2 shadow-md dark:border-dm-red/20 dark:bg-dm-red/5 sm:px-5"
				>
					<CircleAlert
						className="h-6 w-6 shrink-0 fill-lm-red text-white [&_circle]:stroke-lm-red dark:fill-dm-red dark:[&_circle]:stroke-dm-red"
						strokeWidth={2.5}
						aria-hidden="true"
					/>
					<p className="min-w-0 flex-1 text-sm font-medium text-lm-gray-900 dark:text-dm-gray-100">
						{t('pageCredentials.details.expired')}
					</p>
				</div>
			)}

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
							className="max-w-full max-h-full rounded-xl"
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
