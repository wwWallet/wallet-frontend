// Index.jsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import ConsoleBehavior from './ConsoleBehavior';
import { initializeDataSource } from './indexedDB';
import * as firebaseSW from './firebase';
import Modal from 'react-modal';
import './index.css';
import { BrowserRouter } from "react-router-dom";
import AppProvider from './AppProvider';

// Set root element for react-modal
Modal.setAppElement('#root');

ConsoleBehavior();

// Initialize IndexedDB BEFORE React renders
initializeDataSource()
	.then(() => console.log('Database initialized'))
	.catch((err) => console.error('Error initializing database', err));

// Create root and render app
const root = createRoot(document.getElementById('root'));
root.render(
	<BrowserRouter>
		<AppProvider>
			<App />
		</AppProvider>
	</BrowserRouter>
);

firebaseSW.register()
