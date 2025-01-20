import { useEffect } from 'react';

const BackgroundNotificationClickHandler = () => {
	useEffect(() => {
		const handleNotificationClickMessage = (event) => {
			console.log('Message received from service worker:', event);

			if (event.data?.type === 'navigate') {
				const targetUrl = event.data.url || '/';
				console.log(`Redirecting to: ${targetUrl}`);
				window.location.href = targetUrl; // Navigate to the target URL
			}
		};

		// Add the service worker message listener
		if (navigator?.serviceWorker) {
			navigator.serviceWorker.addEventListener('message', handleNotificationClickMessage);
		}

		// Cleanup the listener on unmount
		return () => {
			if (navigator?.serviceWorker) {
				navigator.serviceWorker.removeEventListener('message', handleNotificationClickMessage);
			}
		};
	}, []);

	return null; // This component does not render any UI
};

export default BackgroundNotificationClickHandler;