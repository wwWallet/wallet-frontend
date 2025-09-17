import { useEffect, useCallback, useState } from 'react';
import { useLocalStorage } from './useStorage';
import i18n from '../i18n';
import * as config from './../config';

type Settings = {
	locale: string | null;
	theme: 'light' | 'dark' | null;
	version: string | null;
	hidePwaPrompt: boolean | null;
};

export type AppSettings = {
	settings: Settings | null;
	updateSetting: <K extends keyof Settings>(
		key: K,
		value: Settings[K]
	) => void;
	pwaInstallable: Event | null;
	hidePwaPrompt: boolean;
	dismissPwaPrompt: () => void;
};

export const useAppSettings = () => {
	const [settings, setSettings, clearSettings] = useLocalStorage<Settings>(
		'appSettings',
		null
	);
	const [pwaInstallable, setPwaInstallable] = useState<Event | null>(null);


	const updateSetting = useCallback(
		<K extends keyof Settings>(key: K, value: Settings[K]) => {
			const next: Partial<Settings> = {
				...(settings || {}),
				[key]: value,
			};

			const cleaned = Object.fromEntries(
				Object.entries(next).filter(([_, v]) => v !== null)
			) as Settings;

			if (Object.keys(cleaned).length === 0) {
				clearSettings();
			} else {
				setSettings(cleaned);
			}
		},
		[settings, setSettings, clearSettings]
	);

	const dismissPwaPrompt = useCallback(() => {
		updateSetting('hidePwaPrompt', true);
	}, [updateSetting]);

	useEffect(() => {
		if (!settings?.version && config.APP_VERSION) {
			updateSetting('version', config.APP_VERSION);
		}
	}, [settings?.version, updateSetting]);

	useEffect(() => {
		if (settings?.locale && i18n.language !== settings.locale) {
			i18n.changeLanguage(settings.locale);
		}
	}, [settings]);

	useEffect(() => {
		// beforeinstallprompt is triggered if browser can install pwa
		// it will not trigger if pwa is already installed
		const handleBeforeInstallPrompt = (event) => {
			event.preventDefault();
			setPwaInstallable(event);
		};

		// appinstaled is triggered if pwa was installed
		// we want to remove installation prompts in that case
		const handleAppInstalled = () => {
			setPwaInstallable(null);
		};

		window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
		window.addEventListener("appinstalled", handleAppInstalled);

		return () => {
			window.removeEventListener("appinstalled", handleAppInstalled);
			window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
		};
	}, []);
	return {
		settings,
		updateSetting,
		pwaInstallable,
		hidePwaPrompt: settings?.hidePwaPrompt ?? false,
		dismissPwaPrompt,
	};
};
