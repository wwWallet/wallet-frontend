import React, { ReactNode } from 'react';

export type SettingsTab = {
	id: string,
	label: string,
	icon: ReactNode,
};

const SettingsTabs = ({
	tabs,
	activeTab,
	onChange,
}: {
	tabs: SettingsTab[],
	activeTab: string,
	onChange: (id: string) => void,
}) => (
	<div role="tablist" className="flex space-x-4 overflow-x-auto border-b border-lm-gray-400 dark:border-dm-gray-600">
		{tabs.map((tab) => (
			<button
				key={tab.id}
				id={`settings-tab-${tab.id}`}
				type="button"
				role="tab"
				aria-selected={activeTab === tab.id}
				aria-label={tab.label}
				title={tab.label}
				onClick={() => onChange(tab.id)}
				className={`flex items-center gap-2 whitespace-nowrap px-3 sm:px-4 py-2 text-lm-gray-900 dark:text-dm-gray-100 ${activeTab === tab.id
					? 'bg-lm-gray-500 dark:bg-dm-gray-500 rounded-t-lg'
					: 'cursor-pointer'
				}`}
			>
				{tab.icon}
				<span>{tab.label}</span>
			</button>
		))}
	</div>
);

export default SettingsTabs;
