export function checkVerifierViolations(
		verifierAttestations: { purpose: string[]; credentials: { format: string; vct_values: string[]; claims: string[][] }[] },
		presentationDefinition: any,
		dcqlQuery: any
	) {
		const violations: {
			type: "format" | "vct" | "claims";
			message: string;
			requested: any;
			allowed?: any;
		}[] = [];

		const requestedCreds = [];

		if (presentationDefinition) {
			for (const desc of presentationDefinition.input_descriptors) {
				const format = Object.keys(desc.format || {})[0] || null;
				const vct_values = desc.format?.[format]?.vct_values || [];
				const claims = desc.constraints?.fields?.flatMap(f => f.path) || [];
				requestedCreds.push({ format, vct_values, claims });
			}
		}

		if (dcqlQuery) {
			for (const cred of dcqlQuery.credentials) {
				requestedCreds.push({
					format: cred.format,
					vct_values: cred.meta?.vct_values || [],
					claims: (cred.claims || []).map(cl => cl.path)
				});
			}
		}

		for (const req of requestedCreds) {
			const matchingAttestations = verifierAttestations.credentials.filter(
				p => p.format === req.format
			);

			if (matchingAttestations.length === 0) {
				violations.push({
					type: "format",
					message: `Format not allowed: ${req.format}`,
					requested: req.format
				});
				continue;
			}

			for (const vct of req.vct_values) {
				const vctAllowed = matchingAttestations.some(a => a.vct_values.includes(vct));
				if (!vctAllowed) {
					violations.push({
						type: "vct",
						message: `VCT not allowed: ${vct}`,
						requested: vct,
						allowed: matchingAttestations.flatMap(a => a.vct_values)
					});
				}
			}

			for (const claimPath of req.claims) {
				const claimAllowed = matchingAttestations.some(att =>
					att.claims.some(path => JSON.stringify(path) === JSON.stringify(claimPath))
				);

				if (!claimAllowed) {
					violations.push({
						type: "claims",
						message: `Claim path not allowed: ${claimPath.join('.')}`,
						requested: claimPath,
						allowed: matchingAttestations.flatMap(a => a.claims)
					});
				}
			}
		}

		return violations;
	}