import React, { ReactNode, useEffect, useState } from 'react';
import { UAParser } from 'ua-parser-js';

import { useSessionStorage } from './useStorage';
import { Trans, useTranslation } from 'react-i18next';


const noWarnPlatforms = [
	{ browser: /chrome/ui, not: { os: /ios/ui } },
	{ browser: /edge/ui, not: { os: /ios/ui } },
	{ browser: /opera/ui, not: { os: /ios/ui } },
	{ browser: /brave/ui, not: { os: /ios/ui } },
];

export default function CheckBrowserSupport({
	children,
	classes,
}: {
	children: ReactNode,
	classes?: string,
}) {
	const [bypass, setBypass] = useSessionStorage('browser_warning_ack', false);
	const { t } = useTranslation();

	const userAgent = new UAParser(window.navigator.userAgent).getResult();

	const isNoWarnPlatform = (
		noWarnPlatforms.some(matcher =>
			Object.keys(matcher).every(key =>
				key === "not"
					? Object.keys(matcher[key]).every(notKey => !userAgent[notKey]?.name?.match(matcher[key][notKey]))
					: userAgent[key]?.name?.match(matcher[key])
			)
		)
	);

	if (isNoWarnPlatform || bypass) {
		return children;
	}

	return (
		<>
			<h2 className="text-l font-bold leading-tight tracking-tight text-gray-900 text-center dark:text-white">{ t('CheckBrowserSupport.heading') }</h2>

			<p>{t('CheckBrowserSupport.intro')}</p>

			<p>{t('CheckBrowserSupport.supportedList.intro')}</p>
			<ul className="ml-8 list-disc">
				<li>{t('CheckBrowserSupport.supportedList.windows')}</li>
				<li>{t('CheckBrowserSupport.supportedList.macos')}</li>
				<li>{t('CheckBrowserSupport.supportedList.android')}</li>
				<li>{t('CheckBrowserSupport.supportedList.linux')}</li>
			</ul>

			<p>
				<Trans
					i18nKey="CheckBrowserSupport.moreDetails"
					components={{
						docLink: <a
							href="https://github.com/wwWallet/wallet-frontend#prf-compatibility" target='blank_'
							className="font-medium text-custom-blue hover:underline dark:text-blue-500"
						/>
					}}
				/>
			</p>

			<p>{t('CheckBrowserSupport.outro')}</p>

			<button
				className={`w-full text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 ${classes || ""}`}
				onClick={() => setBypass(true)}
				type="button"
			>
				{t('CheckBrowserSupport.continueAnyway')}
			</button>
		</>
	);
}
