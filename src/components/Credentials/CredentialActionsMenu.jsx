import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EllipsisVertical } from 'lucide-react';

// Overflow menu beside the credential's title: a trigger, and a panel holding
// whatever actions the page puts in it. Clicking an action dismisses the panel,
// as does clicking away or pressing Escape.
const CredentialActionsMenu = ({ children }) => {
	const { t } = useTranslation();
	const [isOpen, setIsOpen] = useState(false);
	const containerRef = useRef(null);

	useEffect(() => {
		if (!isOpen) {
			return;
		}
		const closeOnOutsideClick = (event) => {
			if (!containerRef.current?.contains(event.target)) {
				setIsOpen(false);
			}
		};
		const closeOnEscape = (event) => {
			if (event.key === 'Escape') {
				setIsOpen(false);
			}
		};
		document.addEventListener('mousedown', closeOnOutsideClick);
		document.addEventListener('keydown', closeOnEscape);
		return () => {
			document.removeEventListener('mousedown', closeOnOutsideClick);
			document.removeEventListener('keydown', closeOnEscape);
		};
	}, [isOpen]);

	return (
		<div className="relative" ref={containerRef}>
			<button
				id="credential-actions-menu"
				type="button"
				onClick={() => setIsOpen((open) => !open)}
				aria-haspopup="menu"
				aria-expanded={isOpen}
				aria-label={t('common.more')}
				className="p-2 rounded-full cursor-pointer text-lm-gray-900 dark:text-dm-gray-100 hover:bg-lm-gray-300 dark:hover:bg-dm-gray-700"
			>
				<EllipsisVertical size={20} />
			</button>

			{isOpen && (
				<div
					role="menu"
					onClick={() => setIsOpen(false)}
					className="absolute right-0 z-10 mt-1 min-w-max p-2 rounded-lg shadow-lg bg-lm-gray-100 dark:bg-dm-gray-900 border border-lm-gray-400 dark:border-dm-gray-600"
				>
					{children}
				</div>
			)}
		</div>
	);
};

export default CredentialActionsMenu;
