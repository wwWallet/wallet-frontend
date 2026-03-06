import React from 'react';
import Logo from '../../components/Logo/Logo';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Button from '../../components/Buttons/Button';
import { useTenant } from '@/context/TenantContext';
import { matchesTenantFromUrl } from '@/lib/tenant';


const NotFound = () => {
	const navigate = useNavigate();
	const { t } = useTranslation();
	const { buildPath, effectiveTenantId, urlTenantId } = useTenant();

	const handleBackToHome = () => {
		if (!matchesTenantFromUrl(effectiveTenantId, urlTenantId)) {
			window.location.href = buildPath();
		} else {
			navigate(buildPath());
		}
	};

	return (
		<section>
			<div className="flex flex-col items-center justify-center px-6 py-8 mx-auto min-h-dvh">
				<Logo aClassName='mb-6' imgClassName='w-20' />
				<h1 className="text-xl mb-8 font-bold leading-tight tracking-tight text-lm-gray-900 md:text-2xl text-center dark:text-dm-gray-100">
					{t('common.walletName')}
				</h1>
				<div className="w-full rounded-lg shadow border border-lm-gray-400 dark:border-dm-gray-600 md:mt-0 sm:max-w-md xl:p-0">
					<div className="p-6 space-y-4 md:space-y-6 sm:p-8">
						<h1 className="text-2xl font-bold leading-tight tracking-tight text-lm-gray-900 md:text-4xl text-center dark:text-dm-gray-100">
							{t('notFound.title')}
						</h1>

						<p className='text-center'>
							{t('notFound.message')}
						</p>
						<Button
							id="navigate-home"
							onClick={handleBackToHome}
							variant="primary"
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
