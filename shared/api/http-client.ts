import axios from 'axios'

import { APP_ROUTES } from '@/shared/config/routes'

export const api = axios.create({ baseURL: '/api/admin' })

// Token refresh is handled transparently by the /api/admin proxy: it renews an
// expired access token from the refresh cookie and retries upstream once. A 401
// reaching the browser therefore means the session is truly over — bounce to login.
api.interceptors.response.use(
	r => r,
	error => {
		if (typeof window !== 'undefined') {
			const { pathname } = window.location
			if (error.response?.status === 401 && pathname !== APP_ROUTES.LOGIN)
				window.location.assign(APP_ROUTES.LOGIN)
			if (
				error.response?.status === 403 &&
				pathname !== APP_ROUTES.FORBIDDEN
			)
				window.location.assign(APP_ROUTES.FORBIDDEN)
		}
		return Promise.reject(error)
	}
)
