import React, { useEffect, useMemo } from "react";
import AppSettingsContext, { Theme, Settings } from "./AppSettingsContext";
import { useLocalStorage } from "@/hooks/useStorage";

const getSystemPref = (): "light" | "dark" =>
	typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches
		? "dark"
		: "light";

export const AppSettingsProvider = ({ children }: { children: React.ReactNode }) => {
	const [settings, setSettings] = useLocalStorage<Settings>("settings", { theme: "system" });

	const setTheme = (t: Theme) => setSettings({ ...settings, theme: t });

	const resolvedTheme: "light" | "dark" = useMemo(
		() => (settings.theme === "system" ? getSystemPref() : settings.theme),
		[settings.theme]
	);

	// Apply to <html>
	useEffect(() => {
		if (typeof document === "undefined") return;
		const root = document.documentElement;
		const isDark = resolvedTheme === "dark";

		root.classList.toggle("dark", isDark);
		root.setAttribute("data-theme", resolvedTheme);
		root.style.colorScheme = isDark ? "dark" : "light";
	}, [resolvedTheme]);

	const value = useMemo(
		() => ({ settings, resolvedTheme, setTheme }),
		[settings, resolvedTheme]
	);

	return (
		<AppSettingsContext.Provider value={value}>
			{children}
		</AppSettingsContext.Provider>
	);
};
