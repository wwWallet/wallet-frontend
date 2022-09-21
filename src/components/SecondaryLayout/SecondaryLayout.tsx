
import path from "path";
import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LocationProps } from "../types/LocationProps";
import walletlogo from '../../static/icons/wallet-white.png';
import eDiplomasLogo from '../../static/icons/eDiplomasLogo.svg';
import Header from '../Header';
import Footer from '../Footer';

import './SecondaryLayout.scss';
type Props = {
  children: JSX.Element
};

export const SecondaryLayout: React.FC<Props> = ({ children }: Props) => {
    const navigate = useNavigate();
    const location = useLocation();

    // if (location.pathname != '/login' && location.pathname != '/register')
    //   return (
    //       <div className="flexbox-container"> 
    //         <div className="flexbox-item flexbox-item-1">
    //           <nav className="nav">
    //             <ul className="nav__list">
    //               <li className="nav__listlogo">
    //                 <div style={{"fontWeight": "300"}} onClick={() => navigate('/')}>
    //                   eDiplomas Wallet
    //                   &nbsp;
    //                   <img className="img-logo" src={walletlogo}></img>
    //                 </div>
    //               </li>

    //               <li className="nav__listitem" >
    //                 <div style={{"fontWeight": "300"}}> <i className="fa fa-bars" aria-hidden="true" onClick={() => console.log('shit')}></i> </div>

    //                 <ul className="nav__listitemdrop">
    //                   <li onClick={() => navigate('/settings')}>Settings</li>
    //                   <li onClick={() => { localStorage.setItem('apptoken', ''); navigate('/login')}}>Logout</li>
    //                 </ul>
    //               </li>

    //             </ul>
    //           </nav>
    //         </div>
    //         <div className="flexbox-item flexbox-item-2">
    //           {children}
    //         </div>
    //       </div>
    //   );
    // else
      return (
        <React.Fragment>
          <Header />
          <div className="flexbox-container">
            <div className="flexbox-item flexbox-item-1">
              {/* <nav className="nav">
                {/* <div className="pull-left">
                  <img className="img-logo" src={eDiplomasLogo}></img>
                </div> * /}
                <ul className="nav__list">
                  <li className="nav__listlogo">
                    <div style={{"fontWeight": "300"}} onClick={() => navigate('/')}>
                      {/* eDiplomas Wallet
                      &nbsp;
                      <img className="img-logo" src={walletlogo}></img> * /}
                    </div>
                  </li>
                </ul>
              </nav> */}
            </div>
            <div className="flexbox-item flexbox-item-2">
              {children}
            </div>
          </div>
          <Footer />
        </React.Fragment>
      );
}

export default SecondaryLayout;