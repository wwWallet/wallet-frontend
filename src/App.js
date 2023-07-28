
// Import libraries
import React, { useEffect } from 'react';
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

// Check that service workers are supported
if ('serviceWorker' in navigator) {
  // Use window load event to keep the page load performant
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/firebase-messaging-sw.js')
      .then(registration => {
        console.log('Service Worker registered! Scope is: ', registration.scope);
      })
      .catch(err => {
        console.log('Service Worker registration failed: ', err);
      });
  });
}

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
	
		useEffect(() => {
			// Add a message event listener to receive messages from the service worker
			navigator.serviceWorker.addEventListener('message', handleMessage);
	
			// Clean up the event listener when the component unmounts
			return () => {
				navigator.serviceWorker.removeEventListener('message', handleMessage);
			};
		}, []);
	
		// Handle messages received from the service worker
		const handleMessage = (event) => {

			console.log('handle ulr from app')
			if (event.data.type === 'navigate') {
				// Redirect the current tab to the specified URL
				window.location.href = event.data.url;
			}
		};

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