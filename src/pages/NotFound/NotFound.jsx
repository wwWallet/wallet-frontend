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
				<Logo 
				imgClassName='w-64 h-8 object-contain'
				isWordmark={true}
				/>
				
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
