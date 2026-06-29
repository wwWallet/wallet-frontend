import React, { ReactNode, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';

export type SettingsTab = {
	id: string,
	label: string,
	icon: ReactNode,
};

// Matches the `gap-4` spacing between tabs.
const TAB_GAP_PX = 16;

const MIN_VISIBLE_TABS = 1;

// "More" shouldn't ever hold just one tab.
const MIN_OVERFLOW_TABS = 2;

const tabButtonClassName = (isActive: boolean) => (
	`flex items-center gap-2 min-w-0 px-3 sm:px-4 py-2 text-lm-gray-900 dark:text-dm-gray-100 ${isActive
		? 'bg-lm-gray-500 dark:bg-dm-gray-500 rounded-t-lg'
		: 'cursor-pointer'
	}`
);

// `truncate` is a no-op until something constrains width, so it's safe to
// reuse this for the unconstrained offscreen measurement copies too.
const TabContent = ({ tab }: { tab: SettingsTab }) => (
	<>
		<span className="shrink-0">{tab.icon}</span>
		<span className="truncate min-w-0">{tab.label}</span>
	</>
);

const SettingsTabs = ({
	tabs,
	activeTab,
	onChange,
}: {
	tabs: SettingsTab[],
	activeTab: string,
	onChange: (id: string) => void,
}) => {
	const { t } = useTranslation();
	const overflowPanelId = useId();

	const moreContent = (
		<>
			<span className="truncate min-w-0">{t('common.more')}</span>
			<ChevronDown size={16} className="shrink-0" />
		</>
	);

	const containerRef = useRef<HTMLDivElement>(null);
	const measureRefs = useRef<(HTMLButtonElement | null)[]>([]);
	const measureMoreRef = useRef<HTMLButtonElement>(null);
	const menuRef = useRef<HTMLDivElement>(null);
	const [visibleCount, setVisibleCount] = useState(tabs.length);
	const [menuOpen, setMenuOpen] = useState(false);

	useLayoutEffect(() => {
		const container = containerRef.current;
		if (!container) {
			return;
		}

		const recalculate = () => {
			const containerWidth = container.clientWidth;
			const widths = measureRefs.current.map((el) => el?.offsetWidth ?? 0);
			const moreWidth = measureMoreRef.current?.offsetWidth ?? 0;

			let count = tabs.length;
			let total = 0;
			for (let i = 0; i < widths.length; i++) {
				total += widths[i] + (i > 0 ? TAB_GAP_PX : 0);
				const hasOverflow = i < tabs.length - 1;
				const widthIncludingMore = hasOverflow ? total + TAB_GAP_PX + moreWidth : total;
				if (widthIncludingMore > containerWidth) {
					count = i;
					break;
				}
			}
			const minVisible = Math.min(MIN_VISIBLE_TABS, tabs.length);
			count = Math.max(count, minVisible);

			const overflow = tabs.length - count;
			if (overflow > 0 && overflow < MIN_OVERFLOW_TABS) {
				count = Math.max(count - (MIN_OVERFLOW_TABS - overflow), minVisible);
			}

			setVisibleCount(count);
		};

		recalculate();

		const resizeObserver = new ResizeObserver(recalculate);
		resizeObserver.observe(container);
		return () => resizeObserver.disconnect();
	}, [tabs]);

	useEffect(() => {
		if (!menuOpen) {
			return;
		}
		const handler = (e: MouseEvent) => {
			if (menuRef.current?.contains(e.target as Node)) {
				return;
			}
			setMenuOpen(false);
		};
		document.addEventListener('mousedown', handler);
		return () => document.removeEventListener('mousedown', handler);
	}, [menuOpen]);

	const visibleTabs = tabs.slice(0, visibleCount);
	const overflowTabs = tabs.slice(visibleCount);

	// Keep the active tab out of "More", swapping it with the last visible tab.
	const activeOverflowIndex = overflowTabs.findIndex((tab) => tab.id === activeTab);
	if (activeOverflowIndex !== -1 && visibleTabs.length > 0) {
		const [activeTabObj] = overflowTabs.splice(activeOverflowIndex, 1);
		const displacedTab = visibleTabs.pop();
		overflowTabs.unshift(displacedTab);
		visibleTabs.unshift(activeTabObj);
	}

	const isOverflowActive = overflowTabs.some((tab) => tab.id === activeTab);
	const overflowTabIds = overflowTabs.map((tab) => `settings-tab-${tab.id}`).join(' ');

	return (
		<div ref={containerRef} className="relative flex items-end gap-4 border-b border-lm-gray-400 dark:border-dm-gray-600">
			<div
				role="tablist"
				aria-owns={menuOpen && overflowTabIds ? overflowTabIds : undefined}
				className="flex items-end gap-4 min-w-0"
			>
				{visibleTabs.map((tab) => (
					<button
						key={tab.id}
						id={`settings-tab-${tab.id}`}
						type="button"
						role="tab"
						aria-selected={activeTab === tab.id}
						aria-label={tab.label}
						title={tab.label}
						onClick={() => onChange(tab.id)}
						className={tabButtonClassName(activeTab === tab.id)}
					>
						<TabContent tab={tab} />
					</button>
				))}
			</div>

			{overflowTabs.length > 0 && (
				<div ref={menuRef} className="relative min-w-0">
					<button
						type="button"
						onClick={() => setMenuOpen((open) => !open)}
						aria-expanded={menuOpen}
						aria-controls={overflowPanelId}
						aria-label={t('common.more')}
						title={t('common.more')}
						className={`w-full ${tabButtonClassName(isOverflowActive)}`}
					>
						{moreContent}
					</button>

					{menuOpen && (
						<div
							id={overflowPanelId}
							className="absolute right-0 mt-1 min-w-40 border border-lm-gray-400 dark:border-dm-gray-600 bg-lm-gray-100 dark:bg-dm-gray-900 rounded-lg shadow-lg z-50"
						>
							{overflowTabs.map((tab) => (
								<button
									key={tab.id}
									id={`settings-tab-${tab.id}`}
									type="button"
									role="tab"
									aria-selected={activeTab === tab.id}
									aria-label={tab.label}
									title={tab.label}
									onClick={() => {
										onChange(tab.id);
										setMenuOpen(false);
									}}
									className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg text-left whitespace-nowrap ${activeTab === tab.id
										? 'bg-primary text-white font-semibold'
										: 'hover:bg-lm-gray-400 dark:hover:bg-dm-gray-600'
									}`}
								>
									{tab.icon}
									<span>{tab.label}</span>
								</button>
							))}
						</div>
					)}
				</div>
			)}

			<div aria-hidden className="absolute top-0 left-0 flex gap-4 invisible -z-10 scale-0 pointer-events-none">
				{tabs.map((tab, i) => (
					<button
						key={tab.id}
						ref={(el) => { measureRefs.current[i] = el; }}
						type="button"
						tabIndex={-1}
						className={tabButtonClassName(activeTab === tab.id)}
					>
						<TabContent tab={tab} />
					</button>
				))}
				<button ref={measureMoreRef} type="button" tabIndex={-1} className={tabButtonClassName(false)}>
					{moreContent}
				</button>
			</div>
		</div>
	);
};

export default SettingsTabs;
