import { useState, useRef, useEffect } from "react";
import { BiSolidCarousel } from "react-icons/bi";
import { MdTableRows } from "react-icons/md";
import { TbCarouselVerticalFilled } from "react-icons/tb";

const viewOptions = [
	{ value: "horizontal-slider", label: "Horizontal Slider", Icon: BiSolidCarousel },
	{ value: "vertical-slider", label: "Vertical Slider", Icon: TbCarouselVerticalFilled },
	{ value: "list", label: "List", Icon: MdTableRows },
];

export default function ViewSelect({ value, onChange }) {
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

	const selected = viewOptions.find((o) => o.value === value) || viewOptions[0];

	return (
		<div className="relative inline-block text-gray-700 dark:text-white text-sm">
			<button
				id="credential-view-select"
				ref={triggerRef}
				type="button"
				onClick={() => setOpen((o) => !o)}
				className="flex items-center gap-1 px-2 py-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 hover:dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500">
				<selected.Icon className="w-5 h-5" />
				View
			</button>

			{open && (
				<div
					ref={menuRef}
					className="absolute right-0 mt-2 min-w-44 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-50"
				>
					{viewOptions.map((opt) => (
						<button
							id={`credential-view-option-${opt.value}`}
							key={opt.value}
							className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg text-left ${opt.value === value
								? "bg-primary-light text-white font-semibold"
								: "hover:bg-gray-100 dark:hover:bg-gray-700"
								}`}
							onClick={() => {
								onChange(opt.value);
								setOpen(false);
							}}
						>
							<opt.Icon className="w-5 h-5" />
							{opt.label}
						</button>
					))}
				</div>
			)}
		</div>
	);
}
