



# eDiplomas Digital Wallet

Welcome to the eDiplomas Digital Wallet Frontend repository! This application is a user-friendly web wallet that empowers users to manage their digital credentials effortlessly. With a seamless interface and powerful features, users can view their credentials, obtain new ones from issuers, present credentials to verifiers, and access their presentation history.


## Table of Contents
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Usage](#usage)
- [PRF Compatibility](#prf-compatibility)
- [Firebase](#firebase)
- [Contributing](#contributing)

## Features

Our Web Wallet provides a range of features tailored to enhance the credential management experience:

- **Credential Display:** Users can easily view their stored digital credentials in a structured manner, making it simple to keep track of their qualifications.

- **Issuer Interaction:** Seamless integration with issuers allows users to request and receive new digital credentials directly within the wallet.

- **Verifier Presentation:** Users can present their credentials to verifiers using the wallet, providing a secure and efficient method of showcasing their qualifications.

- **Presentation History:** The wallet maintains a history of credential presentations, allowing users to review and track when and where they've shared their credentials.

## Prerequisites

- Node.js
- npm/yarn


## Installation

 - Clone the repository:

 - **Option 1: Using HTTPS**
     ```bash
     git clone https://github.com/your-username/wallet-frontend.git
     ```
  
 - **Option 2: Using SSH**
     ```bash
     git clone git@github.com:your-username/wallet-frontend.git
     ```

 - Navigate to the project folder:

   ```bash
   cd wallet-frontend
   ```
 - Configure Environment Variables:
The project uses environment variables to manage different configurations. A `.env` file is used to keep all these variables. There is a `.env.template` file in the repository. Copy it and rename it to `.env`.
   ```bash
   cp .env.template .env
   ```
   Now, open the .env file and fill in the variables according to your own configuration. Below is an explanation for each variable:

	 - HOST: The IP address where your app will be running (default is '0.0.0.0').
	 - PORT: The port on which your app will run (default is 3000).
	 - VAPIDKEY: Your Vapid key (public key for cloud messaging firebase) for push notifications.
	 - REACT_APP_WS_URL: The URL of the websocket service.
	 - REACT_APP_WALLET_BACKEND_URL: The URL of your backend service.
	 - REACT_APP_LOGIN_WITH_PASSWORD: A Boolean value which show/hide the classic login/signup.
	 - REACT_APP_FIREBASE_API_KEY: Your API key for Firebase. 
	 - REACT_APP_FIREBASE_AUTH_DOMAIN: Your Firebase authentication domain.
	 - REACT_APP_FIREBASE_PROJECT_ID: Your Firebase project ID.
	 - REACT_APP_FIREBASE_STORAGE_BUCKET: Your Firebase storage bucket.
	 - REACT_APP_FIREBASE_MESSAGING_SENDER_ID: Your Firebase Messaging Sender ID.
	 - REACT_APP_FIREBASE_APP_ID: Your Firebase App ID. 
	 - REACT_APP_FIREBASE_MEASUREMENT_ID: Your Firebase Measurement ID.

4. Install dependencies:
	```bash
	yarn install
	```
5. Start the development server:

   ```bash
   yarn start
   ```

## Usage
Once the development server is running, you can access the app by visiting http://localhost:3000 in your web browser. The app provides various pages and components that you can interact with. Explore the features and enjoy using the Wallet Frontend!

## PRF Compatibility

The eDiplomas Digital Wallet Frontend offers compatibility with PRF for a seamless and secure registration and authentication process. Below, we present specific compatibility scenarios based on the operating system, with WebAuthn compatibility included for reference.

### Compatibility Description

PRF (Passwordless Registration Framework) simplifies the process of registering and authenticating users without passwords, enhancing both security and user experience. While WebAuthn is compatible with various authentication methods, this table focuses on PRF compatibility.

### PRF Compatibility Scenarios for Google Chrome (version 116 and later)

| Operating System | Authenticator                          | PRF Compatibility |
|------------------|----------------------------------------|--------------------|
| Linux            | YubiKey (USB)                          | ✔                  |
| Linux            | Android (Bluetooth)                    | ✔                  |
| Linux            | iOS (Bluetooth)                        | -                  |
| Windows          | YubiKey                                | -                  |
| Windows          | Android (Bluetooth)                    | ✔                  |
| Windows          | iOS (Bluetooth)                        | -                  |
| Windows          | Windows (Same Hardware)                | ❌                  |
| MacOS            | YubiKey (USB)                          | ✔                  |
| MacOS            | MacOS (Same Hardware)                  | ❌                  |
| MacOS            | Android (Bluetooth)                    | ✔                  |
| MacOS            | iOS (Bluetooth)                        | -                  |
| Android          | Android (Same Hardware)                | ✔                  |
| iOS              | iOS     (Same Hardware)                | -                  |


Please note that these scenarios are specific to Google Chrome on different operating systems and authenticators. The eDiplomas Digital Wallet Frontend aims to provide a secure and flexible authentication experience with a focus on PRF compatibility.

## Firebase
This application uses Firebase for authentication and messaging features. To integrate Firebase into your project, follow these steps:

1. **Firebase Configuration (`src/firebase.js`):**

	The `firebase.js` file in the `src` directory and provide your Firebase configuration details. This file initializes the Firebase app and sets up the messaging service.

2. **Firebase Messaging Service Worker (`public/firebase-messaging-sw.js`):**

   This service worker is responsible for handling background messages and notification clicks. When a background message is received, it triggers a notification, and when the user clicks on a notification, it can perform custom actions.

## Tailwind CSS

This project utilizes **Tailwind CSS**, a utility-first CSS framework that enables rapid development of custom user interfaces with minimal effort. Tailwind CSS offers a collection of utility classes that make styling components and layouts a breeze, eliminating the need for writing extensive custom CSS.

### Styling with Utility Classes

To apply styles using Tailwind CSS, you can directly add utility classes to your HTML or JSX components. For example, to apply padding, margin, text color, and more:

```html
<div class="p-4 m-2 text-blue-500">Styled with Tailwind CSS</div>
```
### Customization
Tailwind CSS provides an extensive set of default styles, but you can also customize them to match your project's design. The **tailwind.config.js** file in the project's root directory allows you to customize colors, fonts, spacing, breakpoints, and more.

### Learn More
Explore the [Tailwind CSS documentation](https://tailwindcss.com/docs/installation) to learn about all the utility classes, configuration options, and techniques for building beautiful UIs efficiently.

## Contributing

We welcome contributions from the community to help improve the eDiplomas Digital Wallet Frontend repository. If you'd like to contribute, follow these steps:

1.	**Create a New Branch:**
	Create a new branch for your feature or bug fix
	```bash 
	git checkout -b my-feature
	```
	Replace my-feature with a descriptive name.

2.	**Make Changes:**
	Make the necessary changes in your code editor.

3.	**Commit Changes:**
	Commit your changes with a descriptive commit message:
	```bash 
	git commit -m "Add new feature"
	```
4.	**Push Changes:**
	Push your changes to your new branrch:
	```bash 
	git push --set-upstream origin my-feature
	```	
5.	**Create a Pull Request:**
	Open a pull request on the original repository. Provide a detailed description of your changes and their purpose.

6.	**Review and Merge:**
	Your pull request will be reviewed by the maintainers. Make any requested changes and address feedback. Once approved, your changes will be merged into master branch of the project.
