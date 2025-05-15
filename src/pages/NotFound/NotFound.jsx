import React from 'react';
import Logo from '../../components/Logo/Logo';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Button from '../../components/Buttons/Button';


const NotFound = () => {
	const navigate = useNavigate();
	const { t } = useTranslation();

	const handleBackToHome = () => {
		navigate('/');
	};

	return (
		<section className="bg-c-lm-gray-100 dark:bg-c-dm-gray-900">
			<div className="flex flex-col items-center justify-center px-6 py-8 mx-auto min-h-dvh">
				<div className='flex items-center justify-center'>
					<Logo 
					imgClassName='h-10 w-10' 
					/>

					<h4 className='text-center ml-4 text-c-lm-gray-900 dark:text-c-dm-gray-100 font-semibold' style={{ fontSize: '1.75rem', lineHeight: '1.75rem' }}>wwWallet</h4>
				</div>
				
				<h1 className="text-xl md:text-2xl text-center font-semibold leading-tight tracking-tight text-c-lm-gray-900 dark:text-c-dm-gray-100 mt-14">
					{t('notFound.title')}
				</h1>

				<p className='text-md text-center text-c-lm-gray-700 dark:text-c-dm-gray-300 mt-4'>
					{t('notFound.message')}
				</p>

				<Button
					additionalClassName='mt-12'
					id="navigate-home"
					onClick={handleBackToHome}
					variant="tertiary"
					size='md'
					textSize='md'
				>
					{t('notFound.homeButton')}
				</Button>
			</div>
		</section>
	);
};

export default NotFound;
