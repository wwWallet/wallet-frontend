import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import ConsoleBehavior from './ConsoleBehavior';
import { OnlineStatusProvider } from './context/OnlineStatusContext';
import { initializeDataSource } from './indexedDB';
import './index.css';

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
root.render(
	<OnlineStatusProvider>
		<RootComponent />
	</OnlineStatusProvider>
);
