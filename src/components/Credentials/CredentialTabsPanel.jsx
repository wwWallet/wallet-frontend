import React, { useState } from "react";
import CredentialTabs from "../../components/Credentials/CredentialTabs";

const CredentialTabsPanel = ({ tabs, defaultTab = 0, contentClassName = '' }) => {
	const [activeTab, setActiveTab] = useState(defaultTab);

	return (
		<>
			<CredentialTabs
				tabs={tabs}
				activeTab={activeTab}
				onTabChange={setActiveTab}
			/>
			<div className={`py-2 ${contentClassName}`}>
				{tabs[activeTab].component}
			</div>
		</>
	);
};

export default CredentialTabsPanel;
