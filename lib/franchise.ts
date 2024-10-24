import { z } from "zod"
import { franchiseSchema, userSchema, type TFranchise, type TUser } from "../models/eulerity"
import { request } from "./request"
import { locationSchema, type TLocation } from "../models/location"

export const getFranchise = async (franchiseId: string): Promise<TFranchise> => {
	const franchiseResponse = await request(`/api/franchise/getFranchise?franchise=${franchiseId}`)

	const franchiseJson = await franchiseResponse.json()
	return franchiseSchema.parse(franchiseJson)
}

const userInfoSchema = z.object({
	id: z.string(),
	name: z.string().optional(),
	lastLoginDays: z.number(),
	email: z.string().email(),
})

export type TUserInfo = z.infer<typeof userInfoSchema>

const listUserSchema = z.object({
	paginatedData: z.array(userInfoSchema),
	cursor: z.string().optional(),
})

export const listUsers = async (franchiseId: string, cursor?: string): Promise<TUserInfo[]> => {

	let url = `/api/franchise/listUsers?franchise=${franchiseId}`

	if (cursor) {
		url += `&cursor=${cursor}`
	}

	const listUsersResponse = await request(url)
	const listUsersJson = await listUsersResponse.json()
	const listUserParsed = listUserSchema.parse(listUsersJson)

	let users = listUserParsed.paginatedData

	if (listUserParsed.cursor) {
		users = users.concat(await listUsers(franchiseId, listUserParsed.cursor))
	}

	return users
}

const listLocationsSchema = z.object({
	paginatedData: z.array(locationSchema),
	cursor: z.string().optional(),
})

export const listLocations = async (franchiseId: string, cursor?: string): Promise<TLocation[]> => {
	let url = `/api/franchise/listLocations?franchise=${franchiseId}`

	if (cursor) {
		url += `&cursor=${cursor}`
	}

	const listLocationsResponse = await request(url)
	const listLocationsJson = await listLocationsResponse.json()
	const lostLocationsParsed = listLocationsSchema.parse(listLocationsJson)

	let users = lostLocationsParsed.paginatedData

	if (lostLocationsParsed.cursor) {
		users = users.concat(await listLocations(franchiseId, lostLocationsParsed.cursor))
	}

	return users

}

export const createFranchisee = async (franchiseId: string, user: {
	name: string,
	email: string,
}): Promise<TUser> => {
	const response = await request(`/api/franchise/createFranchisee?franchise=${franchiseId}`, {
		method: 'POST',
		body: JSON.stringify(user),
	})

	if ("status" in response && response.status !== 200) {
		throw new Error('Failed to create franchisee')
	}

	return response.json()
}