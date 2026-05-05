import React from 'react';
import '@khmyznikov/pwa-install';
import { BASE_PATH, SHOW_PWA_INSTALL_PROMPT } from '@/config';
import { useLocation } from 'react-router-dom';

const basePath = BASE_PATH.replace(/\/?$/, '/');
const manifestUrl = `${basePath}manifest.json`;
const iconUrl = `${basePath}icons/icon-64x64.png`;

const PWAInstallPrompt = () => {
	const location = useLocation();

	if (!SHOW_PWA_INSTALL_PROMPT || location.pathname !== '/login') {
		return null;
	}

	return (
		<pwa-install
			icon={iconUrl}
			manifest-url={manifestUrl}
			use-local-storage
		/>
	);
};

export default PWAInstallPrompt;
