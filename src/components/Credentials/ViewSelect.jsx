import { useState, useRef, useEffect } from "react";
import { BiSolidCarousel } from "react-icons/bi";
import Stack from "@/assets/icons/stack.svg?react";
import StackExp from "@/assets/icons/stack_exp.svg?react";
import List from "@/assets/icons/list.svg?react";

const viewOptions = [
	{ value: "slider", label: "Slider", Icon: BiSolidCarousel },
	{ value: "stacked", label: "Stacked", Icon: Stack },
	{ value: "stacked flex", label: "Expandable Stack", Icon: StackExp },
	{ value: "list", label: "List", Icon: List },
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
		<div className="relative inline-block">
			<button
				ref={triggerRef}
				type="button"
				onClick={() => setOpen((o) => !o)}
				className="flex items-center gap-1 px-2 py-1 rounded-lg border shadow-sm text-smhover:bg-gray-50 dark:hover:bg-gray-800">
				{/* Selected icon (left) */}
				<selected.Icon className="w-5 h-5" />
				{/* Always show "View" */}
				View
				{/* Caret */}
				<svg className="w-4 h-4 ml-1" viewBox="0 0 20 20">
					<path
						d="M5.5 7.5l4.5 4.5 4.5-4.5"
						stroke="currentColor"
						strokeWidth="2"
						fill="none"
					/>
				</svg>
			</button>

			{open && (
				<div
					ref={menuRef}
					className="absolute right-0 mt-2 min-w-44 rounded-lg border bg-white dark:bg-gray-900 shadow-lg z-50"
				>
					{viewOptions.map((opt) => (
						<button
							key={opt.value}
							className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-left ${opt.value === value
								? "bg-primary-light text-white font-semibold"
								: "hover:bg-gray-100 dark:hover:bg-gray-800"
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
