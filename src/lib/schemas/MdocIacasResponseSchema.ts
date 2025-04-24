import { z } from "zod";

export const MdocIacasResponseSchema = z.object({
	iacas: z.array(z.object({
		certificate: z.string().optional(),
	}))
})

export type MdocIacasResponse = z.infer<typeof MdocIacasResponseSchema>;
