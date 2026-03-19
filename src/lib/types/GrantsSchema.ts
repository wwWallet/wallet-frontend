import { z } from "zod";

const AuthorizationCodeGrantSchema = z.object({
	issuer_state: z.string().optional(),
	authorization_server: z.string().optional(),
});

const TxCodeSchema = z.object({
	input_mode: z.enum(["numeric", "text"]).optional(),
	length: z.number().int().positive().optional(),
	description: z.string().max(300).optional(),
});

const PreAuthorizedCodeGrantSchema = z.object({
	"pre-authorized_code": z.string(),
	tx_code: TxCodeSchema.optional(),
	authorization_server: z.string().optional(),
});

export const GrantsSchema = z
	.object({
		authorization_code: AuthorizationCodeGrantSchema.optional(),
		"urn:ietf:params:oauth:grant-type:pre-authorized_code":
			PreAuthorizedCodeGrantSchema.optional(),
	})
	.passthrough()
	.optional();

export type GrantsSchemaType = z.infer<typeof GrantsSchema>;
