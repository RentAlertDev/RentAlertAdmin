export const APP_ROUTES = {
	HOME: '/',
	LOGIN: '/login',
	FORBIDDEN: '/403-forbidden',
	ADMIN: {
		DASHBOARD: '/admin/dashboard',
		USERS: '/admin/users',
		JOBS: '/admin/jobs',
		FEEDBACKS: '/admin/feedbacks',
		user: (userId: number | string) => `/admin/users/${userId}`
	}
} as const
