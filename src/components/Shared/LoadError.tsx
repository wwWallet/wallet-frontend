import React from 'react';
import { useTranslation } from 'react-i18next';
import { TriangleAlert } from 'lucide-react';
import Button from '../Buttons/Button';

const LoadError = ({ message, onRetry }: { message: string, onRetry: () => void }) => {
	const { t } = useTranslation();

	return (
		<div className="flex flex-col items-center gap-3 text-center px-4 py-16 sm:py-24">
			<TriangleAlert size={36} strokeWidth={1.5} className="text-lm-orange dark:text-dm-orange" />
			<p role="alert" className="max-w-xs sm:max-w-sm text-sm text-lm-gray-800 dark:text-dm-gray-200">
				{message}
			</p>
			<Button
				id="retry-load"
				variant="primary"
				onClick={onRetry}
			>
				{t('common.tryAgain')}
			</Button>
		</div>
	);
};

export default LoadError;
