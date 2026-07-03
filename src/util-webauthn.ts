import '@/types/webauthn';


export function withHintsFromAllowCredentials(publicKey: PublicKeyCredentialRequestOptions): PublicKeyCredentialRequestOptions {
	const hasInternal = publicKey?.allowCredentials?.some(desc => desc.transports?.includes("internal"));
	const hasHybrid = publicKey?.allowCredentials?.some(desc => desc.transports?.includes("hybrid"));

	const nonExternal = new Set(["internal", "hybrid"]);
	const hasExternal = publicKey?.allowCredentials?.some(desc => !desc.transports?.every(tsp => nonExternal.has(tsp)));

	return {
		...publicKey,
		hints: [
			...(
				hasExternal
					? ["security-key"]
					: (
						hasInternal
							? ["client-device"]
							: (
								hasHybrid
									? ["hybrid"]
									: []
							)
					)
			),
			...(publicKey?.hints || []),
		],
	};
}

export function withAuthenticatorAttachmentFromHints(authSel: AuthenticatorSelectionCriteria, hints: string[]): AuthenticatorSelectionCriteria {
	const hintsSet = new Set(hints);
	const hasClientDevice = hintsSet.has("client-device");
	const hasHybrid = hintsSet.has("hybrid");
	const hasSecurityKey = hintsSet.has("security-key");

	const onlyPlatform = hasClientDevice && !(hasHybrid || hasSecurityKey);
	const onlyExternal = (hasHybrid || hasSecurityKey) && !hasClientDevice;

	if (onlyPlatform) {
		return {
			...authSel,
			authenticatorAttachment: "platform",
		};
	} else if (onlyExternal) {
		return {
			...authSel,
			authenticatorAttachment: "cross-platform",
		};
	} else {
		return authSel;
	}
}

type SignalUnknownCredentialOptions = {
	credentialId: string;
	rpId: string;
};

type SignalAllAcceptedCredentialsOptions = {
	allAcceptedCredentialIds: string[];
	rpId: string;
	userId: string;
};

type SignalCurrentUserDetailsOptions = {
	displayName: string;
	name: string;
	rpId: string;
	userId: string;
};

type PublicKeyCredentialWithSignalMethods = typeof PublicKeyCredential & {
	getClientCapabilities?: () => Promise<Record<string, boolean>>;
	signalAllAcceptedCredentials?: (options: SignalAllAcceptedCredentialsOptions) => Promise<void>;
	signalCurrentUserDetails?: (options: SignalCurrentUserDetailsOptions) => Promise<void>;
	signalUnknownCredential?: (options: SignalUnknownCredentialOptions) => Promise<void>;
};

async function getPublicKeyCredentialSignals(): Promise<{
	clientCapabilities: Record<string, boolean>;
	publicKeyCredential: PublicKeyCredentialWithSignalMethods;
} | null> {
	if (typeof window === "undefined" || !window.isSecureContext || typeof PublicKeyCredential === "undefined") {
		return null;
	}

	const publicKeyCredential = PublicKeyCredential as PublicKeyCredentialWithSignalMethods;
	if (!publicKeyCredential.getClientCapabilities) {
		return null;
	}

	return {
		clientCapabilities: await publicKeyCredential.getClientCapabilities(),
		publicKeyCredential,
	};
}

export async function signalAllAcceptedCredentials(options?: SignalAllAcceptedCredentialsOptions): Promise<boolean> {
	if (!options) {
		return false;
	}

	try {
		const signals = await getPublicKeyCredentialSignals();
		if (
			!signals?.publicKeyCredential.signalAllAcceptedCredentials
			|| signals.clientCapabilities.signalAllAcceptedCredentials !== true
		) {
			return false;
		}

		await signals.publicKeyCredential.signalAllAcceptedCredentials(options);
		return true;
	} catch (error) {
		console.warn("Failed to signal accepted WebAuthn credentials", error);
		return false;
	}
}

export async function signalUnknownCredential(options?: SignalUnknownCredentialOptions): Promise<boolean> {
	if (!options) {
		return false;
	}

	try {
		const signals = await getPublicKeyCredentialSignals();
		if (
			!signals?.publicKeyCredential.signalUnknownCredential
			|| signals.clientCapabilities.signalUnknownCredential !== true
		) {
			return false;
		}

		await signals.publicKeyCredential.signalUnknownCredential(options);
		return true;
	} catch (error) {
		console.warn("Failed to signal unknown WebAuthn credential", error);
		return false;
	}
}
