// Index.jsx
// Required by @peculiar/x509 via wallet-common before tsyringe is evaluated.
import 'reflect-metadata';
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import ConsoleBehavior from './ConsoleBehavior';
import { initializeDataSource } from './indexedDB';
import Modal from 'react-modal';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import './index.css';
import { BrowserRouter } from "react-router-dom";
import AppProvider from './AppProvider';
import { startTwaDetection } from './utils/twa';

// Set root element for react-modal
Modal.setAppElement('#root');

ConsoleBehavior();

// Start listening for the TWA handshake as early as possible: the app opens the
// channel right after the first navigation completes.
startTwaDetection();

// Initialize IndexedDB BEFORE React renders
initializeDataSource()
	.then(() => console.log('Database initialized'))
	.catch((err) => console.error('Error initializing database', err));

// Create root and render app
const root = createRoot(document.getElementById('root'));
root.render(
	<BrowserRouter
		future={{
			v7_startTransition: true,
			v7_relativeSplatPath: true,
		}}
	>
		<AppProvider>
			<App />
		</AppProvider>
	</BrowserRouter>
);
