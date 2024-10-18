import { CredentialConfigurationSupported } from "../schemas/CredentialConfigurationSupportedSchema";

/**
 * serializable
 */
export class OpenID4VCIClientState {

	constructor(
		public state: string,
		public code_verifier: string,
		public dpopJti: string,
		public selectedCredentialConfiguration: CredentialConfigurationSupported) { }

	public serialize(): string {
		return JSON.stringify({
			state: this.state,
			code_verifier: this.code_verifier,
			dpopJti: this.dpopJti,
			selectedCredentialConfiguration: this.selectedCredentialConfiguration
		});
	}

	public static deserialize(storedValue: string): OpenID4VCIClientState {
		const { state, code_verifier, dpopJti, selectedCredentialConfiguration } = JSON.parse(storedValue);
		return new OpenID4VCIClientState(state, code_verifier, dpopJti, selectedCredentialConfiguration);
	}
}
