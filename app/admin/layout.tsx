import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { APP_ROUTES } from '@/shared/config/routes'
import { AdminShell } from '@/widgets/admin-shell/admin-shell'

export default async function Layout({
	children
}: {
	children: React.ReactNode
}) {
	if (!(await cookies()).has('admin_access_token')) redirect(APP_ROUTES.LOGIN)
	return <AdminShell>{children}</AdminShell>
}
