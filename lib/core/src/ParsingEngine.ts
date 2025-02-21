import { CredentialParsingError } from "./error";
import { CredentialParser, ParsingEngineI } from "./interfaces";
import { VerifiableCredentialFormat } from "./types";

export function ParsingEngine(): ParsingEngineI {
	const parsers: CredentialParser[] = [];

	return {
		register(parser: CredentialParser) {
			parsers.push(parser);
		},

		async parse({ rawCredential }: { rawCredential: unknown }) {

			for (const p of parsers) {
				const result = await p.parse({ rawCredential });
				if (result.success) {
					return result;
				}
			}
			return {
				success: false,
				error: CredentialParsingError.CouldNotParse
			}

		}
	}
}
