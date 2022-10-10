import React, { useState } from 'react';
import './Wallet.css';
import Polyglot from 'node-polyglot';
import MyCredentials from './MyCredentials/MyCredentials';
import Settings from './Settings/Settings';
import VpAudit from './VpAudit/VpAudit';
import ConnectedServices from './ConnectedServices/ConnectedServices';
import IssuerList from './IssuerList/IssuerList';
import Authguard from './Authguard/Authguard';
import Tab from './Tabs/Tab';
import './Tabs/Tab.css';

const Wallet: React.FC<{ polyglot: Polyglot }> = ({ polyglot }) => {

	const [activeTab, setActiveTab] = useState("credentials");
	const [activeTabText, setActiveTabText] = useState(polyglot.t('Wallet.tab1.title'));

	const changeTab = (event: any, text: string, activeTab: string) => {
		setActiveTab(activeTab);
		setActiveTabText(text);
	}

	return (
		<React.Fragment>

			{/* Horizontal Tabs */}
			<div className="tab">
				<button className={`tablinks ${(activeTab === "credentials") ? "active" : ""}`}
					onClick={(event) => changeTab(event, polyglot.t('Wallet.tab1.title'), 'credentials')}>
					{polyglot.t('Wallet.tab1.title')}
				</button>
				<button className={`tablinks ${(activeTab === "transactions") ? "active" : ""}`}
					onClick={(event) => changeTab(event, polyglot.t('Wallet.tab2.title'), 'transactions')}>
					{polyglot.t('Wallet.tab2.title')}
				</button>
				<button className={`tablinks ${(activeTab === "settings") ? "active" : ""}`}
					onClick={(event) => changeTab(event, polyglot.t('Wallet.tab3.title'), 'settings')}>
					{polyglot.t('Wallet.tab3.title')}
				</button>
				<button className={`tablinks ${(activeTab === "services") ? "active" : ""}`}
					onClick={(event) => changeTab(event, polyglot.t('Wallet.tab4.title'), 'services')}>
					{polyglot.t('Wallet.tab4.title')}
				</button>
				<button className={`tablinks ${(activeTab === "issue") ? "active" : ""}`}
					onClick={(event) => changeTab(event, polyglot.t('Wallet.tab5.title'), 'issue')}>
					{polyglot.t('Wallet.tab5.title')}
				</button>
			</div>

			{/* Bottom Tabs */}
			<div className="tab bottom-tab">
				<button className={`tablinks ${(activeTab === "credentials") ? "active" : ""}`}
					onClick={(event) => changeTab(event, polyglot.t('Wallet.tab1.title'), 'credentials')}>
					{<span className="fa fa-bookmark blue" />}
				</button>
				<button className={`tablinks ${(activeTab === "transactions") ? "active" : ""}`}
					onClick={(event) => changeTab(event, polyglot.t('Wallet.tab2.title'), 'transactions')}>
					{<span className="fa fa-clock-o blue" />}
				</button>
				<button className={`tablinks ${(activeTab === "services") ? "active" : ""}`}
					onClick={(event) => changeTab(event, polyglot.t('Wallet.tab4.title'), 'services')}>
					{<span className="fa fa-globe blue" />}
				</button>
				<button className={`tablinks ${(activeTab === "settings") ? "active" : ""}`}
					onClick={(event) => changeTab(event, polyglot.t('Wallet.tab3.title'), 'settings')}>
					{<span className="fa fa-gear blue" />}
				</button>
				<button className={`tablinks ${(activeTab === "issue") ? "active" : ""}`}
					onClick={(event) => changeTab(event, polyglot.t('Wallet.tab5.title'), 'issue')}>
					{<span className="fa fa-university blue" />}
				</button>
			</div>

			{/* Tab content */}
			<Tab tabId={"credentials"} activeId={activeTab}>
				<MyCredentials polyglot={polyglot} />
			</Tab>

			<Tab tabId={"transactions"} activeId={activeTab}>
				<VpAudit polyglot={polyglot} />
			</Tab>

			<Tab tabId={"settings"} activeId={activeTab}>
				<Settings polyglot={polyglot} />
			</Tab>

			<Tab tabId={"services"} activeId={activeTab}>
				<ConnectedServices polyglot={polyglot} />
			</Tab>

			<Tab tabId={"issue"} activeId={activeTab}>
				<IssuerList polyglot={polyglot} />
			</Tab>

		</React.Fragment>
	);
}

export default Authguard(Wallet, null);
