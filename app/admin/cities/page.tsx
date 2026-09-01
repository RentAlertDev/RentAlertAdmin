import type { Metadata } from 'next'

import { CitiesPage } from '@/modules/cities/cities-page'

export const metadata: Metadata = { title: 'Города' }

export default function Page() {
	return <CitiesPage />
}
