import { z } from "zod"
import { facebookInterestTargetSchema, googleUserInterestSchema, keywordSchema } from "./targeting"

//* Location
export const locationSchema = z.object({
	id: z.number(),
	name: z.string(),
	nickname: z.string(),
	keywords: z.array(keywordSchema),
	facebookInterestTargets: z.array(facebookInterestTargetSchema),
	googleUserInterests: z.array(googleUserInterestSchema),
	logo: z.string().optional(),
	user: z.object({
		raw: z.object({
			id: z.number(),
			kind: z.string(),
			name: z.string(),
		})
	})
})

export type TLocation = z.infer<typeof locationSchema>