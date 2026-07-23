import React from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../Buttons/Button';

const LoadError = ({ message, onRetry }: { message: string, onRetry: () => void }) => {
	const { t } = useTranslation();

	return (
		<div className="py-4">
			<p className="mb-2 text-sm text-lm-red dark:text-dm-red">
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
