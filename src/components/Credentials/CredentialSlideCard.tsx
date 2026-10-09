import React from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import CredentialImage from './CredentialImage';
import { useCredentialName } from '@/hooks/useCredentialName';
import type { ExtendedVcEntity } from '@/context/CredentialsContext';

interface CredentialSlideCardProps {
	vcEntity: ExtendedVcEntity;
	isActive: boolean;
	latestCredentials: ReadonlySet<number>;
	onClick: (vcEntity: ExtendedVcEntity) => void;
	fixedRatio?: boolean;
}

const CredentialSlideCard = ({ vcEntity, isActive, latestCredentials, onClick, fixedRatio }: CredentialSlideCardProps) => {
	const { t } = useTranslation();

	const credentialName = useCredentialName(
		vcEntity?.parsedCredential?.metadata?.credential?.name,
		vcEntity?.batchId,
		[i18n.language]
	);

	return (
		<button
			id={`credential-slide-${vcEntity.batchId}`}
			className={`relative rounded-xl w-full transition-shadow shadow-md hover:shadow-lg cursor-pointer ${latestCredentials.has(vcEntity.batchId) ? 'fade-in' : ''
				}`}
			onClick={() => onClick(vcEntity)}
			aria-label={credentialName ?? ''}
			tabIndex={isActive ? 0 : -1}
			title={t('pageCredentials.credentialFullScreenTitle', {
				friendlyName: credentialName,
			})}
		>
			<CredentialImage
				vcEntity={vcEntity}
				vcEntityInstances={vcEntity.instances}
				showRibbon={isActive}
				className={`w-full h-full object-cover rounded-xl ${latestCredentials.has(vcEntity.batchId) ? 'highlight-filter' : ''
					}`}
				fixedRatio={fixedRatio}
			/>
		</button>
	);
};

export default CredentialSlideCard;
