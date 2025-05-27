import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ConnectionStatusIcon from './Navigation/ConnectionStatusIcon';
import Logo from '../Logo/Logo';

const Header = () => {
	const { t } = useTranslation();

	return (
		<header className="sticky top-0 z-50 w-full bg-primary dark:bg-primary-hover text-white flex items-center justify-between shadow-md md:hidden rounded-b-lg transition-all duration-300 p-3">
			<ConnectionStatusIcon size='small' className="transition-all duration-300" />
			<div className="flex items-center">
				<Logo type='white' aClassName='mr-2' imgClassName="cursor-pointer transition-all duration-300 w-7" />
				<a href="/" className="text-white font-bold cursor-pointer transition-all duration-300 text-sm">
					{t('common.walletName')}
				</a>
			</div>
		</header>
	);
};

export default Header;
