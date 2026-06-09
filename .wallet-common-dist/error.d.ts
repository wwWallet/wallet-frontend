export declare enum CredentialParsingError {
    UnsupportedFormat = "UnsupportedFormat",
    CouldNotParse = "CouldNotParse",
    InvalidSdJwtVcPayload = "InvalidSdJwtVcPayload",
    InvalidJwtVcJsonPayload = "InvalidJwtVcJsonPayload",
    InvalidDatatype = "InvalidDatatype",
    NotSupportedCredentialType = "NotSupportedCredentialType",
    InfiniteRecursion = "InfiniteRecursion",
    VctmDecodeFail = "VctmDecodeFail",
    UnknownError = "UnknownError",
    NotFound = "NotFound",
    NotFoundExtends = "NotFoundExtends",
    IntegrityMissing = "IntegrityMissing",
    JwtVcIssuerMismatch = "JwtVcIssuerMismatch",
    IntegrityFail = "IntegrityFail",
    SchemaShapeFail = "SchemaShapeFail",
    JwtVcIssuerFail = "JwtVcIssuerFail",
    FailFetchIssuerMetadata = "FailFetchIssuerMetadata",
    FailSchemaIssuerMetadata = "FailSchemaIssuerMetadata"
}
export declare const CredentialParsingWarnings: Set<CredentialParsingError>;
export declare function isCredentialParsingWarnings(code: CredentialParsingError): boolean;
export declare enum GetMatchingCredentialsError {
    PresentationDefinitionParseError = "PresentationDefinitionParseError"
}
export declare enum ValidatePresentationRequirementsError {
    PresentationSubmissionParameterIsMissing = "PresentationSubmissionParameterIsMissing",
    ConstraintsAreNotSatisfied = "ConstraintsAreNotSatisfied",
    PresentationSubmissionParsingFailed = "PresentationSubmissionParsingFailed",
    FailedToParseAtLeastOnePresentation = "FailedToParseAtLeastOnePresentation",
    InvalidVpToken = "InvalidVpToken",
    CredentialParsingError = "CredentialParsingError",
    CouldNotFindAssociatedInputDescriptorBasedOnPresentationSubmission = "CouldNotFindAssociatedInputDescriptorBasedOnPresentationSubmission",
    CouldNotVerifyParsedCredentialWithInputDescriptor = "CouldNotVerifyParsedCredentialWithInputDescriptor",
    UnsupportedFormat = "UnsupportedFormat"
}
export declare enum CredentialVerificationError {
    UnknownProblem = "UnknownProblem",
    VerificationProcessNotStarted = "VerificationProcessNotStarted",// will be used when the verifier functions cannot start the verification process because of format
    InvalidDatatype = "InvalidDatatype",
    InvalidFormat = "InvalidFormat",
    MissingOpts = "MissingOpts",
    InvalidCertificateChain = "InvalidCertificateChain",
    InvalidSignature = "InvalidSignature",
    CannotResolveIssuerPublicKey = "CannotResolveIssuerPublicKey",
    CannotImportIssuerPublicKey = "CannotImportIssuerPublicKey",
    NotTrustedIssuer = "NotTrustedIssuer",
    VctRegistryNotConfigured = "VctRegistryNotConfigured",
    ExpiredCredential = "ExpiredCredential",
    CannotImportHolderPublicKey = "CannotImportHolderPublicKey",
    CannotExtractHolderPublicKey = "CannotExtractHolderPublicKey",
    KbJwtVerificationFailedMissingParameters = "KbJwtVerificationFailedMissingParameters",
    KbJwtVerificationFailedWrongSdHash = "KbJwtVerificationFailedWrongSdHash",
    KbJwtVerificationFailedUnexpectedAudience = "KbJwtVerificationFailedUnexpectedAudience",
    KbJwtVerificationFailedUnexpectedNonce = "KbJwtVerificationFailedUnexpectedNonce",
    KbJwtVerificationFailedSignatureValidation = "KbJwtVerificationFailedSignatureValidation",
    MsoMdocMissingDeviceKeyInfo = "MsoMdocMissingDeviceKeyInfo",
    MsoMdocInvalidDeviceSignature = "MsoMdocInvalidDeviceSignature"
}
export declare enum PublicKeyResolutionError {
    CannotResolvePublicKey = "CannotResolvePublicKey"
}
export declare enum CredentialRenderingError {
    IntegrityCheckFailed = "IntegrityCheckFailed",
    CouldNotFetchSvg = "CouldNotFetchSvg"
}
//# sourceMappingURL=error.d.ts.map