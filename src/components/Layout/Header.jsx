import React from 'react';
import { useTranslation } from 'react-i18next';
import Logo from '../Logo/Logo';

const Header = () => {
	const { t } = useTranslation();

	return (
		<header className="sticky top-0 z-50 w-full bg-inherit text-inherit flex items-center md:hidden border-b border-lm-gray-400 dark:border-dm-gray-600 transition-all duration-300 py-3 px-6">
			<div className="flex items-center">
				<Logo aClassName='mr-2' imgClassName="cursor-pointer transition-all duration-300 w-8" />
				<a href="/" className="text-lm-gray-900 dark:text-dm-gray-100 font-bold cursor-pointer transition-all duration-300 text-sm">
					{t('common.walletName')}
				</a>
			</div>
		</header>
	);
};

export default Header;
