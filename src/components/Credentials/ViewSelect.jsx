import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { BiSolidCarousel } from "react-icons/bi";
import { MdTableRows } from "react-icons/md";
import { TbCarouselVerticalFilled } from "react-icons/tb";

const viewOptions = [
	{ value: "horizontal-slider", Icon: BiSolidCarousel, labelKey: "viewSelect.options.horizontalSlider" },
	{ value: "vertical-slider", Icon: TbCarouselVerticalFilled, labelKey: "viewSelect.options.verticalSlider" },
	{ value: "list", Icon: MdTableRows, labelKey: "viewSelect.options.list" },
];

export default function ViewSelect({ value, onChange }) {
	const { t } = useTranslation();
	const [open, setOpen] = useState(false);
	const triggerRef = useRef(null);
	const menuRef = useRef(null);

	// Close on outside click
	useEffect(() => {
		if (!open) return;
		const handler = (e) => {
			if (
				triggerRef.current?.contains(e.target) ||
				menuRef.current?.contains(e.target)
			) {
				return;
			}
			setOpen(false);
		};
		document.addEventListener("mousedown", handler);
		return () => document.removeEventListener("mousedown", handler);
	}, [open]);

	const selected = viewOptions.find((o) => o.value === value) ?? viewOptions[0];
	const SelectedIcon = selected.Icon;

	return (
		<div className="relative inline-block text-gray-700 dark:text-white text-sm">
			<button
				id="credential-view-select"
				ref={triggerRef}
				type="button"
				onClick={() => setOpen((o) => !o)}
				aria-haspopup="menu"
				aria-expanded={open}
				aria-label={t("viewSelect.aria.toggle")}
				className="flex items-center gap-1 px-2 py-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 hover:dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
			>
				<SelectedIcon className="w-5 h-5" />
				{t("viewSelect.view")}
			</button>

			{open && (
				<div
					ref={menuRef}
					role="menu"
					aria-label={t("viewSelect.aria.menuLabel")}
					className="absolute right-0 mt-2 min-w-44 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-50"
				>
					{viewOptions.map((opt) => {
						const label = t(opt.labelKey);
						const Icon = opt.Icon;
						const isActive = opt.value === value;
						return (
							<button
								id={`credential-view-option-${opt.value}`}
								key={opt.value}
								role="menuitemradio"
								aria-checked={isActive}
								aria-label={t("viewSelect.aria.option", { label })}
								className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg text-left ${isActive ? "bg-primary-light text-white font-semibold" : "hover:bg-gray-100 dark:hover:bg-gray-700"
									}`}
								onClick={() => {
									onChange(opt.value);
									setOpen(false);
								}}
							>
								<Icon className="w-5 h-5" />
								{label}
							</button>
						);
					})}
				</div>
			)}
		</div>
	);
}
