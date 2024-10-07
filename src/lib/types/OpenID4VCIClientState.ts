import { CredentialConfigurationSupported } from "../schemas/CredentialConfigurationSupportedSchema";

/**
 * serializable
 */
export class OpenID4VCIClientState {

	constructor(
		public code_verifier: string,
		public dpopJti: string,
		public selectedCredentialConfiguration: CredentialConfigurationSupported) { }

	public serialize(): string {
		return JSON.stringify({
			code_verifier: this.code_verifier,
			selectedCredentialConfiguration: this.selectedCredentialConfiguration
		});
	}

	public static deserialize(storedValue: string): OpenID4VCIClientState {
		const { code_verifier, dpopJti, selectedCredentialConfiguration } = JSON.parse(storedValue);
		return new OpenID4VCIClientState(code_verifier, dpopJti, selectedCredentialConfiguration);
	}
}
