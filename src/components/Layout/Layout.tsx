import React from 'react';
import Footer from '../Footer/Footer';
import Header from '../Header/Header';
import './SecondaryLayout.scss';
import Polyglot from 'node-polyglot';


type Props = {
    polyglot: Polyglot,
    handleLanguage(lang: string): void
    children: JSX.Element,
};

const Layout = ({ polyglot, handleLanguage, children }: Props) =>{

  return (
    <React.Fragment>
      <Header polyglot={polyglot} handleLanguage={handleLanguage}/>
        <div className="flexbox-container">
          {children}
        </div>
      <Footer polyglot={polyglot}/>
    </React.Fragment>
  );
}

export default Layout;