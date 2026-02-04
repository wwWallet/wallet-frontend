import React from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import CredentialImage from './CredentialImage';
import { useCredentialName } from '@/hooks/useCredentialName';

const CredentialSlideCard = ({ vcEntity, isActive, latestCredentials, onClick }) => {
	const { t } = useTranslation();

	const credentialName = useCredentialName(
		vcEntity?.parsedCredential?.metadata?.credential?.name,
		vcEntity?.id,
		[i18n.language]
	);

	return (
		<button
			id={`credential-slide-${vcEntity.id}`}
			className={`relative rounded-xl w-full transition-shadow shadow-md hover:shadow-lg cursor-pointer ${latestCredentials.has(vcEntity.id) ? 'fade-in' : ''
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
				parsedCredential={vcEntity.parsedCredential}
				className={`w-full h-full object-cover rounded-xl ${latestCredentials.has(vcEntity.id) ? 'highlight-filter' : ''
					}`}
			/>
		</button>
	);
};

export default CredentialSlideCard;
