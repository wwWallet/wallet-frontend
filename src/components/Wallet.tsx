import React from 'react';
import Tabs from 'react-bootstrap/Tabs';
import Tab from 'react-bootstrap/Tab';
import { useNavigate } from 'react-router-dom';
import './Wallet.css';
import Polyglot from 'node-polyglot';
import MyCredentials from './MyCredentials/MyCredentials';
import Settings from './Settings/Settings';
import VpAudit from './VpAudit/VpAudit';
import ConnectedServices from './ConnectedServices/ConnectedServices';
import IssuerList from './IssuerList/IssuerList';
import Authguard from './Authguard/Authguard';

const Wallet: React.FC<{ polyglot: Polyglot }> = ({ polyglot }) => {

	const navigate = useNavigate();

	const handleSelect = (key: string | null) => {
		if (key && key === "logout")
			logout();
	}

	const logout = () => {
		localStorage.setItem('appToken', '');
		navigate('/login');
	}

	return (
		<Tabs defaultActiveKey="credentials" id="wallet-tabs" className="mb-3" onSelect={(k) => handleSelect(k)}>
			<Tab eventKey="credentials" title={polyglot.t('Wallet.tab1.title')}>
				<MyCredentials polyglot={polyglot} />
			</Tab>
			<Tab eventKey="transactions" title={polyglot.t('Wallet.tab2.title')}>
				<VpAudit polyglot={polyglot} />
			</Tab>
			<Tab eventKey="settings" title={polyglot.t('Wallet.tab3.title')}>
				<Settings polyglot={polyglot} />
			</Tab>
			<Tab eventKey="services" title={polyglot.t('Wallet.tab4.title')}>
				<ConnectedServices polyglot={polyglot} />
			</Tab>
			<Tab eventKey="issue" title={polyglot.t('Wallet.tab5.title')}>
				<IssuerList polyglot={polyglot} />
			</Tab>
			<Tab eventKey="logout" title={polyglot.t('Wallet.logout')} />
		</Tabs>
	);
}

export default Authguard(Wallet, null);
