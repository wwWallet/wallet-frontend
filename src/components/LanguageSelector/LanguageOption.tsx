import React from "react";
import { useTranslation } from "react-i18next";

import Button from "../Buttons/Button";
import { languageOptions } from "./languages";

type LanguageOptionProps = {
	onClose: () => void;
};

const LanguageOption = ({ onClose }: LanguageOptionProps) => {
	const { i18n } = useTranslation();
	const { language } = i18n;

	const handleLanguageChange = (value: string) => {
		i18n.changeLanguage(value);
		onClose();
	};

	return (
		<div className="flex flex-col max-h-80 custom-scrollbar overflow-auto p-2 gap-2 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
			{languageOptions.map((lang) => (
				<Button
					key={lang.value}
					title={lang.label}
					variant="outline"
					disabled={language === lang.value}
					onClick={() => handleLanguageChange(lang.value)}
				>
					{lang.label}
				</Button>
			))}
		</div>
	);
};

export default LanguageOption;
