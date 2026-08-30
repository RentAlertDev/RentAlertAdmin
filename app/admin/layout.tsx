import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from '@/shared/api/auth'
import { APP_ROUTES } from '@/shared/config/routes'
import { AdminShell } from '@/widgets/admin-shell/admin-shell'

export default async function Layout({
	children
}: {
	children: React.ReactNode
}) {
	const store = await cookies()
	// The access-token cookie disappears when it expires; a live refresh token
	// still means an authenticated session that the proxy can silently renew.
	if (!store.has(ACCESS_TOKEN_COOKIE) && !store.has(REFRESH_TOKEN_COOKIE))
		redirect(APP_ROUTES.LOGIN)
	return <AdminShell>{children}</AdminShell>
}
