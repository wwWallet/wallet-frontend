import React from 'react';

const CredentialTabs = ({ tabs, activeTab, onTabChange }) => {
	return (
		<div className="flex space-x-4 border-b dark:border-gray-700">
			{tabs.map((tab, index) => (
				<button
					key={index}
					className={`py-2 px-4 ${activeTab === index ? 'bg-primary dark:bg-primary-light text-white rounded-t-lg' : 'text-primary dark:text-primary-light'}`}
					onClick={() => onTabChange(index)}
				>
					{tab.label}
				</button>
			))}
		</div>
	);
};

export default CredentialTabs;
