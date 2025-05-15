import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import ConnectionStatusIcon from './Navigation/ConnectionStatusIcon';
import Logo from '../Logo/Logo';

const Header = () => {
	//General
	const { t } = useTranslation();

	//State
	const [isScrolled, setIsScrolled] = useState(false);

	//Handlers
	useEffect(() => {
		const handleScroll = () => {
			if (window.scrollY > 35 && !isScrolled) {
				setIsScrolled(true);
			} else if (window.scrollY < 20 && isScrolled) {
				setIsScrolled(false);
			}
		};

		window.addEventListener('scroll', handleScroll);

		return () => {
			window.removeEventListener('scroll', handleScroll);
		};
	}, [isScrolled]);

	//Render
	return (
		<header className={`sticky top-0 z-50 w-full bg-c-lm-gray-100 dark:bg-c-dm-gray-800 text-c-lm-gray-900 dark:text-c-dm-gray-100 border-b border-c-lm-gray-400 dark:border-c-dm-gray-600 flex items-center justify-between shadow-md md:hidden p-4`}>
			<a 
			href={('/')}
			className="flex items-center justify-center"
			>
				<Logo 
				imgClassName='h-8 w-8' 
				/>

				<h4 className='text-center ml-3 text-c-lm-gray-900 dark:text-c-dm-gray-100 font-semibold' style={{ fontSize: '1.5rem', lineHeight: '1.75rem' }}>wwWallet</h4>
			</a>
			
			<ConnectionStatusIcon size={'normal'} className="mr-1" />
		</header>
	);
};

export default Header;
