const URL = 'https://eulerity-tester.appspot.com'
const token = 'foo'
// const token = 'SL6IKglYufjd6irmCpY-r5NaIQ0MOpLJd9cZXxCHCtOMUoufFccyt_eVd6EZsFNbxIN1cYp-GScU2-MUF5DOy0ijtehfk6gQHgoiWfp_UnPzVl-ce1HW-DRfWfg_64nqs5-UexYYypUDH_sh8AkBMUwJZcJ80TwHuoCwNBzcztg'

export const request = (target: string, options?: RequestInit) => {

	if (options?.method === 'POST') {
		// we can add a read only mode here
	}

	return fetch(`${URL}${target}`, {
		...options,
		headers: {
			...options?.headers,
			'X-Eulerity-Api-Token': `${token}`,
		},
		cache: 'no-cache',
	})
}