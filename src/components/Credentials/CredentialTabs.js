import React from 'react';

const CredentialTabs = ({ tabs, activeTab, onTabChange }) => {
	return (
		<div className="flex space-x-4 border-b">
			{tabs.map((tab, index) => (
				<button
					key={index}
					className={`py-2 px-4 ${activeTab === index ? 'bg-primary text-white text-primary rounded-t-lg' : 'text-primary'}`}
					onClick={() => onTabChange(index)}
				>
					{tab.label}
				</button>
			))}
		</div>
	);
};

export default CredentialTabs;
