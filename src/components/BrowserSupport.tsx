import React, { ReactNode, createContext, useContext } from 'react';
import { UAParser } from 'ua-parser-js';

import { useSessionStorage } from '../hooks/useStorage';
import { Trans, useTranslation } from 'react-i18next';

import { FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import Button from './Buttons/Button';

const noWarnPlatforms = [
	{ browser: /chrome/ui, not: { os: /ios/ui } },
	{ browser: /edge/ui, not: { os: /ios/ui } },
	{ browser: /opera/ui, not: { os: /ios/ui } },
	{ browser: /brave/ui, not: { os: /ios/ui } },
];

type ContextValue = {
	browserSupported: boolean,
	bypassWarning: boolean,
	setBypass: React.Dispatch<React.SetStateAction<boolean>>,
	showWarningPortal: boolean,
};
const BrowserSupportedContext = createContext<ContextValue>({
	browserSupported: true,
	bypassWarning: true,
	setBypass: () => { },
	showWarningPortal: false,
});

export function Ctx({ children }: { children: ReactNode }) {
	const [bypass, setBypass,] = useSessionStorage('browser_warning_ack', false);

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

	const contextValue = {
		browserSupported: isNoWarnPlatform,
		bypassWarning: bypass,
		setBypass,
		showWarningPortal: !(isNoWarnPlatform || bypass),
	};

	return (
		<BrowserSupportedContext.Provider value={contextValue}>
			{children}
		</BrowserSupportedContext.Provider>
	);
}

export function If({ children, test }: { children: ReactNode, test: (ctx: ContextValue) => boolean }) {
	const ctx = useContext(BrowserSupportedContext);
	if (test(ctx)) {
		return children;
	}
}

export function WarningPortal({
	children,
	classes,
}: {
	children: ReactNode,
	classes?: string,
}) {
	function Content({ classes }: { classes?: string }) {
		const { t } = useTranslation();
		const { setBypass } = useContext(BrowserSupportedContext);

		return (
			<>
				<h2 className="text-lg font-bold leading-tight tracking-tight text-gray-900 text-center dark:text-white">
					<FaExclamationTriangle className="text-2xl inline-block text-red-600 mr-2" />
					{t('browserSupportWarningPortal.heading')}
				</h2>

				<p className="text-sm dark:text-gray-300">{t('browserSupportWarningPortal.intro')}</p>

				<p className="text-sm dark:text-gray-300">{t('browserSupportWarningPortal.supportedList.intro')}</p>
				<ul className="ml-4 list-none text-sm">
					<li className="flex justify-start items-center" style={{ textAlign: 'left' }}>
						<div className="w-1/12">
							<FaCheckCircle className="text-md text-green-500" />
						</div>
						<div className="w-11/12 pl-1 dark:text-gray-300">
							{t('browserSupportWarningPortal.supportedList.windows')}
						</div>
					</li>
					<li className="flex justify-start items-center">
						<div className="w-1/12">
							<FaCheckCircle className="text-md text-green-500" />
						</div>
						<div className="w-11/12 pl-1 dark:text-gray-300">
							{t('browserSupportWarningPortal.supportedList.macos')}
						</div>
					</li>
					<li className="flex justify-start items-center">
						<div className="w-1/12">
							<FaCheckCircle className="text-md text-green-500" />
						</div>
						<div className="w-11/12 pl-1 dark:text-gray-300">
							{t('browserSupportWarningPortal.supportedList.android')}
						</div>
					</li>
					<li className="flex justify-start items-center">
						<div className="w-1/12">
							<FaCheckCircle className="text-md text-green-500" />
						</div>
						<div className="w-11/12 pl-1 dark:text-gray-300">
							{t('browserSupportWarningPortal.supportedList.linux')}
						</div>
					</li>
				</ul>

				<p className="text-sm dark:text-gray-300">
					<Trans
						i18nKey="browserSupportWarningPortal.moreDetails"
						components={{
							docLink: <a
								href="https://github.com/wwWallet/wallet-frontend#prf-compatibility" target='blank_'
								className="font-medium text-primary hover:underline dark:text-blue-500"
								aria-label={t('learnMoreAboutPrfCompatibilityAriaLabel')}
							/>
						}}
					/>
				</p>

				<p className="text-sm dark:text-gray-300">{t('browserSupportWarningPortal.outro')}</p>

				<Button
					onClick={() => setBypass(true)}
					additionalClassName='text-white bg-gray-300 hover:bg-gray-400 w-full'
				>
					t('browserSupportWarningPortal.continueAnyway')
				</Button>
			</>
		);
	}

	return (
		<Ctx>
			<If test={(ctx) => !ctx.showWarningPortal}>
				{children}
			</If>
			<If test={(ctx) => ctx.showWarningPortal}>
				<Content classes={classes} />
			</If>
		</Ctx>
	);
}
