import { format, parseFile } from 'fast-csv'
import { parsePhoneNumber, type CountryCode } from 'libphonenumber-js'
import { franchiseSchema, type TUser } from './models/eulerity'
import {
	createPrimaryCampaignRow,
	type TCreatePrimaryCampaignRow,
} from './inputParsers'
import { request } from './lib/request'
import {
	createFranchisee,
	getFranchise,
	listLocations,
	listUsers,
	type TUserInfo,
} from './lib/franchise'
import fs from 'fs'
import type { TLocation } from './models/location'

const WRITE_TO_BACKEND = false
const DEBUG = true

const targetFranchise = 'UFC Gym'

const countryCodes = ['US'] as const

const isCountryCode = (code: string): code is CountryCode => {
	return countryCodes.some((countryCode) => countryCode === code)
}

const parsePhoneString = (rawInput: string, country: string) => {
	if (!isCountryCode(country)) {
		throw new Error('Invalid country code')
	}

	return parsePhoneNumber(rawInput, country).format('E.164')
}

// Get a list of the blueprint, make a map by name

const failedRows: string[][] = []
const successfulRows: TCreatePrimaryCampaignRow[] = []

parseFile('input.csv', { headers: true })
	.on('error', (error) => console.error(error))
	.on('data', (row) => {
		const parsed = createPrimaryCampaignRow.safeParse(row)

		if (!parsed.success) {
			console.error('Failed to parse row', parsed.error)
			failedRows.push(row)
			return
		} else {
			successfulRows.push(parsed.data)
		}
	})
	.on('end', (rowCount: number) => console.log(`Parsed ${rowCount} rows`))

const userMap = new Map<string, TUser | TUserInfo>()
const failedUsers = new Map<string, Error>()

const existingUsers = await listUsers(targetFranchise)

existingUsers.forEach((user) => {
	userMap.set(user.email, user)
})

const failed = successfulRows.filter((row) => {
	const { 'User Email': email } = row

	if (!userMap.has(email.toLowerCase())) {
		if (DEBUG) {
			console.log(`User ${email} not found`)
		}
	}

	return !userMap.has(email.toLowerCase())
})

// if (failed.length) {
// 	const failedReport = fs.createWriteStream('failed.csv')

// 	const stream = format({ headers: true })
// 	stream.pipe(failedReport)

// 	failed.forEach((row) => {
// 		stream.write(row)
// 	})
// 	stream.end()
// }

// process.exit(0)

// function to create a user from a row
function createUser(franchise: string, row: TCreatePrimaryCampaignRow) {
	const { 'User Name': name, 'User Email': email } = row

	if (userMap.has(email)) {
		if (DEBUG) {
			console.log(`User ${email} already exists`)
		}
		return
	}

	try {
		// create the user
		if (DEBUG) {
			console.log(
				`Creating user ${name} with email ${email} for franchise ${franchise}`
			)
		}

		if (WRITE_TO_BACKEND) {
			return createFranchisee(franchise, { name, email })
				.then((user) => {
					userMap.set(email, user)
				})
				.catch((error) => {
					console.error('Failed to create user: ', email)
					failedUsers.set(email, error)
				})
		}

		userMap.set(email, { name, email, id: '1' })
		return
	} catch (error) {
		console.error(error)
	}
}

const franchise = await getFranchise(targetFranchise)

if (DEBUG) {
	// console.log(franchise)
}

// create the users
const userResults = successfulRows.map((row) => createUser(franchise.name, row))
await Promise.all(userResults)

const createLocationKey = (location: {
	name: string
	nickname: string
}) =>
	`${location.name}-${location.nickname}`

const campaignMap = new Map<string, TLocation>()

const campaigns = await listLocations(franchise.name)

const cleanup = campaigns.map((campaign) => {
	const key = createLocationKey(campaign)

	if (campaignMap.has(key)) {
		return `/api/location/delete?uid=${campaign.user.raw.name}&lid=${campaign.id}`
	} else {
		campaignMap.set(key, campaign)
	}
})

