import React, { useEffect, useMemo, useState } from "react";
import AppSettingsContext, { ColorScheme, Settings } from "./AppSettingsContext";
import { useLocalStorage } from "@/hooks/useStorage";

const getSystemPref = (): "light" | "dark" =>
	typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches
		? "dark"
		: "light";

export const AppSettingsProvider = ({ children }: { children: React.ReactNode }) => {
	const [settings, setSettings] = useLocalStorage<Settings>("settings", { colorScheme: "system" });

	// Track OS preference and react to changes
	const [systemPref, setSystemPref] = useState<"light" | "dark">(getSystemPref());

	useEffect(() => {
		if (typeof window === "undefined" || settings.colorScheme !== "system") return;
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
	}, [settings.colorScheme]);

	const setColorScheme = (t: ColorScheme) => setSettings({ ...settings, colorScheme: t });

	const resolvedColorScheme: "light" | "dark" = useMemo(
		() => (settings.colorScheme === "system" ? systemPref : settings.colorScheme),
		[settings.colorScheme, systemPref]
	);

	// Apply to <html>
	useEffect(() => {
		if (typeof document === "undefined") return;
		const root = document.documentElement;
		const isDark = resolvedColorScheme === "dark";
		root.classList.toggle("dark", isDark);      // Tailwind dark mode
		root.setAttribute("data-theme", resolvedColorScheme);
		root.style.colorScheme = isDark ? "dark" : "light"; // native form controls
	}, [resolvedColorScheme]);

	const value = useMemo(
		() => ({ settings, resolvedColorScheme, setColorScheme }),
		[settings, resolvedColorScheme]
	);

	return (
		<AppSettingsContext.Provider value={value}>
			{children}
		</AppSettingsContext.Provider>
	);
};
