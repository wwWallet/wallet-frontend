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
