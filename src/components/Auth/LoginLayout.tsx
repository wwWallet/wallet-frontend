import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import * as config from '../../config';
import logo from '../../assets/images/logo.png';

export default function LoginLayout({ children, heading }: { children: React.ReactNode, heading: React.ReactNode }) {
	const { t } = useTranslation();
	return (
		<section className="bg-gray-100 dark:bg-gray-900 min-h-dvh flex flex-col">
			<div className="flex-grow flex flex-col items-center justify-center px-6 py-8">
				<a href="/" className="flex justify-center mb-6 text-2xl font-semibold text-gray-900 dark:text-white">
					<img className="w-40" src={logo} alt="logo" />
				</a>

				<h1 className="text-3xl mb-7 font-bold leading-tight tracking-tight text-gray-900 text-center dark:text-white">
					{heading}
				</h1>

				<div className="relative w-full sm:max-w-md xl:p-0">
					{children}
				</div>
			</div>

			<footer className="py-4">
				<p className="text-gray-700 dark:text-gray-400 text-center">
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
				<p className="text-gray-500 text-center dark:text-gray-400">{config.APP_VERSION}</p>
			</footer>
		</section>
	);
}
