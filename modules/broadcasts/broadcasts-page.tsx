'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowDownUp, Eye, Megaphone, Send, X } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'

import { api } from '@/shared/api/http-client'
import { APP_ROUTES } from '@/shared/config/routes'
import { formatDateTime } from '@/shared/lib/format'
import type { Broadcast, Page } from '@/shared/model/types'
import { EmptyState, ErrorState, LoadingState } from '@/shared/ui/page-state'
import { Pagination } from '@/shared/ui/pagination'

export function BroadcastsPage() {
	const [page, setPage] = useState(0)
	const [sort, setSort] = useState('createdAt,desc')
	const [modalOpen, setModalOpen] = useState(false)
	const [message, setMessage] = useState('')
	const queryClient = useQueryClient()
	const broadcasts = useQuery({
		queryKey: ['broadcasts', page, sort],
		queryFn: () =>
			api
				.get<Page<Broadcast>>('/notifications/broadcasts', {
					params: { page, size: 20, sort }
				})
				.then(response => response.data)
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
	const send = useMutation({
		mutationFn: () =>
			api.post('/notifications/broadcast', { message: message.trim() }),
		onSuccess: () => {
			toast.success('Рассылка успешно отправлена')
			setMessage('')
			setModalOpen(false)
			queryClient.invalidateQueries({ queryKey: ['broadcasts'] })
		},
		onError: () => toast.error('Не удалось отправить рассылку')
	})
	return (
		<div className='space-y-6'>
			<div className='flex flex-wrap items-start justify-between gap-4'>
				<div>
					<h1 className='text-3xl font-bold'>Рассылки</h1>
					<p className='mt-1 text-slate-500'>История уведомлений пользователям</p>
				</div>
				<button className='btn btn-primary' onClick={() => setModalOpen(true)}>
					<Send size={17} /> Отправить уведомление
				</button>
			</div>
			<section className='card'>
				{broadcasts.isLoading ? <LoadingState /> : broadcasts.isError ? <ErrorState /> : !broadcasts.data?.content?.length ? <EmptyState message='Рассылок пока нет' /> : (
					<div className='table-wrap'>
						<table className='data-table'>
							<thead><tr><th>Сообщение</th><th>Автор</th><th>{sortButton('Получатели', 'totalRecipients')}</th><th>Доставлено</th><th>Ошибки</th><th>Пропущено</th><th>{sortButton('Дата создания', 'createdAt')}</th><th /></tr></thead>
							<tbody>{broadcasts.data.content.map(broadcast => (
								<tr key={broadcast.id}>
									<td className='max-w-md'><p className='line-clamp-2 whitespace-normal break-words'>{broadcast.message}</p></td>
									<td><b>@{broadcast.createdByUsername || 'без username'}</b><div className='text-xs text-slate-400'>ID {broadcast.createdByUserId}</div></td>
									<td>{broadcast.totalRecipients}</td>
									<td><span className='badge bg-emerald-50 text-emerald-700'>{broadcast.sent}</span></td>
									<td><span className='badge bg-red-50 text-red-700'>{broadcast.failed}</span></td>
									<td><span className='badge bg-slate-100 text-slate-600'>{broadcast.skipped}</span></td>
									<td className='whitespace-nowrap'>{formatDateTime(broadcast.createdAt)}</td>
									<td><Link className='btn btn-soft !p-2' href={APP_ROUTES.ADMIN.broadcast(broadcast.id)} aria-label='Открыть рассылку' title='Открыть рассылку'><Eye size={17} /></Link></td>
								</tr>
							))}</tbody>
						</table>
					</div>
				)}
				<Pagination page={page} totalPages={broadcasts.data?.totalPages || 0} onChange={setPage} />
			</section>
			{modalOpen && <div className='fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-5' role='presentation' onMouseDown={event => event.target === event.currentTarget && setModalOpen(false)}>
				<div className='card w-full max-w-xl p-6' role='dialog' aria-modal='true' aria-labelledby='broadcast-title'>
					<div className='flex items-center justify-between gap-4'><h2 id='broadcast-title' className='text-xl font-bold'>Новое уведомление</h2><button className='btn btn-soft !p-2' onClick={() => setModalOpen(false)} aria-label='Закрыть'><X size={18} /></button></div>
					<label className='mt-5 block text-sm font-semibold' htmlFor='broadcast-message'>Текст сообщения</label>
					<textarea id='broadcast-message' className='field mt-2 min-h-40 resize-y' maxLength={4096} value={message} onChange={event => setMessage(event.target.value)} placeholder='Введите текст уведомления' />
					<div className='mt-1 text-right text-xs text-slate-400'>{message.length} / 4096</div>
					<div className='mt-5 flex justify-end gap-2'><button className='btn btn-soft' onClick={() => setModalOpen(false)}>Отмена</button><button className='btn btn-primary' disabled={!message.trim() || send.isPending} onClick={() => send.mutate()}><Megaphone size={17} />{send.isPending ? 'Отправка...' : 'Отправить всем'}</button></div>
				</div>
			</div>}
		</div>
	)
}
