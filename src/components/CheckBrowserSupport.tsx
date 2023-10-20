import React, { ReactNode, useEffect, useState } from 'react';
import { UAParser } from 'ua-parser-js';

import { useSessionStorage } from './useStorage';
import { Trans, useTranslation } from 'react-i18next';

import { FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';

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
			<h2 className="text-lg font-bold leading-tight tracking-tight text-gray-900 text-center dark:text-white">
				<FaExclamationTriangle className="text-2xl inline-block text-red-600 mr-2" /> 
				{ t('CheckBrowserSupport.heading') }
			</h2>

			<p className="text-sm">{t('CheckBrowserSupport.intro')}</p>

			<p className="text-sm">{t('CheckBrowserSupport.supportedList.intro')}</p>
			<ul className="ml-4 list-none text-sm">
				<li className="flex justify-start items-center" style={{ textAlign: 'left' }}>
						<div className="w-1/12">
								<FaCheckCircle className="text-md text-green-500" />
						</div>
						<div className="w-11/12 pl-1"> 
								{t('CheckBrowserSupport.supportedList.windows')}
						</div>
				</li>
				<li className="flex justify-start items-center">
						<div className="w-1/12">
								<FaCheckCircle className="text-md text-green-500" />
						</div>
						<div className="w-11/12 pl-1">
								{t('CheckBrowserSupport.supportedList.macos')}
						</div>
				</li>
				<li className="flex justify-start items-center">
				<div className="w-1/12">
								<FaCheckCircle className="text-md text-green-500" />
						</div>
						<div className="w-11/12 pl-1">
								{t('CheckBrowserSupport.supportedList.android')}
						</div>
				</li>
				<li className="flex justify-start items-center">
				<div className="w-1/12">
								<FaCheckCircle className="text-md text-green-500" />
						</div>
						<div className="w-11/12 pl-1">
								{t('CheckBrowserSupport.supportedList.linux')}
						</div>
				</li>
			</ul>

			<p className="text-sm">
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

			<p className="text-sm">{t('CheckBrowserSupport.outro')}</p>

			<button
				className={`w-full text-white bg-gray-300 hover:bg-gray-400 focus:ring-4 focus:outline-none focus:ring-gray-400 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-gray-300 dark:hover:bg-gray-400 dark:focus:ring-gray-400 ${classes || ""}`}
				onClick={() => setBypass(true)}
				type="button"
			>
				{t('CheckBrowserSupport.continueAnyway')}
			</button>
		</>
	);
}
