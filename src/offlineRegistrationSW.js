const isLocalhost = Boolean(
	window.location.hostname === 'localhost' ||
	window.location.hostname === '[::1]' ||
	window.location.hostname.match(
		/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
	)
);

export function register(config) {
	console.log(import.meta.env,import.meta.env.MODE,navigator.serviceWorker)
	if (import.meta.env.MODE === 'production' && 'serviceWorker' in navigator) {
		console.log('inside')
		window.addEventListener('load', () => {
			const swUrl = `/service-worker.js`;

			console.log('isLocalhost:',isLocalhost)
			if (isLocalhost) {
				// This is running on localhost. Let's check if a service worker still exists or not.
				checkValidServiceWorker(swUrl, config);

				navigator.serviceWorker.ready.then(() => {
					console.log(
						'This web app is being served cache-first by a service worker. To learn more, visit https://cra.link/PWA'
					);
				});
			} else {
				// Is not localhost. Just register service worker
				registerValidSW(swUrl, config);
			}
		});
	}
}

function registerValidSW(swUrl, config) {
	console.log('registerValidSW',swUrl)
	navigator.serviceWorker
		.register(swUrl)
		.then((registration) => {
			console.log('Service worker registered with scope:', registration.scope);

			registration.onupdatefound = () => {
				const installingWorker = registration.installing;
				if (installingWorker == null) {
					return;
				}
				installingWorker.onstatechange = () => {
					if (installingWorker.state === 'installed') {
						if (navigator.serviceWorker.controller) {
							console.log('New content is available; please refresh.');

							if (config && config.onUpdate) {
								config.onUpdate(registration);
							}
						} else {
							console.log('Content is cached for offline use.');

							if (config && config.onSuccess) {
								config.onSuccess(registration);
							}
						}
					}
				};
			};
		})
		.catch((error) => {
			console.error('Error during service worker registration:', error);
		});
}

function checkValidServiceWorker(swUrl, config) {
	// Check if the service worker can be found. If it can't reload the page.
	fetch(swUrl, {
		headers: { 'Service-Worker': 'script' },
	})
		.then((response) => {
			// Ensure service worker exists, and that we really are getting a JS file.
			const contentType = response.headers.get('content-type');
			console.log('response',response,contentType,contentType.indexOf('javascript'))

			if (
				response.status === 404 ||
				(contentType != null && contentType.indexOf('javascript') === -1)
			) {
				// No service worker found. Probably a different app. Reload the page.
				navigator.serviceWorker.ready.then((registration) => {
					registration.unregister().then(() => {
						window.location.reload();
					});
				});
			} else {
				// Service worker found. Proceed as normal.
				console.log('try to registerValidSW')
				registerValidSW(swUrl, config);
			}
		})
		.catch(() => {
			console.log('No internet connection found. App is running in offline mode.');
		});
}

export const checkForUpdates = async () => {
	if (navigator.serviceWorker) {
		const registration = await navigator.serviceWorker.getRegistration();
		if (registration) {
			registration.update();
		}
	}
};

export function unregister() {
	if ('serviceWorker' in navigator) {
		navigator.serviceWorker.ready
			.then((registration) => {
				registration.unregister();
			})
			.catch((error) => {
				console.error(error.message);
			});
	}
}
