importScripts("https://www.gstatic.com/firebasejs/10.1.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.1.0/firebase-messaging-compat.js");

self.skipWaiting();

 //the Firebase config object
 const firebaseConfig = {
	//config
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();


messaging.onBackgroundMessage(function(payload) {
  console.log('Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    data: { url: '/' },
  };

  self.registration.showNotification(notificationTitle,
    notificationOptions);
});

self.addEventListener('notificationclick', function(event) {
  console.log('Notification click Received.');
  event.notification.close();

  // Use the URL provided in the notification payload (if it exists), otherwise default to '/'
  const urlToRedirectTo = event.notification.data.url || '/';
	console.log(event.notification.data.url);
  event.waitUntil(
    clients.matchAll({type: 'window', includeUncontrolled: true}).then( windowClients => {
      console.log(`Found -> ${windowClients.length} window clients.`);
      
      // If there is at least one client, navigate it to the target URL
      if (windowClients.length > 0) {
        let client = windowClients[0];
        console.log('Navigating the first client to ' + urlToRedirectTo);
        client.navigate(urlToRedirectTo);
        return client.focus();
      }

      // If there are no window clients, open a new one
      if (clients.openWindow) {
        console.log('No clients found, opening a new window');
        return clients.openWindow(urlToRedirectTo);
      }
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(clients.claim());
});
