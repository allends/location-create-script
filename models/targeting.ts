import { z } from "zod";

export const keywordSchema = z.object({
	isNegative: z.boolean(),
	matchType: z.string(),
	word: z.string(),
})

export const googleUserInterestSchema = z.object({
	availabilities: z.array(z.string()),
	id: z.string(),
	name: z.string(),
	taxonomyType: z.string(),
})

export const facebookInterestTargetSchema = z.object({
	audience_size: z.number(),
	audience_size_lower_bound: z.number(),
	audience_size_upper_bound: z.number(),
	id: z.string(),
	name: z.string(),
	path: z.array(z.string()),
	valid: z.boolean(),
})