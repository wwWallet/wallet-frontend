import { createContext } from 'react';

export type ColorScheme = 'light' | 'dark' | 'system';

export type Settings = {
	colorScheme: ColorScheme;
};

export interface AppSettingsState {
	settings: Settings,
	resolvedColorScheme: 'light' | 'dark';
	setColorScheme: (t: ColorScheme) => void;
}

const AppSettingsContext = createContext<AppSettingsState>({
	settings: { colorScheme: "system" },
	resolvedColorScheme: "light",
	setColorScheme: () => { },
});

export default AppSettingsContext;
