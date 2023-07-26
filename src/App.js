
// Import libraries
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// Import css file
import './App.css';
// IMport pages
import Login from './pages/Login/Login';
import Home from './pages/Home/Home';
import Issuers from './pages/Issuers/Issuers';
import History from './pages/History/History';
import NotFound from './pages/NotFound/NotFound';
import PrivateRoute from './components/PrivateRoute';
import useCheckURL from './components/useCheckURL'; // Import the custom hook

// Import i18next and set up translations
import i18n from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import enTranslation from './locales/en.json'; // Import translation files for each language
import elTranslation from './locales/el.json';

import Notification from './components/Notification';


i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslation },
      el: { translation: elTranslation }
    },
    fallbackLng: 'en', // Fallback language if the user's language is not supported
    debug: true,
    interpolation: {
      escapeValue: false // Allows you to use HTML and variables inside translations
    }
  });

	function App() {
		const url = window.location.href;
		const isValidURL = useCheckURL(url);
	

		return (
			// Wrap the app with I18nextProvider to provide translations to all components
			<I18nextProvider i18n={i18n}>
				<Router>
					<div>
						<Notification />
						<Routes>
							<Route path="/login" element={<Login />} />
							<Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
							<Route path="/history" element={<PrivateRoute><History /></PrivateRoute>} />
							<Route path="/issuers" element={<PrivateRoute><Issuers /></PrivateRoute>} />
							<Route
								path="*"
								element={
									isValidURL === null ? null : isValidURL ? (
										<PrivateRoute> <Home /></PrivateRoute>
									) : (
										<NotFound />
									)
								}
							/>
						</Routes>
					</div>
				</Router>
			</I18nextProvider>
		);
	}
	
	export default App;