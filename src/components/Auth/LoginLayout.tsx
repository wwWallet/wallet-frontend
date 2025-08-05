import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import * as config from '../../config';
import Logo from '../Logo/Logo';
import PWAInstallPrompt from '../PWAInstall/PWAInstallPrompt';
import useScreenType from '@/hooks/useScreenType';

export default function LoginLayout({ children, heading }: { children: React.ReactNode, heading: React.ReactNode }) {
	const { t } = useTranslation();
	const screenType = useScreenType();

	return (
		<section className="bg-gray-100 dark:bg-gray-900 min-h-dvh flex flex-col">
			{screenType !== 'desktop' && (
				<PWAInstallPrompt />
			)}

			<div className="flex-grow flex flex-col items-center justify-center px-6 py-8">
				<Logo aClassName='mb-6' imgClassName='w-40' />

				<h1 className="text-3xl mb-7 font-bold leading-tight tracking-tight text-gray-900 text-center dark:text-white">
					{heading}
				</h1>

				<div className="relative w-full sm:max-w-md xl:p-0">
					{children}
				</div>

				{screenType === 'desktop' && (
					<PWAInstallPrompt />
				)}
			</div>

			<footer className="py-4">
				<p className="text-sm text-gray-700 dark:text-gray-400 text-center">
					<Trans
						i18nKey="sidebar.poweredBy"
						components={{
							docLinkWalletGithub: (
								<a
									href="https://github.com/wwWallet"
									rel="noreferrer"
									target="_blank"
									className="underline text-primary dark:text-primary-light"
									aria-label={t('sidebar.poweredbyAriaLabel')}
								/>
							)
						}}
					/>
				</p>
				<p className="hidden">v{config.APP_VERSION}</p>
			</footer>
		</section>
	);
}
