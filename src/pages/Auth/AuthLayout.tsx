import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';

import StatusContext from '@/context/StatusContext';

import LanguageSelector from '../../components/LanguageSelector/LanguageSelector';
import LoginLayout from '../../components/Auth/LoginLayout';
import PasskeyInfoPopup from '@/components/Popups/PasskeyInfoPopup';

import { Info } from 'lucide-react';

const AuthLayout = ({
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
		<LoginLayout heading={
			appHeading ?? <span className="text-primary dark:text-brand-light"> {t('common.walletName')}</span>
		}>
			<div className="relative p-8 sm:px-12 space-y-4 md:space-y-6 lg:space-y-8 bg-white rounded-lg dark:bg-dm-gray-900 border border-lm-gray-400 dark:border-dm-gray-600">
				<h1 className="pt-4 text-xl font-bold leading-tight tracking-tight text-dm-gray-900 md:text-2xl text-center dark:text-white">
					{heading}
				</h1>

				<div className='absolute top-5 right-5'>
					<LanguageSelector className='min-w-12 text-sm text-lm-gray-900 dark:text-white cursor-pointer bg-white dark:bg-dm-gray-900 appearance-none' />
				</div>

				{isOnline === false && (
					<p className="text-sm font-light text-lm-gray-900 dark:text-dm-gray-100 italic mb-2">
						<Info size={14} className="text-md inline-block mr-1" />
						{t('loginSignup.messageOffline')}
					</p>
				)}

				{children}
			</div>
			{showPasskeyInfoPopup && <PasskeyInfoPopup />}
		</LoginLayout>
	);
};

export default AuthLayout;
