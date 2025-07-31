import React from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import { useCredentialName } from '@/hooks/useCredentialName';
import CredentialImage from './CredentialImage';

const CredentialGridCard = ({ vcEntity, onClick, latestCredentials }) => {
	const { t } = useTranslation();

	const credentialName = useCredentialName(
		vcEntity?.parsedCredential?.metadata?.credential?.name,
		vcEntity?.batchId,
		i18n.language
	);

	return (
		<button
			id={`credential-grid-${vcEntity.batchId}`}
			key={vcEntity.batchId}
			className={`relative rounded-xl transition-shadow shadow-md hover:shadow-lg cursor-pointer ${latestCredentials.has(vcEntity.batchId) ? 'highlight-border fade-in' : ''
				}`}
			onClick={() => onClick(vcEntity)}
			aria-label={credentialName}
			title={t('pageCredentials.credentialDetailsTitle', {
				friendlyName: credentialName,
			})}
		>
			<CredentialImage
				vcEntity={vcEntity}
				vcEntityInstances={vcEntity.instances}
				parsedCredential={vcEntity.parsedCredential}
				className={`w-full h-full object-cover rounded-xl ${latestCredentials.has(vcEntity.batchId) ? 'highlight-filter' : ''
					}`}
			/>
		</button>
	);
};

export default CredentialGridCard;
