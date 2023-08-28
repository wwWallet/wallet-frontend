
# Wallet Frontend

Welcome to the Wallet Frontend repository! This is a React app designed to manage wallet-related tasks. It offers various components and features that you can use to build a wallet management application.

## Table of Contents
- [Introduction](#introduction)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Usage](#usage)
- [Components](#components)
- [Contributing](#contributing)
- [License](#license)

## Introduction

This frontend application is built with React and Tailwind CSS and provides a user-friendly interface for managing wallet-related tasks. It includes features such as authentication, notifications, routing, and more. The app is organized using various components and pages, allowing for easy customization and extension.

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