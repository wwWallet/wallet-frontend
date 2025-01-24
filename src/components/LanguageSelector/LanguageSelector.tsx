import React from "react";

import { useTranslation } from "react-i18next";
import { languageOptions } from "./languages";

type LanguageSelectorProps = {
	className?: string;
	showFullLabel?: boolean;
};

const LanguageSelector = ({
	className,
	showFullLabel = false,
}: LanguageSelectorProps) => {
	const { i18n } = useTranslation();
	const { language } = i18n;

	const handleChangeLanguage = (
		event: React.ChangeEvent<HTMLSelectElement>
	) => {
		const selectedLanguage = event.target.value;
		i18n.changeLanguage(selectedLanguage);
		localStorage.setItem("locale", selectedLanguage);
	};

	return (
		<select
			className={className}
			value={language}
			onChange={handleChangeLanguage}
		>
			{languageOptions.map((option) => (
				<option key={option.value} value={option.value}>
					{showFullLabel ? `${option.label} (${option.name})` : option.label}
				</option>
			))}
		</select>
	);
};

export default LanguageSelector;
