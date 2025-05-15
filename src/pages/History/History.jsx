// External libraries
import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleQuestion } from '@fortawesome/pro-solid-svg-icons';

// Context
import SessionContext from '@/context/SessionContext';

// Hooks
import useFetchPresentations from '@/hooks/useFetchPresentations';

// Components
import { H1 } from '@/components/Shared/Heading';
import Tooltip from '@/components/Shared/Tooltip';
import HistoryList from '@/components/History/HistoryList';
import PageDescription from '@/components/Shared/PageDescription';

const History = () => {
	const { api } = useContext(SessionContext);
	const history = useFetchPresentations(api);

	const { t } = useTranslation();

	return (
		<div className="sm:px-12 pt-10 pb-20 w-full max-w-[1064px] mx-auto">
			<div className='flex items-center justify-between'>
				<div className='flex-1'>
					<h1 className="text-2xl font-semibold leading-tight tracking-tight text-c-lm-gray-900 md:text-3xl dark:text-c-dm-gray-100">
						{t('common.navItemHistory')}
					</h1>

					<p className="mt-3 text-c-lm-gray-700 dark:text-c-dm-gray-300">
						{t('pageHistory.description')}
					</p>
				</div>

				<div 
					id={`add-credential-tip`}
				>
					<FontAwesomeIcon
						icon={faCircleQuestion} 
						className="text-c-lm-gray-700 dark:text-c-dm-gray-300 text-lg cursor-pointer hover:text-c-lm-gray-900 dark:hover:text-c-dm-gray-100 transition-all duration-150" 
					/>
				</div>
	
				<Tooltip
				offset={8} 
				text="Use this page to view your credential history. As you add and send credentials, they will start to appear here." 
				id={`add-credential-tip`} 
				place="bottom"
				/>
			</div>

			{history.length === 0 ? (
				<p className="text-c-lm-gray-700 dark:text-c-dm-gray-300 p-32 border border-c-lm-gray-300 dark:border-c-dm-gray-700 rounded-xl text-center mt-11">
					{t('pageHistory.noFound')}
				</p>
			) : (
				<div className="mt-11 rounded-lg border border-c-lm-gray-400 dark:border-c-dm-gray-600 overflow-hidden">
					<HistoryList history={history} />
				</div>
			)}
		</div>
	);
};

export default History;
