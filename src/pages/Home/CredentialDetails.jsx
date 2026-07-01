// External libraries
import React, { useContext } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// Hooks
import { useVcEntity } from '../../hooks/useVcEntity';

// Contexts
import CredentialsContext from '@/context/CredentialsContext';

// Components
import CredentialLayout from '../../components/Credentials/CredentialLayout';
import CredentialJson from '../../components/Credentials/CredentialJson';
import { DEV_MODE } from '@/config';

const CredentialDetails = () => {
	const { batchId } = useParams();
	const { t } = useTranslation();

	const { vcEntityList, fetchVcData } = useContext(CredentialsContext);
	const vcEntity  = useVcEntity(fetchVcData, vcEntityList, batchId);

	if (!DEV_MODE) {
		return <Navigate to={`/credential/${batchId}`} replace />;
	}

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