const cleanupResults = cleanup.filter(Boolean)

if (cleanupResults.length) {
	console.error("Cleanup Required")
	console.log(cleanupResults)

	process.exit(0)
}

const failedCampaigns = new Map<string, TCreatePrimaryCampaignRow>()
const successfulCampaigns: any[] = []

// function to create a campaign from a row
function createCampaign(row: TCreatePrimaryCampaignRow) {
	const {
		'Campaign Name': nickname,
		'Business Name': name,
		'Street Address': streetAddress,
		Website: website,
		'Blueprint Name': blueprint,
		Phone: rawPhone,
		'Country Code': countryCode,
		'User Email': email,
	} = row

	const key = createLocationKey({ name, nickname })

	if (campaignMap.has(key)) {
		if (DEBUG) {
			console.log(`Campaign ${nickname} already exists`)
		}
		return
	}

	//* Parse the phone number
	const phoneE164 = parsePhoneString(rawPhone, countryCode)

	//* Default Values
	const longitude = 40.725979
	const latitude = -74.008011
	const skipWebsiteValidation = false
	const focus = 'POSTING'
	const variables = {}
	const logo = franchise.defaultLocation.logo
	const geoTargets = [
		{
			geoRadius: {
				latitude,
				longitude,
				radius: 10,
			},
		},
	]
	const keywords = franchise.defaultLocation.keywords
	const facebookInterestTargets =
		franchise.defaultLocation.facebookInterestTargets
	const googleUserInterests = franchise.defaultLocation.googleUserInterests
	// const objective = 'reach'
	// const tos = 'https://www.eulerity.com/tos.html'

	const user = userMap.get(email)

	if (!user) {
		return
	}

	const primaryLocationBody = {
		name,
		nickname,
		streetAddress,
		website,
		blueprint,
		phoneE164,
		countryCode,
		longitude,
		latitude,
		skipWebsiteValidation,
		focus,
		variables,
		logo,
		geoTargets,
		keywords,
		facebookInterestTargets,
		googleUserInterests,
	}

	const existingCampaign = campaignMap.get(createLocationKey(primaryLocationBody))

	if (existingCampaign) {
		if (DEBUG) {
			console.log(`Campaign ${nickname} already exists`)
		}
		return
	}

	try {
		// create the campaign

		if (DEBUG) {
			console.group()
			console.log(`Creating campaign ${nickname} for ${name}`)
			console.groupEnd()
		}

		if (WRITE_TO_BACKEND) {
			return request(`/api/location/create?uid=${user.id}`, {
				method: 'POST',
				body: JSON.stringify(primaryLocationBody),
			})
				.then(async (response) => {

					const campaign = await response.json()

					if ('code' in campaign && campaign.code !== 200) {
						failedCampaigns.set(nickname, row)
						return
					}

					successfulCampaigns.push(campaign)
				})
				.catch((error) => {
					console.error('Failed to create campaign: ', error)
					failedCampaigns.set(nickname, row)
				})
		}
	} catch (error) {
		console.error(error)
	}
}

// create the campaigns
const campaignResults = successfulRows.map(createCampaign)

await Promise.all(campaignResults)

if (failedRows.length) {
	console.error('Failed to parse input rows: ', failedRows.length)

	// create a report on what failed
	const failedReport = fs.createWriteStream('failed.csv')
	failedRows.forEach((row) => failedReport.write(`${row}\n`))
	failedReport.close()
}

if (failedUsers.size > 0) {
	console.error('Failed to create users: ', failedUsers.size)
}

if (failedCampaigns.size > 0) {
	console.error('Failed to create campaigns: ', failedCampaigns.size)

	const failedReport = fs.createWriteStream('failedCampaigns.csv')

	const stream = format({ headers: true })
	stream.pipe(failedReport)

	failedCampaigns.forEach((row) => {
		stream.write(row)
	})
	stream.end()
}

console.log('Successfully created campaigns: ', successfulCampaigns)
