import { createContext } from 'react';

export type Theme = 'light' | 'dark' | 'system';

export type Settings = {
	theme: Theme;
};

export interface AppSettingsState {
	settings: Settings,
	resolvedTheme: 'light' | 'dark';
	setTheme: (t: Theme) => void;
}

const AppSettingsContext = createContext<AppSettingsState>({
	settings: { theme: "system" },
	resolvedTheme: "light",
	setTheme: () => { },
});

export default AppSettingsContext;
