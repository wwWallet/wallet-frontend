'use client'

import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { themeOptions, ThemeOption } from "./themes";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faChevronDown, faMoon } from "@fortawesome/pro-regular-svg-icons";
import { useTheme } from "../../context/ThemeContextProvider";
import Dropdown, { DropdownOption } from "../Shared/Dropdown";

type ThemeSelectorProps = {
	className?: string;
	verticalPosition?: 'top' | 'bottom';
	horizontalPosition?: 'left' | 'right' | 'center';
	renderThemeSelector?: (selectedTheme: ThemeOption, isOpen: boolean, setIsOpen: (isOpen: boolean) => void) => React.ReactNode;
};

const mapThemeToDropdownOption = (theme: ThemeOption): DropdownOption => ({
	value: theme.value,
	label: theme.label,
});

const ThemeSelector = ({
	className,
	verticalPosition='bottom',
	horizontalPosition='center',
	renderThemeSelector,
}: ThemeSelectorProps) => {
	const { selectedTheme, changeTheme } = useTheme();

	const handleSelectTheme = (option: DropdownOption) => {
		const newTheme = option as ThemeOption;
		changeTheme(newTheme);
	};

	const dropdownOptions = themeOptions.map(mapThemeToDropdownOption);
	const selectedDropdownOption = mapThemeToDropdownOption(selectedTheme);

	const defaultRenderButton = (selected: DropdownOption, isOpen: boolean, setIsOpen: (isOpen: boolean) => void) => (
		<button 
			className="flex items-center px-4 py-2.5 bg-c-lm-gray-200 dark:bg-c-dm-gray-800 border border-c-lm-gray-300 dark:border-c-dm-gray-700 text-c-lm-gray-900 dark:text-c-dm-gray-100 rounded-lg outline-none focus:ring-2 focus:ring-c-lm-blue dark:focus:ring-c-dm-blue transition-all duration-200"
			onClick={() => setIsOpen(!isOpen)}
			aria-haspopup="listbox"
			data-open={isOpen}
			aria-expanded={isOpen}
		>
			<FontAwesomeIcon icon={faMoon} className='mr-3' />

			<span className="flex-grow text-left">{selectedTheme.label}</span>

			<FontAwesomeIcon 
			icon={faChevronDown} 
			className={`ml-6 pb-[1.5px] ${isOpen ? 'rotate-180' : ''} transition-transform duration-200`} 
			/>
		</button>
	);

	return (
		<Dropdown
			options={dropdownOptions}
			selectedOption={selectedDropdownOption}
			onSelect={handleSelectTheme}
			renderButton={renderThemeSelector ? 
				(selected, isOpen, setIsOpen) => renderThemeSelector(selected as ThemeOption, isOpen, setIsOpen) 
				: defaultRenderButton
			}
			className={className}
			verticalPosition={verticalPosition}
			horizontalPosition={horizontalPosition}
		/>
	);
};

export default ThemeSelector;
