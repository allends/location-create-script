import { z } from "zod"
import { facebookInterestTargetSchema, googleUserInterestSchema, keywordSchema } from "./targeting"
import { locationSchema } from "./location"

//* User
export const userSchema = z.object({
	name: z.string(),
	email: z.string().email(),
	id: z.string(),
})

export type TUser = z.infer<typeof userSchema>

//* Franchise
export const franchiseSchema = z.object({
	name: z.string(),
	brandingBlob: z.string(),
	defaultLocation: locationSchema,
})

export type TFranchise = z.infer<typeof franchiseSchema>