import React from 'react';
import Tabs from 'react-bootstrap/Tabs';
import Tab from 'react-bootstrap/Tab';
import { useNavigate } from 'react-router-dom';
import './Wallet.css';
import Polyglot from 'node-polyglot';

const Wallet: React.FC<{ polyglot: Polyglot}> = ({ polyglot }) => {

	const navigate = useNavigate();

	const handleSelect = (key: string | null) => {
		if (key && key === "logout")
			logout();
		else if (key)
			navigate(key);
	}

	const logout = () => {
		localStorage.setItem('appToken', '');
		navigate('/login');
	}

	return (
		<Tabs defaultActiveKey="credentials" id="wallet-tabs" className="mb-3" onSelect={(k) => handleSelect(k)}>
			<Tab eventKey="credentials" title={polyglot.t('Wallet.tab1.title')}/>
			<Tab eventKey="transactions" title={polyglot.t('Wallet.tab2.title')}/>
			<Tab eventKey="settings" title={polyglot.t('Wallet.tab3.title')}/>
			<Tab eventKey="services" title={polyglot.t('Wallet.tab4.title')}/>
			<Tab eventKey="issue" title={polyglot.t('Wallet.tab5.title')}/>
			<Tab eventKey="logout" title={polyglot.t('Wallet.logout')}/>
		</Tabs>
	);
}

export default Wallet;
