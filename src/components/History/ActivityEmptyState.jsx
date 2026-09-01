// External libraries
import React from 'react';
import { History } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ActivityEmptyState = ({ credentialSpecific = false }) => {
	const { t } = useTranslation();
	const titleKey = credentialSpecific
		? 'pageHistory.emptyCredentialTitle'
		: 'pageHistory.emptyTitle';
	const descriptionKey = credentialSpecific
		? 'pageHistory.emptyCredentialDescription'
		: 'pageHistory.emptyDescription';

	return (
		<div className="mt-4 flex flex-col items-center justify-center rounded-xl border border-dashed border-lm-gray-400 bg-lm-gray-200/50 px-6 py-8 text-center dark:border-dm-gray-600 dark:bg-dm-gray-800/50">
			<History
				size={32}
				className="text-lm-gray-700 dark:text-dm-gray-300"
				aria-hidden="true"
			/>
			<p className="mt-3 font-medium text-lm-gray-900 dark:text-dm-gray-100">
				{t(titleKey)}
			</p>
			<p className="mt-1 max-w-sm text-sm text-lm-gray-700 dark:text-dm-gray-300">
				{t(descriptionKey)}
			</p>
		</div>
	);
};

export default ActivityEmptyState;
