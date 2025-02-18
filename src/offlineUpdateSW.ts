const checkForUpdates = async () => {
	if (navigator.serviceWorker) {
		const registration = await navigator.serviceWorker.getRegistration();
		if (registration) {
			registration.update();
		}
	}
};

export default checkForUpdates;
