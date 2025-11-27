import React from 'react';
import { useTranslation } from 'react-i18next';
import ConnectionStatusIcon from './Navigation/ConnectionStatusIcon';
import Logo from '../Logo/Logo';

const Header = () => {
	const { t } = useTranslation();

	return (
		<header className="sticky top-0 z-50 w-full bg-inherit text-inherit flex items-center justify-between md:hidden border-b border-lm-gray-400 dark:border-dm-gray-600 transition-all duration-300 p-3">
			<ConnectionStatusIcon size='small' className="transition-all duration-300" />
			<div className="flex items-center">
				<Logo type='dark' aClassName='mr-2' imgClassName="cursor-pointer transition-all duration-300 w-8" />
				<a href="/" className="text-lm-gray-900 dark:text-dm-gray-100 font-bold cursor-pointer transition-all duration-300 text-sm">
					{t('common.walletName')}
				</a>
			</div>
		</header>
	);
};

export default Header;
