'use client'

import React from "react";
import { useTranslation } from "react-i18next";
import Dropdown, { DropdownOption } from "../Shared/Dropdown";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown } from "@fortawesome/pro-regular-svg-icons";

interface FilterSelectorProps {
    options: DropdownOption[];
	currentValue: number;
	onChange: (newValue: number) => void;
	disabled?: boolean;
	className?: string;
	verticalPosition?: "top" | "bottom";
	horizontalPosition?: "left" | "right";
	listWidthClass?: string;
}

const FilterSelector: React.FC<FilterSelectorProps> = ({
    options,
	currentValue,
	onChange,
	disabled = false,
	className,
	verticalPosition = "bottom",
	horizontalPosition = "left",
	listWidthClass="w-full",
}) => {
	const selectedOption = options.find(option => option.value === currentValue) || options[0];

	const handleSelect = (option: DropdownOption) => {
		if (typeof option.value === 'number') {
			onChange(option.value);
		}
	};

	const renderButton = (selected: DropdownOption, isOpen: boolean, setIsOpen: (isOpen: boolean) => void) => (
		<button 
			className="min-w-40 flex items-center px-4 py-2 bg-c-lm-gray-200 dark:bg-c-dm-gray-800 border border-c-lm-gray-300 dark:border-c-dm-gray-700 text-c-lm-gray-900 dark:text-c-dm-gray-100 rounded-lg outline-none focus:ring-2 focus:ring-c-lm-blue dark:focus:ring-c-dm-blue transition-all duration-200"
			onClick={() => setIsOpen(!isOpen)}
			aria-haspopup="listbox"
			data-open={isOpen}
			aria-expanded={isOpen}
		>
			<span className="flex-grow text-left">{selectedOption.label}</span>

			<FontAwesomeIcon 
			icon={faChevronDown} 
			className={`ml-6 pb-[1.5px] ${isOpen ? 'rotate-180' : ''} transition-transform duration-200`} 
			/>
		</button>
	);

	return (
		<Dropdown
			options={options}
			selectedOption={selectedOption}
			onSelect={handleSelect}
			renderButton={renderButton}
			className={className}
			verticalPosition={verticalPosition}
			horizontalPosition={horizontalPosition}
			listWidthClass={listWidthClass}
		/>
	);
};

export default FilterSelector; 