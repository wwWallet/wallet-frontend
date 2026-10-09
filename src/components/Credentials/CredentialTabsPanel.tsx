import React, { useState } from "react";
import CredentialTabs from "../../components/Credentials/CredentialTabs";
import type { CredentialTab } from "../../components/Credentials/CredentialTabs";

interface CredentialTabsPanelProps {
	tabs: readonly CredentialTab[];
	defaultTab?: number;
	contentClassName?: string;
}

const CredentialTabsPanel = ({ tabs, defaultTab = 0, contentClassName = '' }: CredentialTabsPanelProps) => {
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
