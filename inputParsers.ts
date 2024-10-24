//* Define the schema for the CSV file

import { z } from "zod"

export const createPrimaryCampaignRow = z.object({
	'User Name': z.string(),
	'User Email': z.string().email().toLowerCase(),
	'Business Name': z.string(),
	'Campaign Name': z.string(),
	'Street Address': z.string(),
	Website: z.string().url(),
	Phone: z.string(),
	'Country Code': z.string(),
	'Blueprint Name': z.string(),
})

export type TCreatePrimaryCampaignRow = z.infer<typeof createPrimaryCampaignRow>