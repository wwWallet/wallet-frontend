import React, { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { H1 } from './Heading';

type PageHeadingProps = {
	heading: ReactNode,
	actions?: ReactNode,
	backPath?: string,
	hideHeadingOnMobile?: boolean,
	showBackButtonOnDesktop?: boolean,
};

const PageHeading = ({
	heading,
	actions,
	backPath = '/',
	hideHeadingOnMobile = false,
	showBackButtonOnDesktop = false,
}: PageHeadingProps) => {
	const navigate = useNavigate();
	const { t } = useTranslation();

	return (
		<div className="flex items-center gap-1">
			<button
				id="go-previous"
				type="button"
				onClick={() => navigate(backPath, { replace: true })}
				aria-label={t('common.back')}
				title={t('common.back')}
				className={`${showBackButtonOnDesktop ? '' : 'md:hidden'} -ml-2.5 p-2.5 shrink-0 rounded-full cursor-pointer text-lm-gray-900 dark:text-dm-gray-100 hover:bg-lm-gray-300 dark:hover:bg-dm-gray-700`}
			>
				<ArrowLeft size={24} />
			</button>
			<div className={`${hideHeadingOnMobile ? 'hidden md:block' : ''} min-w-0 flex-1`}>
				<H1 heading={heading} flexJustifyContent="start" />
			</div>
			{actions && <div className="ml-auto shrink-0">{actions}</div>}
		</div>
	);
};

export default PageHeading;
