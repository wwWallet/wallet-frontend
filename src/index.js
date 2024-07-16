import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import ConsoleBehavior from './ConsoleBehavior';
import './index.css';

import { initializeDataSource } from './indexedDB';

ConsoleBehavior();

const RootComponent = () => {
	useEffect(() => {
		const initDB = async () => {
			try {
				await initializeDataSource();
				console.log('Database initialized');
				// You can add further initialization logic here if needed
			} catch (err) {
				console.error('Error initializing database', err);
			}
		};
		initDB();
	}, []);

	return <App />;
};

const root = createRoot(document.getElementById('root'));
root.render(<RootComponent />);
