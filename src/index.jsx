import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import ConsoleBehavior from './ConsoleBehavior';
import { StatusProvider } from './context/StatusContext';
import { initializeDataSource } from './indexedDB';
import * as offlineSW from './offlineRegistrationSW';
import * as firebaseSW from './firebase';
import Modal from 'react-modal';
import './index.css';
import { BrowserRouter } from "react-router-dom";

ConsoleBehavior();

Modal.setAppElement('#root');

ConsoleBehavior();

const RootComponent = () => {
	useEffect(() => {
		const initDB = async () => {
			try {
				await initializeDataSource();
				console.log('Database initialized');
			} catch (err) {
				console.error('Error initializing database', err);
			}
		};
		initDB();
	}, []);

	return <BrowserRouter><App /></BrowserRouter>;
};

const root = createRoot(document.getElementById('root'));
root.render(
	<StatusProvider>
		<RootComponent />
	</StatusProvider>
);

firebaseSW.register()
offlineSW.register();
