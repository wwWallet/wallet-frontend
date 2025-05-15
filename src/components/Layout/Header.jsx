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
			className=""
			>
				<Logo 
				imgClassName='h-7 my-0.5 w-48' 
				isWordmark={true}
				isLeft={true}
				/>
			</a>
			
			<ConnectionStatusIcon size={'normal'} className="mr-1" />
		</header>
	);
};

export default Header;
