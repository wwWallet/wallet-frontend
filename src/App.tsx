import './App.css';
import React, { useEffect, useState } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate
} from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Wallet from './components/Wallet';
import RequestVCs from './components/RequestVCs';
import Register from './components/Register/Register';
import Authz from './components/Authz/Authz';
import Login from './components/Login';
import AuthGuard from './components/AuthGuard';
import Present from './components/Present';
import Settings from './components/Settings/Settings';
import DetailedVID from './components/DetailedVC/DetailedVID';
import DetailedVC from './components/DetailedVC/DetailedVC';
import Import from './components/Import';
import Export from './components/Export';
import TabTest from './TabTest';
import Polyglot from 'node-polyglot';
import LocaleEl from './i18n/locale-el';
import LocaleEn from './i18n/locale-en';

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
            <Route path='/login' element={<AuthGuard loginGuard={true}>< Login polyglot={POLYGLOT[lang]} handleLanguage={handleLanguage}/></AuthGuard>} />
            <Route path='/'  element={<AuthGuard>< Wallet polyglot={POLYGLOT[lang]} handleLanguage={handleLanguage}/></AuthGuard>} />
            <Route path='/detailed/vid/:id' element={<AuthGuard>< DetailedVID polyglot={POLYGLOT[lang]}/></AuthGuard>} />
            <Route path='/detailed/vc/:id' element={<AuthGuard>< DetailedVC /></AuthGuard>} />
            <Route path='/settings'  element={<AuthGuard>< Settings /></AuthGuard>} />
            <Route path='/register' element={<Register polyglot={POLYGLOT[lang]}/>} />
            <Route path='/test' element={<TabTest/>} />
            <Route path='/vc' element={< RequestVCs polyglot={POLYGLOT[lang]}/>}></Route>
            <Route path='/auth' element={<AuthGuard>< Authz polyglot={POLYGLOT[lang]}/></AuthGuard>}></Route>
            <Route path='/present' element={<AuthGuard><Present polyglot={POLYGLOT[lang]}/></AuthGuard>}></Route>
            <Route path='/import' element={<Import polyglot={POLYGLOT[lang]}/>}></Route>
            <Route path='*' element={<Navigate to="/login" replace />} />
          </Routes>
        </Layout>
      </React.Fragment>
    </Router>
  );
}

export default App;
