'use client'

import React, { useState, useRef, useEffect, ReactNode } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck } from "@fortawesome/pro-regular-svg-icons";

export interface DropdownOption {
	value: string | number;
	label: string;
	[key: string]: any; // Allow other properties like 'name' for LanguageOption
}

interface DropdownProps {
	options: DropdownOption[];
	selectedOption: DropdownOption;
	onSelect: (option: DropdownOption) => void;
	renderButton: (selectedOption: DropdownOption, isOpen: boolean, setIsOpen: (isOpen: boolean) => void) => ReactNode;
	className?: string;
	verticalPosition?: 'top' | 'bottom';
	horizontalPosition?: 'left' | 'right' | 'center';
	listWidthClass?: string; // e.g., 'min-w-48', 'w-full'
	listMaxHeightClass?: string; // e.g., 'max-h-56'
}

const Dropdown = ({
	options,
	selectedOption,
	onSelect,
	renderButton,
	className,
	verticalPosition = 'bottom',
	horizontalPosition = 'center',
	listWidthClass = 'min-w-48',
	listMaxHeightClass = 'max-h-56'
}: DropdownProps) => {
	const [isOpen, setIsOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	const handleSelect = (option: DropdownOption) => {
		onSelect(option);
		setIsOpen(false);
	};

	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				setIsOpen(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, []);

	return (
		<div
			className={`
				relative flex
				${verticalPosition === 'top' ? 'items-start' : 'items-end'}
				${horizontalPosition === 'left' ? 'justify-start' : horizontalPosition === 'right' ? 'justify-end' : 'justify-center'}
				${className ?? ''}
			`}
			ref={dropdownRef}
		>
			<ul
				className={`
					cursor-default absolute z-10 p-1 overflow-auto rounded-lg
					bg-c-lm-gray-100 shadow-lg border border-c-lm-gray-300
					dark:bg-c-dm-gray-800 dark:border-c-dm-gray-700
					origin-bottom-center transition-all duration-150
					${listWidthClass}
					${listMaxHeightClass}
					${verticalPosition === 'top' ? 'bottom-full mb-1.5' : 'top-full mt-1.5'} // Adjusted positioning
					${isOpen ? 'opacity-100 scale-100 pointer-events-auto' : 'scale-95 opacity-0 pointer-events-none'}
				`}
				role="listbox"
			>
				{options.map((option) => (
					<li key={option.value} role="option" aria-selected={selectedOption.value === option.value}>
						<button
							type="button"
							onClick={() => handleSelect(option)}
							data-selected={selectedOption.value === option.value}
							className={`
								group relative cursor-pointer py-2 pl-3 pr-9 rounded-md w-full text-left outline-none
								text-c-lm-gray-900 dark:text-c-dm-gray-100
								${selectedOption.value === option.value ?
									'bg-c-lm-blue dark:bg-c-dm-blue text-white'
								:
									'hover:bg-c-lm-gray-300 dark:hover:bg-c-dm-gray-700 focus:bg-c-lm-gray-300 dark:focus:bg-c-dm-gray-700'
								}
							`}
						>
							<div className="flex items-center">
								<span className="block truncate">
									{option.label} { /* Use generic label */}
								</span>
							</div>

							{selectedOption.value === option.value &&
								<span className="absolute inset-y-0 right-0 flex items-center pr-3">
									<FontAwesomeIcon icon={faCheck} className="text-c-lm-gray-100" />
								</span>
							}
						</button>
					</li>
				))}
			</ul>

			{renderButton(selectedOption, isOpen, setIsOpen)}
		</div>
	);
};

export default Dropdown;
