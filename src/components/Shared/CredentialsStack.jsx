import React, { useState, useMemo, useRef, useCallback, useEffect } from "react";
import CredentialImage from "@/components/Credentials/CredentialImage";

/* Observe an element’s width (for height clamping by image ratio) */
function useElementWidth(ref) {
	const [w, setW] = useState(0);
	useEffect(() => {
		if (!ref.current) return;
		const ro = new ResizeObserver(([entry]) => {
			const box = entry.contentBoxSize?.[0] || entry.contentRect;
			setW((box?.inlineSize ?? box?.width) || ref.current.clientWidth || 0);
		});
		ro.observe(ref.current);
		return () => ro.disconnect();
	}, [ref]);
	return w;
}

const StackPreview = ({
	items,                   // [{ vc, index }]
	cardHeight,              // desired height, clamped by ratio
	radius,
	offsetPx,                // uniform offset in px for ALL gaps
	onClick,                 // (vc, absoluteIndex) => void
	latestCredentials,
	// image ratio clamp
	originalWidth = 829,
	originalHeight = 504,
}) => {
	const containerRef = useRef(null);
	const btnRefs = useRef([]);
	const containerW = useElementWidth(containerRef);

	// Clamp card height by container width and native image ratio (no taller than ratio would allow)
	const ratioHperW = originalHeight / originalWidth; // ~0.607 for 829×504
	const maxByWidth = containerW > 0 ? containerW * ratioHperW : Infinity;
	const clampedCardH = Math.min(cardHeight, maxByWidth);

	// Uniform positions
	const tops = useMemo(
		() => items.map((_, i) => i * offsetPx),
		[items, offsetPx]
	);

	const stackHeight = items.length
		? clampedCardH + (items.length - 1) * offsetPx
		: 0;

	const handleClick = useCallback((i) => {
		const el = btnRefs.current[i];
		// focus + center on click
		if (el) {
			try { el.focus({ preventScroll: true }); } catch { }
			el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
		}
		const { vc, index: absIndex } = items[i];
		onClick?.(vc, absIndex);
	}, [items, onClick]);

	if (!items.length) return null;

	return (
		<div
			ref={containerRef}
			className="relative w-full"
			style={{ height: stackHeight }}
		>
			{items.map(({ vc, index: absIndex }, i) => (
				<button
					key={`${vc?.batchId ?? "idx"}-${i}`}
					ref={(el) => (btnRefs.current[i] = el)}
					type="button"
					className={`absolute left-0 right-0 mx-auto group focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-xl ${latestCredentials.has(vc.batchId) ? 'fade-in' : ''}`}
					style={{
						transform: `translateY(${tops[i]}px)`,
						zIndex: i + 1,
						width: "100%",
						willChange: "transform",
					}}
					onClick={() => handleClick(i)}
					aria-label={`Open credential ${i + 1}`}
				>
					<div
						className="relative overflow-hidden shadow-xl ring-1 ring-gray-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900 transition-transform duration-200 group-hover:-translate-y-0.5"
						style={{ height: clampedCardH, borderRadius: radius }}
					>
						<CredentialImage vcEntity={vc} className="h-full w-full object-cover object-top" />
					</div>
				</button>
			))}
		</div>
	);
};

const CredentialsStack = ({
	items,                    // array of vc entities (plain)
	onClick,                  // (vc, absoluteIndex) => void
	height = 220,             // desired card height (will clamp by ratio)
	offset = 36,              // UNIFORM gap for ALL cards
	radius = 24,
	latestCredentials,
	className = "",

	// native image size for correct clamp
	originalWidth = 829,
	originalHeight = 504,
}) => {
	// Show ALL items; keep original indexes for callbacks
	const all = useMemo(
		() => (items || []).map((vc, index) => ({ vc, index })),
		[items]
	);

	if (!all.length) return null;

	return (
		<div className={`relative w-full ${className}`}>
			<StackPreview
				items={all}                 // show ALL items
				cardHeight={height}
				radius={radius}
				offsetPx={offset}           // uniform offset
				onClick={onClick}
				latestCredentials={latestCredentials}
				originalWidth={originalWidth}
				originalHeight={originalHeight}
			/>
		</div>
	);
};

export default CredentialsStack;
