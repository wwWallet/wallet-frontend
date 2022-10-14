import React from 'react';
import './Header.css';
import './Ribbon.css';
import eDiplomasLogo from '../../static/icons/eDiplomasLogo.svg'
import walletLogo from '../../static/icons/digital-wallet.png'
import LanguageSwitch from '../LanguageSwitch/LanguageSwitch';
import Polyglot from 'node-polyglot';
import LogoutIcon from '../Logout/LogoutIcon';

const Header: React.FC<{ polyglot: Polyglot, handleLanguage(lang: string): void }> = ({ polyglot, handleLanguage }) => {

	return (
		<div className='Header'>
			<LanguageSwitch
				polyglot={polyglot}
				handleLanguage={handleLanguage}
			/>
			<div className="ribbon">
				<a className="ribbonText" href="#">
					EBSI DEMO
				</a>
			</div>
			<div className='header-content'>
				<div className='anchor-div'>
					<a href={'/'}>
						<span className="logo-area">
							<span id='eDiplomasLogo'>
								<img className="img-logo" src={eDiplomasLogo}></img>
								<span className="logo-text">{polyglot.t('Header.title')}</span>
							</span>
							<span className="logo-split"></span>
							<img className="img-wallet" id="img-wallet" src={walletLogo}></img>
						</span>
					</a>
				</div>
			</div>
			<div id="subtitle">
				<span>{polyglot.t('Header.description')}</span>
				<LogoutIcon />
			</div>
			<div className='header-border'></div>
		</div>
	);
}

export default Header;