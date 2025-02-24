// External libraries
import React, { useContext } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// Contexts
import SessionContext from '@/context/SessionContext';

// Hooks
import useFetchPresentations from '../../hooks/useFetchPresentations';

// Components
import HistoryList from '../../components/History/HistoryList';
import CredentialLayout from '../../components/Credentials/CredentialLayout';

const CredentialHistory = () => {
	const { credentialId } = useParams();
	const { api } = useContext(SessionContext);
	const history = useFetchPresentations(api, credentialId, null);
	const { t } = useTranslation();

	return (
		<>
			<CredentialLayout title={t('pageCredentials.presentationsTitle')}>
				{history.length === 0 ? (
					<p className="text-gray-700 dark:text-white mt-4">
						{t('pageHistory.noFound')}
					</p>
				) : (
					<HistoryList credentialId={credentialId} history={history} />
				)}
			</CredentialLayout>

		</>
	);
};

export default CredentialHistory;
