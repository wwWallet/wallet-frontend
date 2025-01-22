// External libraries
import React, { useContext } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// Hooks
import { useVcEntity } from '../../hooks/useVcEntity';

// Contexts
import CredentialsContext from '../../context/CredentialsContext';

// Components
import CredentialLayout from '../../components/Credentials/CredentialLayout';
import CredentialJson from '../../components/Credentials/CredentialJson';

const CredentialDetails = () => {
	const { credentialId } = useParams();
	const { t } = useTranslation();

	const { vcEntityList, fetchVcData } = useContext(CredentialsContext);
	const vcEntity  = useVcEntity(fetchVcData, vcEntityList, credentialId);

	return (
		<>
			<CredentialLayout title={t('pageCredentials.datasetTitle')}>
				{vcEntity && (
					<CredentialJson parsedCredential={vcEntity?.parsedCredential} textAreaRows='18'/>
				)}
			</CredentialLayout>

		</>
	);
};

export default CredentialDetails;
