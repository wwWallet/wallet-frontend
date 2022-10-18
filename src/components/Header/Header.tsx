import React from 'react';
import './Header.css';
import './Ribbon.css';
import eDiplomasLogo from '../../static/icons/eDiplomasLogo.svg'
// import walletLogo from '../../static/icons/digital-wallet.png'
import LanguageSwitch from '../LanguageSwitch/LanguageSwitch';
import Polyglot from 'node-polyglot';
import LogoutIcon from '../Logout/LogoutIcon';

const Header: React.FC<{ polyglot: Polyglot, handleLanguage(lang: string): void }> = ({ polyglot, handleLanguage }) => {

	return (
		<div className='Header'>
			<div className='header-container'>
				<div className='header-content'>
					<div className='anchor-div'>
						<a href={'/'}>
							<div className="logo-area">
									<img className="img-logo" src={eDiplomasLogo}></img>
									<span className="logo-text">{polyglot.t('Header.title')}</span>
								{/* <img className="img-wallet" id="img-wallet" src={walletLogo}></img> */}
							</div>
						</a>
					</div>
				</div>
				<div className="right-area">
					<div className="ribbon">
						<a className="ribbonText" onClick={() => { }}>
							EBSI DEMO
						</a>
					</div>
					<div className="header-actions">
						<LogoutIcon />
						<LanguageSwitch
							polyglot={polyglot}
							handleLanguage={handleLanguage}
						/>
					</div>
				</div>
			</div>
			<div id="subtitle">
				<span>{polyglot.t('Header.description')}</span>
			</div>
			<div className='header-border'></div>
		</div>
	);
}

export default Header;