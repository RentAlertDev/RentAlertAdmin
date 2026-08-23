import axios from 'axios'

import { APP_ROUTES } from '@/shared/config/routes'

export const api = axios.create({ baseURL: '/api/admin' })
api.interceptors.response.use(
	r => r,
	error => {
		if (typeof window !== 'undefined') {
			if (error.response?.status === 401)
				window.location.assign(APP_ROUTES.LOGIN)
			if (error.response?.status === 403)
				window.location.assign(APP_ROUTES.FORBIDDEN)
		}
		return Promise.reject(error)
	}
)
