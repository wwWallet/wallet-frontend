import React from 'react';
import Footer from '../Footer/Footer';
import Header from '../Header/Header';
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
        <div>
          {children}
        </div>
      <Footer polyglot={polyglot}/>
    </React.Fragment>
  );
}

export default Layout;