'use client'

import React from "react";
import { useTranslation } from "react-i18next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faGlobe } from "@fortawesome/pro-regular-svg-icons";

import { languageOptions, LanguageOption } from "./languages";

import Dropdown, { DropdownOption } from "@/components/Shared/Dropdown";

type LanguageSelectorProps = {
	className?: string;
	verticalPosition?: 'top' | 'bottom';
	horizontalPosition?: 'left' | 'right' | 'center';
	renderLanguageSelector?: (selectedLanguage: LanguageOption, isOpen: boolean, setIsOpen: (isOpen: boolean) => void) => React.ReactNode;
};

// Adapt LanguageOption to DropdownOption
const mapLanguageToDropdownOption = (lang: LanguageOption): DropdownOption => ({
	value: lang.value,
	label: lang.name, // Use name as label for dropdown list
	name: lang.name, // Keep original name property
});

const LanguageSelector = ({
	className,
	verticalPosition='bottom',
	horizontalPosition='center',
	renderLanguageSelector,
}: LanguageSelectorProps) => {
	//General
	const { i18n } = useTranslation();
	const { language } = i18n;

	// Filter language options based on resources in i18n and languageOptions
	const availableLanguages = languageOptions.filter((option) =>
		Object.keys(i18n.options.resources || {}).includes(option.value)
	);

	// Find the currently selected language option
	const selectedLanguage = availableLanguages.find(lang => lang.value === language) || availableLanguages[0];

	const handleChangeLanguage = (option: DropdownOption) => {
		// We expect option to have the structure of LanguageOption because we mapped it
		const newLanguage = option as LanguageOption;
		i18n.changeLanguage(newLanguage.value);
		localStorage.setItem("locale", newLanguage.value);
	};

	// Map available languages to dropdown options
	const dropdownOptions = availableLanguages.map(mapLanguageToDropdownOption);
	const selectedDropdownOption = mapLanguageToDropdownOption(selectedLanguage);

	// Default render button function if none provided
	const defaultRenderButton = (selected: DropdownOption, isOpen: boolean, setIsOpen: (isOpen: boolean) => void) => (
		<button 
			className="flex items-center px-4 py-2.5 bg-c-lm-gray-200 dark:bg-c-dm-gray-800 border border-c-lm-gray-300 dark:border-c-dm-gray-700 text-c-lm-gray-900 dark:text-c-dm-gray-100 rounded-lg outline-none focus:ring-2 focus:ring-c-lm-blue dark:focus:ring-c-dm-blue transition-all duration-200"
			onClick={() => setIsOpen(!isOpen)}
			aria-haspopup="listbox"
			data-open={isOpen}
			aria-expanded={isOpen}
		>
			<FontAwesomeIcon icon={faGlobe} className='mr-3' />

			<span className="flex-grow text-left">{selectedLanguage.name}</span>

			<FontAwesomeIcon 
			icon={faChevronDown} 
			className={`ml-6 pb-[1.5px] ${isOpen ? 'rotate-180' : ''} transition-transform duration-200`} 
			/>
		</button>
	);

	//Render
	return (
		<Dropdown
			options={dropdownOptions}
			selectedOption={selectedDropdownOption}
			onSelect={handleChangeLanguage}
			renderButton={renderLanguageSelector ? 
				(selected, isOpen, setIsOpen) => renderLanguageSelector(selected as LanguageOption, isOpen, setIsOpen) 
				: defaultRenderButton
			}
			className={className}
			verticalPosition={verticalPosition}
			horizontalPosition={horizontalPosition}
		/>
	);
};

export default LanguageSelector;
