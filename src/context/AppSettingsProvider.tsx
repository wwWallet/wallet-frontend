import React, { useEffect, useMemo, useState } from "react";
import AppSettingsContext, { Theme, Settings } from "./AppSettingsContext";
import { useLocalStorage } from "@/hooks/useStorage";

const getSystemPref = (): "light" | "dark" =>
	typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches
		? "dark"
		: "light";

export const AppSettingsProvider = ({ children }: { children: React.ReactNode }) => {
	const [settings, setSettings] = useLocalStorage<Settings>("settings", { theme: "system" });

	// Track OS preference and react to changes
	const [systemPref, setSystemPref] = useState<"light" | "dark">(getSystemPref());

	useEffect(() => {
		if (typeof window === "undefined" || settings.theme !== "system") return;
		const mql = window.matchMedia("(prefers-color-scheme: dark)");

		const onChange = (e: MediaQueryListEvent | MediaQueryList) => {
			const matches = "matches" in e ? e.matches : mql.matches;
			setSystemPref(matches ? "dark" : "light");
		};

		onChange(mql as unknown as MediaQueryListEvent);

		if (typeof mql.addEventListener === "function") {
			mql.addEventListener("change", onChange);
		} else if (typeof (mql as any).addListener === "function") {
			// Safari < 14 fallback
			(mql as any).addListener(onChange);
		}

		return () => {
			if (typeof mql.removeEventListener === "function") {
				mql.removeEventListener("change", onChange);
			} else if (typeof (mql as any).removeListener === "function") {
				(mql as any).removeListener(onChange);
			}
		};
	}, [settings.theme]);

	const setTheme = (t: Theme) => setSettings({ ...settings, theme: t });

	const resolvedTheme: "light" | "dark" = useMemo(
		() => (settings.theme === "system" ? systemPref : settings.theme),
		[settings.theme, systemPref]
	);

	// Apply to <html>
	useEffect(() => {
		if (typeof document === "undefined") return;
		const root = document.documentElement;
		const isDark = resolvedTheme === "dark";
		root.classList.toggle("dark", isDark);      // Tailwind dark mode
		root.setAttribute("data-theme", resolvedTheme);
		root.style.colorScheme = isDark ? "dark" : "light"; // native form controls
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
