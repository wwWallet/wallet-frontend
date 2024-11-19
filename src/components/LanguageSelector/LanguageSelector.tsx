import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { FaLanguage } from "react-icons/fa";

import PopupLayout from "../Popups/PopupLayout";
import LanguageOption from "./LanguageOption";

type LanguageSelectorProps = {
	className: string;
	iconSize?: number;
	hasLabel: boolean;
};

const LanguageSelector = ({
	className,
	iconSize,
	hasLabel = true,
}: LanguageSelectorProps) => {
	const { t } = useTranslation();
	const [isOpenLanguageOptions, setIsOpenLanguageOptions] = useState(false);

	return (
		<>
			<button
				onClick={() => setIsOpenLanguageOptions(true)}
				className={className}
			>
				<FaLanguage size={iconSize ?? 30} />
				{hasLabel && <span>{t("language.label")}</span>}
			</button>
			<PopupLayout
				isOpen={isOpenLanguageOptions}
				onClose={() => setIsOpenLanguageOptions(false)}
			>
				<LanguageOption onClose={() => setIsOpenLanguageOptions(false)} />
			</PopupLayout>
		</>
	);
};

export default LanguageSelector;
