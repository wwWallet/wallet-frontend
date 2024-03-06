import React, { useState, useEffect } from 'react';
import logo from '../../assets/images/logo.png';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CSSTransition } from 'react-transition-group';

const NotFound = () => {
	const navigate = useNavigate();
	const [isContentVisible, setIsContentVisible] = useState(false);

	const { t } = useTranslation();

	const handleBackToHome = () => {
		navigate('/');
	};

	useEffect(() => {
		setTimeout(() => {
			setIsContentVisible(true);
		}, 0);
	}, []);

	return (
		<section className="bg-gray-100 dark:bg-gray-900">
			<CSSTransition in={isContentVisible} timeout={400} classNames="content-fade-in">
				<div className="flex flex-col items-center justify-center px-6 py-8 mx-auto h-screen pb-20">
					<a href="/" className="flex items-center mb-6 text-2xl font-semibold text-gray-900 dark:text-white">
						<img className="w-20" src={logo} alt="logo" />
					</a>
					<h1 className="text-xl mb-7 font-bold leading-tight tracking-tight text-gray-900 md:text-2xl text-center dark:text-white">
						{t('common.walletName')}
					</h1>
					<div className="w-full bg-white rounded-lg shadow dark:border md:mt-0 sm:max-w-md xl:p-0 dark:bg-gray-800 dark:border-gray-700">
						<div className="p-6 space-y-4 md:space-y-6 sm:p-8">
							<h1 className="text-2xl font-bold leading-tight tracking-tight text-gray-900 md:text-4xl text-center dark:text-white">
								{t('notFound.title')}
							</h1>

							<p className='text-center'>
								{t('notFound.message')}
							</p>
							<button
								onClick={handleBackToHome}
								className="w-full text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
							>
								{t('notFound.homeButton')}
							</button>
						</div>
					</div>
				</div>
			</CSSTransition>
		</section>
	);
};

export default NotFound;
