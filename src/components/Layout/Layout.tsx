import React from 'react';
import Footer from '../Footer';
import Header from '../Header';
import '../../static/gunet/gunet.css'
import '../SecondaryLayout/SecondaryLayout.scss';


type Props = {
    polyglot: string,
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