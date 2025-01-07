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
		<section className="bg-gray-100 dark:bg-gray-900">
			<div className="flex flex-col items-center justify-center px-6 py-8 mx-auto min-h-dvh">
				<Logo aClassName='mb-6' imglassName='w-40' />
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
						<Button
							onClick={handleBackToHome}
							variant="secondary"
							additionalClassName='w-full'
						>
							{t('notFound.homeButton')}
						</Button>
					</div>
				</div>
			</div>
		</section>
	);
};

export default NotFound;
