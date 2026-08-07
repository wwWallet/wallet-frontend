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

const CredentialLayout = ({ children, title = null, fixedRatioImage = true, summaryActions = null, actionsMenu = null }) => {
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

	const CredentialImageButton = ({
		showRibbon,
		className = "w-full object-cover",
		onClick = () => setShowFullscreenImgPopup(true),
		ariaLabel,
		title,
		fixedRatioImage = false,
		preferredOrientation = fixedRatioImage ? 'landscape' : 'portrait',
	}) => (
		<button
			id="show-full-screen-credential"
			className="relative rounded-xl xm:rounded-lg w-full overflow-hidden transition-shadow shadow-md hover:shadow-lg cursor-pointer"
			onClick={onClick}
			aria-label={ariaLabel ?? credentialName}
			title={title ?? t('pageCredentials.credentialFullScreenTitle', { friendlyName: credentialName })}
		>
			<CredentialImage
				vcEntity={vcEntity}
				parsedCredential={vcEntity.parsedCredential}
				className={className}
				showRibbon={showRibbon}
				fixedRatio={fixedRatioImage}
				preferredOrientation={preferredOrientation}
			/>
		</button>
	);

	const CredentialSummary = () => (
		<div className='flex flex-col gap-1'>
			{(screenType === 'desktop' || !isCredentialRoot) && (
				<p className='text-xl font-bold text-lm-gray-900 dark:text-dm-gray-100'>{credentialName}</p>
			)}
			{/* TODO: hardcoded placeholders. Wire to the credential's own values —
			description, expiry and issuer all come from its metadata - and move
			the labels into the locale files. */}
			{isCredentialRoot && (
				<>
					<p className={`text-lm-gray-800 dark:text-dm-gray-200 ${screenType === 'mobile' ? 'text-sm' : 'text-md'}`}>
						Proof of identity issued by wwWallet Issuer, accepted across the EU.
					</p>
					<hr className='my-2 border-t border-lm-gray-400 dark:border-dm-gray-600' />
					<SummaryDetail label="Expiry date" value="12 Mar 2027" screenType={screenType} />
					<SummaryDetail label="Issued by" value="wwWallet Issuer" screenType={screenType} />
					{DISPLAY_CREDENTIAL_USAGES && (
						<UsageStats zeroSigCount={zeroSigCount} sigTotal={sigTotal} screenType={screenType} t={t} />
					)}
					{summaryActions && (
						<div className='mt-2'>{summaryActions}</div>
					)}
				</>
			)}
		</div>
	);

	const DesktopLayout = () => (
		<div className="w-full flex flex-col gap-4">
			<div className={`md:flex-1 min-w-0 flex gap-4 ${isCredentialRoot ? 'flex-col md:flex-row md:items-center' : 'flex-row items-center'}`}>
				<div className={isCredentialRoot ? 'w-full md:w-1/2 lg:w-1/3 md:max-w-sm md:shrink-0' : 'w-4/12 shrink-0'}>
					<CredentialImageButton
						showRibbon
						fixedRatioImage={screenType === 'desktop' || !isCredentialRoot}
						preferredOrientation={screenType === 'desktop' || !isCredentialRoot ? 'landscape' : 'portrait'}
					/>
				</div>
				<CredentialSummary />
			</div>
			{children}
		</div>
	);
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
					<H1 heading={title} flexJustifyContent="start" />
					{/* Overflow actions for the credential, pinned to the title's right. */}
					{actionsMenu && (
						<div className='ml-auto shrink-0'>{actionsMenu}</div>
					)}
				</div>
			</div>

			<div className="w-full flex flex-col">
				<DesktopLayout />
			</div>
			{/* Fullscreen credential Popup*/}
			{showFullscreenImgPopup && (
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
