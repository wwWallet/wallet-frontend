import React from 'react';

const CredentialTabs = ({ tabs, activeTab, onTabChange }) => {
	return (
		<div className="flex space-x-4 border-b border-lm-gray-400 dark:border-dm-gray-600">
			{tabs.map((tab, index) => (
				<button
					id={`credential-tab-${index}`}
					key={index}
					className={`py-2 px-4 ${activeTab === index ? 'bg-lm-gray-500 dark:bg-dm-gray-500 text-lm-gray-900 dark:text-dm-gray-100 rounded-t-lg' : 'text-lm-gray-900 dark:text-dm-gray-100 cursor-pointer'}`}
					onClick={() => onTabChange(index)}
				>
					{tab.label}
				</button>
			))}
		</div>
	);
};

export default CredentialTabs;
