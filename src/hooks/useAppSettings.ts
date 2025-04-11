import { useEffect } from 'react';
import { useLocalStorage } from './useStorage';
import i18n from '../i18n';
import * as config from './../config';

type Settings = {
	locale: string | null;
	theme: 'light' | 'dark' | null;
	version: string | null;
};

export type AppSettings = {
	Settings: Settings | null;
	updateSetting: <K extends keyof Settings>(
		key: K,
		value: Settings[K]
	) => void;
};

export const useAppSettings = () => {
	const [settings, setSettings, clearSettings] = useLocalStorage<Settings>(
		'appSettings',
		null
	);

	// Initialize version if missing
	useEffect(() => {
		if (!settings?.version && config.APP_VERSION) {
			updateSetting('version', config.APP_VERSION);
		}
	}, [settings?.version]);

	useEffect(() => {
		if (settings?.locale && i18n.language !== settings.locale) {
			i18n.changeLanguage(settings.locale);
		}
	}, [settings]);

	const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
		const next: Partial<Settings> = {
			...(settings || {}),
			[key]: value,
		};

		// Remove all keys with null values
		const cleaned = Object.fromEntries(
			Object.entries(next).filter(([_, v]) => v !== null)
		) as Settings;

		if (Object.keys(cleaned).length === 0) {
			clearSettings();
		} else {
			setSettings(cleaned);
		}
	};


	return {
		settings,
		updateSetting,
	};
};
