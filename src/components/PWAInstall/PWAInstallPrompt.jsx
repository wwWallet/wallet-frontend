import React from 'react';
import '@khmyznikov/pwa-install';
import { BASE_PATH } from '@/config';

const manifestUrl = `${BASE_PATH.replace(/\/?$/, '/')}manifest.json`;

const PWAInstallPrompt = () => {
	return (
		<pwa-install
			manifest-url={manifestUrl}
			use-local-storage
		/>
	);
};

export default PWAInstallPrompt;
