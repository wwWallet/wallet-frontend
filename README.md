
# eDiplomas Digital Wallet

Welcome to the eDiplomas Digital Wallet Frontend repository! This application is a user-friendly web wallet that empowers users to manage their digital credentials effortlessly. With a seamless interface and powerful features, users can view their credentials, obtain new ones from issuers, present credentials to verifiers, and access their presentation history.


## Table of Contents
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Usage](#usage)
- [Components](#components)
- [Contributing](#contributing)
- [License](#license)

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

1. Clone the repository:

   - **Option 1: Using HTTPS**
     ```bash
     git clone https://github.com/your-username/wallet-frontend.git
     ```
  
   - **Option 2: Using SSH**
     ```bash
     git clone git@github.com:your-username/wallet-frontend.git
     ```

2. Navigate to the project folder:

   ```bash
   cd wallet-frontend
   ```
3. Configure Environment Variables:
The project uses environment variables to manage different configurations. A `.env` file is used to keep all these variables. There is a `.env.template` file in the repository. Copy it and rename it to `.env`.
   ```bash
   cp .env.template .env
   ```
   Now, open the .env file and fill in the variables according to your own configuration. Below is an explanation for each variable:

	HOST: The IP address where your app will be running (default is '0.0.0.0'). 
	PORT: The port on which your app will run (default is 3000). 
	VAPIDKEY: Your Vapid key for push notifications. 
	REACT_APP_WALLET_BACKEND_URL: The URL of your backend service.
	REACT_APP_FIREBASE_API_KEY: Your API key for Firebase. 
	REACT_APP_FIREBASE_AUTH_DOMAIN: Your Firebase authentication domain.
	REACT_APP_FIREBASE_PROJECT_ID: Your Firebase project ID.
	REACT_APP_FIREBASE_STORAGE_BUCKET: Your Firebase storage bucket.
	REACT_APP_FIREBASE_MESSAGING_SENDER_ID: Your Firebase Messaging Sender ID.
	REACT_APP_FIREBASE_APP_ID: Your Firebase App ID. 
	REACT_APP_FIREBASE_MEASUREMENT_ID: Your Firebase Measurement ID.

4. Install dependencies:
	```bash
	yarn install
	```
5. Start the development server:

   ```bash
   yarn start
   ```
   Your app should now be running at http://localhost:3000.