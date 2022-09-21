import React from 'react';
import '../static/style/Header.css';
import '../static/style/Gunet.css';
import eDiplomasLogo from '../static/icons/eDiplomasLogo.svg'
import walletLogo from '../static/icons/digital-wallet.png'
import LanguageSwitch from './LanguageSwitch';

export default (props) => {

  return (
    <React.Fragment>
      <div className='Header'>
        <LanguageSwitch
          polyglot={props.polyglot}
          handleLanguage={props.handleLanguage}
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
                  <span className="logo-text">{props.polyglot.t('Header.title')}</span>
                </span>
                <span className="logo-split"></span>
                <img className="img-wallet" id="img-wallet" src={walletLogo}></img>
              </span>
            </a>
          </div>
        </div>
        <div id="subtitle" style={{"marginLeft": "2%"}}>
          <span>{props.polyglot.t('Header.description')}</span>
        </div>
        <div className='header-border'></div>
      </div>
    </React.Fragment>
  )
}