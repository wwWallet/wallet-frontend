import React from 'react';
import * as config from '../../config';
import Logo from '../Logo/Logo';
import PWAInstallPrompt from '../PWAInstall/PWAInstallPrompt';
import useScreenType from '@/hooks/useScreenType';
import PoweredBy from '../Shared/PoweredBy';
import LanguageSelector from '../LanguageSelector/LanguageSelector';

export default function AuthPageLayout({ children, heading }: { children: React.ReactNode, heading: React.ReactNode }) {
	const screenType = useScreenType();

	return (
		<section className="bg-lm-gray-100 dark:bg-dm-gray-900 min-h-dvh flex flex-col">
			{config.SHOW_PWA_INSTALL_PROMPT && screenType !== 'desktop' && (
				<PWAInstallPrompt />
			)}

			<div className="grow flex flex-col items-center justify-center px-6 py-8">
				<Logo aClassName='mb-2' imgClassName='w-20' />

				<div className="mb-5 text-center">
					<h1 className="text-3xl mb-2 font-bold leading-tight tracking-tight text-lm-gray-900 dark:text-white">
						{heading}
					</h1>

					{config.WALLET_TAGLINE && (
						<p className="text-sm mb-2 text-lm-gray-700 dark:text-dm-gray-300">
							{config.WALLET_TAGLINE}
						</p>
					)}
				</div>

				<div className="relative w-full sm:max-w-md xl:p-0">
					{children}
				</div>

				{config.SHOW_PWA_INSTALL_PROMPT && screenType === 'desktop' && (
					<PWAInstallPrompt />
				)}
			</div>

			<footer className="py-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-1">
				<LanguageSelector className='[field-sizing:content] pr-7 text-sm text-lm-gray-800 dark:text-dm-gray-200 cursor-pointer bg-lm-gray-100 dark:bg-dm-gray-900 appearance-none' showName />
				<PoweredBy
					className="text-sm text-lm-gray-800 dark:text-dm-gray-200 text-center"
					linkClassName="underline font-semibold text-lm-gray-800 dark:text-dm-gray-300"
				/>
				<p className="hidden">v{config.APP_VERSION}</p>
			</footer>
		</section>
	);
}
