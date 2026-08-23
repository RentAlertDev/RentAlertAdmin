import { redirect } from 'next/navigation'

import { APP_ROUTES } from '@/shared/config/routes'

export default function Home() {
	redirect(APP_ROUTES.ADMIN.DASHBOARD)
}
