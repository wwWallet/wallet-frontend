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
/* RAF-lerp for smooth offset interpolation */
function useRafLerp(target, { initial, ease = 0.22, epsilon = 0.05 } = {}) {
	const [value, setValue] = useState(initial ?? target);
	const targetRef = useRef(target);
	const rafRef = useRef(null);
	useEffect(() => {
		targetRef.current = target;
		if (rafRef.current) return;
		const tick = () => {
			const v = value, t = targetRef.current;
			const next = v + (t - v) * ease;
			const done = Math.abs(next - t) < epsilon;
			setValue(done ? t : next);
			rafRef.current = done ? null : requestAnimationFrame(tick);
		};
		rafRef.current = requestAnimationFrame(tick);
		return () => {
			if (rafRef.current) cancelAnimationFrame(rafRef.current);
			rafRef.current = null;
		};
	}, [target, ease, epsilon, value]);
	return value;
}
/** Bottom-5-full compaction:
 * Gaps are indexed TOP (0) → BOTTOM (N-2).
 * - Gaps inside the last `bottomFullItems` items are FULL (1×).
 * - All earlier gaps are TINY (`tinyScale`).
 */
function makeBottomFiveScale(totalItems, { bottomFullItems = 5, tinyScale = 0.05 } = {}) {
	const gaps = Math.max(0, totalItems - 1);
	if (gaps === 0) return () => 1;
	const bottomGaps = Math.max(0, Math.min(gaps, Math.max(0, bottomFullItems - 1))); // e.g., 5 items => 4 full gaps
	const bottomStart = gaps - bottomGaps; // gap index where bottom zone starts
	return (g) => (g >= bottomStart ? 1 : tinyScale);
}
const StackPreview = ({
	items,                   // [{ vc, index }]
	cardHeight,              // desired height, clamped by ratio
	radius,
	currentOffset,
	setCurrentOffset,
	baseOffset,
	maxOffset,
	pxPerOffset = 2,
	onClick,                 // (vc, absoluteIndex) => void
	latestCredentials,
	// image ratio clamp
	originalWidth = 829,
	originalHeight = 504,
	// compaction controls
	bottomFullItems = 5,     // last 5 items with full spacing
	tinyScale = 0.05,        // scaling for all earlier gaps
	peekMinPx = 6,           // minimal visible stagger so nothing looks missing
	// compaction toggle
	compactionActive,
	setCompactionActive,
}) => {
	const containerRef = useRef(null);
	const containerW = useElementWidth(containerRef);
	const ratioHperW = originalHeight / originalWidth; // ~0.607 for 829×504
	const maxByWidth = containerW > 0 ? containerW * ratioHperW : Infinity;
	const clampedCardH = Math.min(cardHeight, maxByWidth);
	const [dragging, setDragging] = useState(false);
	const [previewOffset, setPreviewOffset] = useState(currentOffset);
	const [dragIndex, setDragIndex] = useState(null);
	const [dragDy, setDragDy] = useState(0);
	const startYRef = useRef(0);
	const startOffsetRef = useRef(currentOffset);
	const btnRefs = useRef([]);
	const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
	const handleDown = useCallback((e, i) => {
		// Prevent native click so we fully control tiny-tap vs drag
		e.preventDefault();
		try { e.currentTarget.setPointerCapture?.(e.pointerId); } catch { }
		const y = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
		startYRef.current = y;
		startOffsetRef.current = currentOffset;
		setDragging(true);
		setDragIndex(i);
		setDragDy(0);
		setPreviewOffset(currentOffset);
	}, [currentOffset]);
	const handleMove = useCallback((e) => {
		if (!dragging) return;
		const y = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
		const dy = y - startYRef.current; // +down, -up
		setDragDy(dy);
		const delta = dy / pxPerOffset;
		const nextPreview = clamp(startOffsetRef.current + delta, baseOffset, maxOffset);
		setPreviewOffset(nextPreview);
	}, [dragging, pxPerOffset, baseOffset, maxOffset]);
	const focusAndCenter = useCallback((i) => {
		const el = btnRefs.current[i];
		if (!el) return;
		try { el.focus({ preventScroll: true }); } catch { }
		el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
	}, []);
	const handleUp = useCallback(() => {
		if (!dragging) return;
		const tinyTap = Math.abs(dragDy) < 6;
		if (tinyTap && dragIndex != null) {
			const { vc, index: absIndex } = items[dragIndex];
			onClick?.(vc, absIndex); // fire parent handler (e.g., navigate or handleImageClick)
		} else {
			const draggedDown = previewOffset > startOffsetRef.current + 0.5;
			if (draggedDown) {
				// Expand uniformly and persist; disable compaction
				setCurrentOffset(previewOffset);
				setCompactionActive(false);
			} else {
				// Drag up or no increase → snap back to default with compaction
				setCurrentOffset(baseOffset);
				setPreviewOffset(baseOffset);
				setCompactionActive(true);
			}
			if (dragIndex != null) requestAnimationFrame(() => focusAndCenter(dragIndex));
		}
		setDragging(false);
		setDragIndex(null);
		setDragDy(0);
	}, [
		dragging, dragDy, dragIndex, items, onClick,
		previewOffset, setCurrentOffset, baseOffset, setCompactionActive, focusAndCenter
	]);
	const targetOffset = dragging ? previewOffset : currentOffset;
	const activeOffset = useRafLerp(targetOffset, { initial: currentOffset, ease: 0.22, epsilon: 0.05 });
	// Per-gap scale (bottom-5-full when compaction ON; all 1s when OFF)
	const scaleForGap = useMemo(() => {
		if (!compactionActive) return () => 1;
		return makeBottomFiveScale(items.length, { bottomFullItems, tinyScale });
	}, [compactionActive, items.length, bottomFullItems, tinyScale]);
	// Compute positions with a min peek to guarantee visibility
	const { tops, stackHeight } = useMemo(() => {
		if (!items.length) return { tops: [], stackHeight: 0 };
		const gaps = Math.max(0, items.length - 1);
		const steps = new Array(gaps).fill(0).map((_, g) => {
			const s = scaleForGap(g);
			return Math.max(activeOffset * s, peekMinPx); // guarantee each gap shows
		});
		const arr = new Array(items.length).fill(0);
		for (let i = 1; i < items.length; i++) {
			arr[i] = arr[i - 1] + steps[i - 1];
		}
		const height = clampedCardH + (arr[arr.length - 1] || 0);
		return { tops: arr, stackHeight: height };
	}, [items.length, activeOffset, scaleForGap, clampedCardH, peekMinPx]);
	const onKeyDown = useCallback((e, i) => {
		// Accessibility: Enter/Space activates as click
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			const { vc, index: absIndex } = items[i];
			onClick?.(vc, absIndex);
		}
	}, [items, onClick]);
	return (
		<div
			ref={containerRef}
			className="relative w-full select-none"
			style={{ height: stackHeight, touchAction: "none" }}
			onPointerMove={handleMove}
			onPointerUp={handleUp}
			onPointerCancel={handleUp}
		>
			{items.map(({ vc, index: absIndex }, i) => (
				<button
					key={`${vc?.batchId ?? "idx"}-${i}`}
					ref={(el) => (btnRefs.current[i] = el)}
					type="button"
					className={`absolute left-0 right-0 mx-auto group focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-xl ${latestCredentials.has(vc.batchId) ? 'fade-in' : ''}`}
					style={{
						transform: `translateY(${tops[i] || 0}px)`,
						zIndex: i + 1,
						width: "100%",
						willChange: "transform",
					}}
					onPointerDown={(e) => handleDown(e, i)}
					onKeyDown={(e) => onKeyDown(e, i)}
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
const CredentialsStackCollapsed = ({
	items,                    // array of vc entities (plain)
	onClick,                  // (vc, absoluteIndex) => void
	latestCredentials,
	height = 220,
	offset = 36,              // base offset (snap target on drag-up)
	maxOffset = 120,          // cap for expanded uniform offset
	radius = 24,
	className = "",
	pxPerOffset = 2,
	// native image size for correct clamp
	originalWidth = 829,
	originalHeight = 504,
	// compaction defaults
	bottomFullItems = 5,      // last 5 items use full spacing
	tinyScale = 0.05,         // top region scaling
	peekMinPx = 6,            // min visible stagger
}) => {
	const [currentOffset, setCurrentOffset] = useState(offset);
	// Show ALL items; keep original indexes for callbacks
	const all = useMemo(
		() => items.map((vc, index) => ({ vc, index })),
		[items]
	);
	// Compaction ON by default if there are more than bottomFullItems
	const [compactionActive, setCompactionActive] = useState(items.length > bottomFullItems);
	useEffect(() => {
		setCompactionActive(items.length > bottomFullItems);
	}, [items.length, bottomFullItems]);
	if (!all.length) return null;
	return (
		<div className={`relative w-full ${className}`}>
			<StackPreview
				items={all} // show ALL items
				cardHeight={height}
				radius={radius}
				currentOffset={currentOffset}
				latestCredentials={latestCredentials}
				setCurrentOffset={(next) => setCurrentOffset(Math.min(next, maxOffset))}
				baseOffset={offset}
				maxOffset={maxOffset}
				pxPerOffset={pxPerOffset}
				onClick={onClick}
				originalWidth={originalWidth}
				originalHeight={originalHeight}
				bottomFullItems={bottomFullItems}
				tinyScale={tinyScale}
				peekMinPx={peekMinPx}
				compactionActive={compactionActive}
				setCompactionActive={setCompactionActive}
			/>
		</div>
	);
};
export default CredentialsStackCollapsed;
