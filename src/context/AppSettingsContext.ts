import { createContext } from 'react';

export type ColorScheme = 'light' | 'dark' | 'system';
export type MobileView = 'horizontal-slider' | 'vertical-slider' | 'list';

export type Settings = {
	colorScheme: ColorScheme;
	mobileView: MobileView;
};

export interface AppSettingsState {
	settings: Settings,
	resolvedColorScheme: 'light' | 'dark';
	setColorScheme: (t: ColorScheme) => void;
	setMobileView: (v: MobileView) => void;
}

const AppSettingsContext = createContext<AppSettingsState>({
	settings: { colorScheme: "system", mobileView: 'horizontal-slider' },
	resolvedColorScheme: "light",
	setColorScheme: () => { },
	setMobileView: () => { },
});

export default AppSettingsContext;
