import { PublicKeyResolutionError } from "./error";
import { PublicKeyResolver, PublicKeyResolverEngineI } from "./interfaces";

export function PublicKeyResolverEngine(): PublicKeyResolverEngineI {
	const resolvers: PublicKeyResolver[] = [];

	return {
		register(resolver: PublicKeyResolver) {
			resolvers.push(resolver);
		},
		async resolve({ identifier }: { identifier: string }) {
			for (const r of resolvers) {
				const result = await r.resolve({ identifier });
				if (result.success) {
					return result;
				}
			}
			return { success: false, error: PublicKeyResolutionError.CannotResolvePublicKey };
		},
	}
}

