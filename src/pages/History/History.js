// External libraries
import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';

// Context
import SessionContext from '../../context/SessionContext';

// Hooks
import useFetchPresentations from '../../hooks/useFetchPresentations';

// Components
import { H1 } from '../../components/Heading';
import HistoryList from '../../components/History/HistoryList';

const History = () => {
	const { api } = useContext(SessionContext);
	const history = useFetchPresentations(api);

	const { t } = useTranslation();

	return (
		<div className="sm:px-6 w-full">
			<H1 heading={t('common.navItemHistory')} />
			<p className="italic pd-2 text-gray-700 dark:text-gray-300">
				{t('pageHistory.description')}
			</p>

			{history.length === 0 ? (
				<p className="text-gray-700 dark:text-white mt-4">
					{t('pageHistory.noFound')}
				</p>
			) : (
				<HistoryList history={history} />
			)}
		</div>
	);
};

export default History;
