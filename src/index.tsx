import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import "./index.css";
import './static/gunet/gunet.css';
import './static/gunet/Menu.css';
import 'font-awesome/css/font-awesome.min.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import './i18n/locale-en.js';
import './i18n/locale-el.js';

import { library } from "@fortawesome/fontawesome-svg-core";
import { faArrowDown, faArrowUp, faArrowLeft, faArrowRight, faBars } from '@fortawesome/free-solid-svg-icons';

library.add(faArrowDown, faArrowUp, faArrowLeft, faArrowRight, faBars);

ReactDOM.render(
  // <React.StrictMode>
    <App />,
  // </React.StrictMode>,
  document.getElementById('root')
);