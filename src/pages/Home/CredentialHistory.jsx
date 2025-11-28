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
	const { batchId } = useParams();
	const { keystore } = useContext(SessionContext);
	const history = useFetchPresentations(keystore, batchId, null);
	const { t } = useTranslation();

	return (
		<>
			<CredentialLayout title={t('pageCredentials.presentationsTitle')}>
				{history.length === 0 ? (
					<p className="text-lm-gray-800 dark:text-dm-gray-200 mt-4">
						{t('pageHistory.noFound')}
					</p>
				) : (
					<HistoryList batchId={batchId} history={history} />
				)}
			</CredentialLayout>

		</>
	);
};

export default CredentialHistory;
