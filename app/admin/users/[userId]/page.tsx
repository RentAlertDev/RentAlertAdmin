import { notFound } from 'next/navigation'

import { UserDetail } from '@/modules/users/user-detail'

export default async function Page({
	params
}: {
	params: Promise<{ userId: string }>
}) {
	const id = Number((await params).userId)
	if (!Number.isFinite(id)) notFound()
	return <UserDetail userId={id} />
}
