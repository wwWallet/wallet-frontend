import React from 'react';
import '@khmyznikov/pwa-install';
import { BASE_PATH } from '@/config';

const basePath = BASE_PATH.replace(/\/?$/, '/');
const manifestUrl = `${basePath}manifest.json`;
const iconUrl = `${basePath}icons/icon-64x64.png`;

const PWAInstallPrompt = () => {
	return (
		<pwa-install
			icon={iconUrl}
			manifest-url={manifestUrl}
			use-local-storage
		/>
	);
};

export default PWAInstallPrompt;
