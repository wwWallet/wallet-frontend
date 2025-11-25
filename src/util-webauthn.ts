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
