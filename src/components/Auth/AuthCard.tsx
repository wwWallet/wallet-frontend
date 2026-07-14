import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';

import StatusContext from '@/context/StatusContext';

import AuthPageLayout from './AuthPageLayout';
import PasskeyInfoPopup from '@/components/Popups/PasskeyInfoPopup';

import { Info } from 'lucide-react';

const AuthCard = ({
	heading,
	appHeading,
	showPasskeyInfoPopup = true,
	children,
}: {
	heading: React.ReactNode,
	appHeading?: React.ReactNode,
	showPasskeyInfoPopup?: boolean,
	children: React.ReactNode,
}) => {
	const { isOnline } = useContext(StatusContext);
	const { t } = useTranslation();

	return (
		<AuthPageLayout heading={
			appHeading ?? <span className="text-primary dark:text-brand-light"> {t('common.walletName')}</span>
		}>
			<div className="p-8 sm:px-12 space-y-4 md:space-y-6 lg:space-y-8 bg-white rounded-lg dark:bg-dm-gray-900 border border-lm-gray-400 dark:border-dm-gray-600">
				<h1 className="pt-4 text-xl font-bold leading-tight tracking-tight text-dm-gray-900 md:text-2xl text-center dark:text-white">
					{heading}
				</h1>

				{isOnline === false && (
					<p className="text-sm font-light text-lm-gray-900 dark:text-dm-gray-100 italic mb-2">
						<Info size={14} className="text-md inline-block mr-1" />
						{t('loginSignup.messageOffline')}
					</p>
				)}

				{children}
			</div>
			{showPasskeyInfoPopup && <PasskeyInfoPopup />}
		</AuthPageLayout>
	);
};

export default AuthCard;
