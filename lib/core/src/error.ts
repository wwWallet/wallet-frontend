export enum CredentialParsingError {
	MissingIssuerIdentifier = "MissingIssuerIdentifier",
	CouldNotParse = "CouldNotParse",
	InvalidDatatype = "InvalidDatatype",
}

export enum GetMatchingCredentialsError {
	PresentationDefinitionParseError = "PresentationDefinitionParseError"
}

export enum ValidatePresentationRequirementsError {
	PresentationSubmissionParameterIsMissing = "PresentationSubmissionParameterIsMissing",
	ConstraintsAreNotSatisfied = "ConstraintsAreNotSatisfied",
	PresentationSubmissionParsingFailed = "PresentationSubmissionParsingFailed",
	FailedToParseAtLeastOnePresentation = "FailedToParseAtLeastOnePresentation",
	InvalidVpToken = "InvalidVpToken",
	CredentialParsingError = "CredentialParsingError",
	CouldNotFindAssociatedInputDescriptorBasedOnPresentationSubmission = "CouldNotFindAssociatedInputDescriptorBasedOnPresentationSubmission",
	CouldNotVerifyParsedCredentialWithInputDescriptor = "CouldNotVerifyParsedCredentialWithInputDescriptor",
	UnsupportedFormat = "UnsupportedFormat",

}

export enum CredentialVerificationError {
	UnknownProblem = "UnknownProblem",
	VerificationProcessNotStarted = "VerificationProcessNotStarted", // will be used when the verifier functions cannot start the verification process because of format
	InvalidDatatype = "InvalidDatatype",
	InvalidFormat = "InvalidFormat",
	MissingOpts = "MissingOpts",
	InvalidCertificateChain = "InvalidCertificateChain",


	InvalidSignature = "InvalidSignature",
	CannotResolveIssuerPublicKey = "CannotResolveIssuerPublicKey",
	CannotImportIssuerPublicKey = "CannotImportIssuerPublicKey",
	NotTrustedIssuer = "NotTrustedIssuer",

	ExpiredCredential = "ExpiredCredential",

	CannotImportHolderPublicKey = "CannotImportHolderPublicKey",
	CannotExtractHolderPublicKey = "CannotExtractHolderPublicKey",

	// KBJWT related
	KbJwtVerificationFailedMissingParameters = "KbJwtVerificationFailedMissingParameters",
	KbJwtVerificationFailedWrongSdHash = "KbJwtVerificationFailedWrongSdHash",
	KbJwtVerificationFailedUnexpectedAudience = "KbJwtVerificationFailedUnexpectedAudience",
	KbJwtVerificationFailedUnexpectedNonce = "KbJwtVerificationFailedUnexpectedNonce",
	KbJwtVerificationFailedSignatureValidation = "KbJwtVerificationFailedSignatureValidation",


	// MSO MDOC related
	MsoMdocMissingDeviceKeyInfo = "MsoMdocMissingDeviceKeyInfo",
	MsoMdocInvalidDeviceSignature = "MsoMdocInvalidDeviceSignature",
}

export enum PublicKeyResolutionError {
	CannotResolvePublicKey = "CannotResolvePublicKey",
}

export enum CredentialRenderingError {
	IntegrityCheckFailed = "IntegrityCheckFailed",
	CouldNotFetchSvg = "CouldNotFetchSvg",
}
