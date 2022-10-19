export default {

	Header: {
		title: 'eDiplomas Wallet',
		description: 'A Digital Wallet for diplomas transcripts'
	},

	Footer: {
		services: 'Services',
		info: 'Information',
		contact: 'Contact',
		web: 'Web',
		email: 'E-mail for Organizations and HEIs',
		participatingInstitutions: 'Participating Institutions',
		signatureVerification: 'Signature Verification',
		diplomaCheck: 'Ex-officio Degree Check',
		termsOfUse: 'Terms of Use',
		revocation: 'Authorization Revocation',
		templateHandlingApp: 'Degree Template Administration Service',
		developersGuide: 'Documentation'
	},

	Login: {
		header: 'eDiplomas Wallet',
		description1: 'Your digital wallet for the university degrees and lifelong learning certifications',
		description2: 'Insert your credentials to login',
		buttonLogin: 'Login',
		buttonRegister: 'Register',
		buttonImport: 'Import existing wallet',
		error: {
			emptyUsername: 'Please enter your username',
			emptyPassword: 'Please enter your password',
			invalidCredentials: 'Credentials do not match',
			networkError: 'Network Error'
		}
	},

	Register: {
		title: 'Register',
		description1: 'Use a username that you can memorize, and provide a secure password to protect your wallet',
		description2: 'Choose your credentials',
		buttonBack: 'Back',
		buttonRegister: 'Register',
		invalidPassword: 'Choose a password',
		loading: 'Registering Wallet',
		error: {
			emptyUsername: 'Please enter your username',
			emptyPassword: 'Please enter your password',
			emptyRepeatPassword: 'Please repeat your password',
			differentPasswords: 'Password confirmation is invalid',
			existingUsername: 'A user with the chosen username already exists',
			networkError: 'Network Error'
		}
	},

	Import: {
		header: 'Import Wallet',
		buttonChooseFile: 'Choose File',
		passphrase: 'passphrase',
		buttonImport: 'Import wallet',
		success: 'Success',
		successText: 'Successfully imported wallet.',
		error: 'Error',
		errorText: 'Failed to import wallet.',
		buttonTryAgain: 'Try again',
		buttonReturnLogin: 'Return to login page'
	},

	Export: {
		buttonExport: 'Export Wallet',
		confirmExport: 'Confirm Wallet Export',
		passphrasePrompt: 'Please enter your password'
	},

	Wallet: {
		tab1: {
			title: 'Credentials',
			header: 'My Credentials',
			verifiableIdentifiers: 'Verifiable Identifiers',
			verifiableCredentials: 'Verifiable Credentials',
			emptyVID: "You don't have any Verifiable IDs yet",
			emptyVC: "You don't have any Verifiable Credentials yet",
			vidPrompt: 'Need an EBSI Verifiable ID?',
			vidButton: 'Request VID from Gov.gr'
		},
		tab2: {
			title: 'Audit',
			header: 'VP Audit Records'
		},
		tab3: {
			title: 'Services',
			header: 'Connected Services',
			vid: 'Request a VID from the Greek EBSI Verifiable ID provider portal',
			diplomaHeader: 'Receive a Verifiable Diploma in just a few clicks',
			diplomaDesc: 'Must be a Greek Higher Education Institute Graduate',
			verifyHeader: 'Verify diplomas issued by Greek Higher Education Institutes in a privacy preserving way',
			verifyDesc: 'Available for specified authorized parties from the public and private sector'
		},
		tab4: {
			title: 'Issuers',
			header: 'Find an Issuer',
			country: 'Country',
			institution: 'Institution',
			type: 'Type',
			step1: 'Step 1: Select Country',
			step2: 'Step 2: Select Institution',
			step3: 'Select Credential Type',
			next: 'Next',
			back: 'Back',
			visitIssuer: 'Visit Issuer',
			error1: 'Please choose a country',
			error2: 'Please choose an institution',
			error3: 'Please choose a credential type',
		},
		tab5: {
			title: 'Settings',
			dataHub: 'Store my Verifiable Credentials into the ID Data Hub',
		},
		logout: 'Logout'
	},

	Audit: {
		header: 'Verifiable Presentation Audit Records',
		range: 'Range at which the VPs are issued',
		from: 'From',
		to: 'To',
		filter: 'Select VC types filter',
		validAt: 'Show Presentations which are still valid at',
		nonExpired: 'Show non-expired',
		presentationId: 'Presentation ID',
		issuedAt: 'Issued at'
	},

	VpCard: {
		presentationId: 'Presentation ID',
		validity: 'Validity',
		issuedAt: 'Issued at',
		issuanceDate: 'Issuance Date',
		expirationDate: 'Expiration date',
		details: 'Details',
		containedTypes: 'Contained VC Types'
	},

	Authz: {
		title: 'Select Verifiable IDs',
		description1: 'In this step you can select the Verifiable ID credentials you want to present on',
		description2: 'in order to prove your identity',
		titleNoCred: 'Authorize connection with your Wallet',
		descriptionNoCred1: 'Do you authorize',
		descriptionNoCred2: 'to connect with your wallet?',
		buttonBack: 'Back',
		buttonAuthorize: 'Authorize'
	},

	Present: {
		title: 'Select which Verifiable Credentials you want to present to',
		exp: 'Set an expiration date for this presentation',
		buttonBack: 'Back',
		buttonAuthorize: 'Authorize'
	},

	ShortVc: {
		verifiableId: 'Verifiable ID',
		verifiableCredential: 'Verifiable Credential',
		diploma: 'Diploma'
	},

	RequestVc: {
		title: 'VC Received',
		description: 'Your VC has been received from your Wallet',
		error: 'There has been a problem with your VC',
		loading: 'Wait for credentials to be received',
		done: 'View your Credentials'
	},

	Consent: {
		title: 'Credential Exchange Consent',
		description1: 'Trusted Issuer ',
		description2: 'wants to send you verifiable credentials. Do you consent to this exchange?',
		buttonConsent: 'Consent',
		buttonDecline: 'Decline',
		VerifyIssuerLoadingScreen: "Verifying issuer..."
	},
};