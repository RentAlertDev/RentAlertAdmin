import type { Metadata } from 'next'

import { ListingsPage } from '@/modules/listings/listings-page'

export const metadata: Metadata = { title: 'Объявления' }

export default function Page() {
	return <ListingsPage />
}
