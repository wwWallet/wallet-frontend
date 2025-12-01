import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Button from "../Buttons/Button";
import { GalleryHorizontal, GalleryVertical, Rows2 } from "lucide-react";

const viewOptions = [
	{ value: "horizontal-slider", Icon: GalleryHorizontal, labelKey: "viewSelect.options.horizontalSlider" },
	{ value: "vertical-slider", Icon: GalleryVertical, labelKey: "viewSelect.options.verticalSlider" },
	{ value: "list", Icon: Rows2, labelKey: "viewSelect.options.list" },
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
		<div className="relative inline-block text-lm-gray-900 dark:text-dm-gray-100 text-sm">
			<Button
				id="credential-view-select"
				ref={triggerRef}
				type="button"
				variant="outline"
				size="sm"
				onClick={() => setOpen((o) => !o)}
				aria-haspopup="menu"
				aria-expanded={open}
				aria-label={t("viewSelect.aria.toggle")}
			>
				<SelectedIcon className="w-5 h-5" />
				{t("viewSelect.view")}
			</Button>

			{open && (
				<div
					ref={menuRef}
					role="menu"
					aria-label={t("viewSelect.aria.menuLabel")}
					className="absolute right-0 mt-2 min-w-48 border border-lm-gray-400 dark:border-dm-gray-600 bg-lm-gray-100 dark:bg-dm-gray-900 rounded-lg shadow-lg z-50"
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
								className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg text-left ${isActive ? "bg-primary  text-white font-semibold" : "hover:bg-lm-gray-400 dark:hover:bg-dm-gray-600"
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
