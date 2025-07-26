import React, { useContext } from "react";

import { useTranslation } from "react-i18next";
import { languageOptions } from "./languages";
import { IoIosArrowDown } from "react-icons/io";
import StatusContext from "@/context/StatusContext";

type LanguageSelectorProps = {
	className?: string;
	showName?: boolean;
};

const LanguageSelector = ({
	className,
	showName = false,
}: LanguageSelectorProps) => {
	const { i18n, t } = useTranslation();
	const { appSettings } = useContext(StatusContext);

	const selectedLocale = appSettings.Settings?.locale ?? i18n.language;

	// Filter language options based on resources in i18n and languageOptions
	const availableLanguages = languageOptions.filter((option) =>
		Object.keys(i18n.options.resources || {}).includes(option.value)
	);

	const handleChangeLanguage = (
		event: React.ChangeEvent<HTMLSelectElement>
	) => {
		const selectedLanguage = event.target.value;
		appSettings.updateSetting('locale', selectedLanguage);
	};

	// If only one language and showName is true, show it as static text
	if (availableLanguages.length === 1 && showName) {
		const selectedLanguage = availableLanguages[0];
		return (
			<div className={className}>
				{selectedLanguage.label} ({selectedLanguage.name})
			</div>
		);

		// Render dropdown for multiple languages
	} else if (availableLanguages.length > 1) {
		return (
			<div className={`relative`}>
				<select
					className={className}
					value={selectedLocale}
					onChange={handleChangeLanguage}
					aria-label={t("language.label")}
				>
					{availableLanguages.map((option) => (
						<option key={option.value} value={option.value}>
							{showName ? `${option.label} (${option.name})` : option.label}
						</option>
					))}
				</select>
				<span className="absolute top-1/2 right-2 transform -translate-y-[43%] pointer-events-none">
					<IoIosArrowDown className="dark:text-white" />
				</span>
			</div>
		);
	} else {
		return null;
	}
};

export default LanguageSelector;
