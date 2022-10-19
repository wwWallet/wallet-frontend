import './App.css';
import React, { useEffect, useState } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate
} from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Wallet from './components/Wallet/Wallet';
import RequestVCs from './components/RequestVCs/RequestVCs';
import Register from './components/Register/Register';
import Authz from './components/Authz/Authz';
import Login from './components/Login/Login';
import Present from './components/Present/Present';
import Settings from './components/Settings/Settings';
import Import from './components/ImportQR/ImportQR';
import Export from './components/ExportQR/ExportQR';
import Polyglot from 'node-polyglot';
import LocaleEl from './i18n/locale-el';
import LocaleEn from './i18n/locale-en';
import Consent from './components/Consent/Consent';
import Logout from './components/Logout/Logout';
import InitiateIssuance from './components/InitiateIssuance/InitiateIssuance';

const POLYGLOT: any = {
  el: new Polyglot({ phrases: LocaleEl, locale: 'el' }),
  en: new Polyglot({ phrases: LocaleEn, locale: 'en' })
};

function App() {

  const getQueryParams = () => {
    const location = window.location.toString();
    const queryStart = location.indexOf('?');
    let queryEnd = location.indexOf('#');
    const params: { [p: string]: string} = {};
    if (queryEnd < 0) {
      queryEnd = location.length;
    }
    if (queryStart >= 0) {
      const query = location.substring(queryStart + 1, queryEnd);
      const queryPairs = query.split('&');
  
      queryPairs.map((pair) => {
        const queryPair = pair.split('=');
        params[queryPair[0]] = queryPair[1];
      });
    }
    return params;
  };

  const [lang, setLang] = useState('el');

  const handleLanguage = (lang: string) => {
    if (lang !== 'el' && lang !== 'en') {
      lang = 'en';
    }
    setLang(lang);
    sessionStorage.setItem('lang', lang);
  }

  useEffect(() => {
    let lang = sessionStorage.getItem('lang');
    const queryParams = getQueryParams();
    lang = 'lang' in queryParams ? queryParams.lang : lang;
    if (lang) {
      handleLanguage(lang);
    }
  }, [])

  return (
    <Router>
      <React.Fragment>
        <Layout polyglot={POLYGLOT[lang]} handleLanguage={handleLanguage}>
          <Routes>
            <Route path='/login' element={< Login polyglot={POLYGLOT[lang]} />} />
            <Route path='/'  element={< Wallet polyglot={POLYGLOT[lang]} />} />
            <Route path='/settings'  element={< Settings polyglot={POLYGLOT[lang]}/>} />
            <Route path='/register' element={<Register polyglot={POLYGLOT[lang]}/>} />
            <Route path='/vc' element={< RequestVCs polyglot={POLYGLOT[lang]}/>}></Route>
            <Route path='/auth' element={< Authz polyglot={POLYGLOT[lang]}/>}></Route>
            <Route path='/present' element={<Present polyglot={POLYGLOT[lang]}/>}></Route>
            <Route path='/import' element={<Import polyglot={POLYGLOT[lang]}/>}></Route>
            <Route path='/export' element={<Export polyglot={POLYGLOT[lang]}/>}></Route>
						<Route path='/consent' element={<Consent lang={lang} polyglot={POLYGLOT[lang]}/>}></Route>
						<Route path='/initiate_issuance' element={<InitiateIssuance polyglot={POLYGLOT[lang]}/>}></Route>
						<Route path='/logout' element={<Logout />}></Route>
            <Route path='*' element={<Navigate to="/login" replace />} />
          </Routes>
        </Layout>
      </React.Fragment>
    </Router>
  );
}

export default App;
