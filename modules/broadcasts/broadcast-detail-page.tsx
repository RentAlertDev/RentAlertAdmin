'use client'

import { useQuery } from '@tanstack/react-query'
import { ArrowDownUp, ArrowLeft, CheckCircle2, CircleOff, XCircle } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

import { api } from '@/shared/api/http-client'
import { APP_ROUTES } from '@/shared/config/routes'
import { formatDateTime } from '@/shared/lib/format'
import type { Broadcast, BroadcastRecipient, Page } from '@/shared/model/types'
import { EmptyState, ErrorState, LoadingState } from '@/shared/ui/page-state'
import { Pagination } from '@/shared/ui/pagination'

const statusInfo = {
	SENT: { label: 'Отправлено', className: 'bg-emerald-50 text-emerald-700', icon: CheckCircle2 },
	FAILED: { label: 'Ошибка', className: 'bg-red-50 text-red-700', icon: XCircle },
	SKIPPED: { label: 'Пропущено', className: 'bg-slate-100 text-slate-600', icon: CircleOff }
} as const

export function BroadcastDetailPage({ broadcastId }: { broadcastId: string }) {
	const [page, setPage] = useState(0)
	const [sort, setSort] = useState('createdAt,asc')
	const detail = useQuery({
		queryKey: ['broadcast', broadcastId],
		queryFn: () => api.get<Broadcast>(`/notifications/broadcasts/${broadcastId}`).then(response => response.data)
	})
	const recipients = useQuery({
		queryKey: ['broadcast-recipients', broadcastId, page, sort],
		queryFn: () => api.get<Page<BroadcastRecipient>>(`/notifications/broadcasts/${broadcastId}/recipients`, { params: { page, size: 50, sort } }).then(response => response.data),
		enabled: !detail.isLoading && !detail.isError
	})
	const toggleSort = (field: string) => {
		setPage(0)
		setSort(current =>
			current === `${field},desc` ? `${field},asc` : `${field},desc`
		)
	}
	const sortButton = (label: string, field: string) => (
		<button className='flex items-center gap-1' onClick={() => toggleSort(field)}>
			{label} <ArrowDownUp size={14} />
		</button>
	)
	if (detail.isLoading) return <LoadingState />
	if (detail.isError || !detail.data) return <ErrorState />
	const broadcast = detail.data
	return (
		<div className='space-y-6'>
			<div className='flex items-center gap-3'>
				<Link href={APP_ROUTES.ADMIN.BROADCASTS} className='btn btn-soft !p-2' aria-label='Назад к рассылкам' title='Назад к рассылкам'><ArrowLeft size={18} /></Link>
				<div><h1 className='text-3xl font-bold'>Рассылка #{broadcast.id}</h1><p className='mt-1 text-slate-500'>{formatDateTime(broadcast.createdAt)}</p></div>
			</div>
			<section className='card p-6'>
				<div className='grid gap-5 md:grid-cols-4'>
					<div className='md:col-span-4'><div className='mb-2 text-xs font-bold uppercase tracking-wide text-slate-400'>Сообщение</div><p className='whitespace-pre-wrap break-words'>{broadcast.message}</p></div>
					<div><div className='text-xs text-slate-400'>Автор</div><b>@{broadcast.createdByUsername || 'без username'}</b><div className='text-xs text-slate-400'>ID {broadcast.createdByUserId}</div></div>
					<div><div className='text-xs text-slate-400'>Всего получателей</div><b className='text-xl'>{broadcast.totalRecipients}</b></div>
					<div><div className='text-xs text-slate-400'>Доставлено</div><b className='text-xl text-emerald-600'>{broadcast.sent}</b></div>
					<div><div className='text-xs text-slate-400'>Ошибки / пропущено</div><b className='text-xl'><span className='text-red-600'>{broadcast.failed}</span> / <span className='text-slate-500'>{broadcast.skipped}</span></b></div>
				</div>
			</section>
			<section className='card'>
				<div className='p-5'><h2 className='text-lg font-bold'>Получатели</h2><p className='mt-1 text-sm text-slate-500'>Результат доставки для каждого пользователя</p></div>
				{recipients.isLoading ? <LoadingState /> : recipients.isError ? <ErrorState /> : !recipients.data?.content?.length ? <EmptyState message='Получатели отсутствуют' /> : (
					<div className='table-wrap'><table className='data-table'><thead><tr><th>{sortButton('Пользователь', 'username')}</th><th>{sortButton('Статус', 'status')}</th><th>Причина</th><th>{sortButton('Дата', 'createdAt')}</th></tr></thead><tbody>{recipients.data.content.map(recipient => {
						const info = statusInfo[recipient.status]
						const Icon = info.icon
						return <tr key={recipient.id}><td><b>@{recipient.username || 'без username'}</b><div className='text-xs text-slate-400'>ID {recipient.userId}</div>{recipient.photoUrl && <div className='max-w-xs truncate text-xs text-slate-400'>{recipient.photoUrl}</div>}</td><td><span className={`badge gap-1 ${info.className}`}><Icon size={14} />{info.label}</span></td><td className='max-w-md whitespace-normal break-words'>{recipient.errorMessage || '—'}</td><td className='whitespace-nowrap'>{formatDateTime(recipient.createdAt)}</td></tr>
					})}</tbody></table></div>
				)}
				<Pagination page={page} totalPages={recipients.data?.totalPages || 0} onChange={setPage} />
			</section>
		</div>
	)
}
