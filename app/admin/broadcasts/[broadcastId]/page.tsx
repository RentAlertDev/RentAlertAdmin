import { BroadcastDetailPage } from '@/modules/broadcasts/broadcast-detail-page'

export default async function Page({
	params
}: {
	params: Promise<{ broadcastId: string }>
}) {
	return <BroadcastDetailPage broadcastId={(await params).broadcastId} />
}
