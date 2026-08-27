'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { ArrowDownUp, Eye, Megaphone, Send, X } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'

import { RecipientPicker } from './recipient-picker'
import { api } from '@/shared/api/http-client'
import { APP_ROUTES } from '@/shared/config/routes'
import { formatDateTime } from '@/shared/lib/format'
import {
	type SpringPageResponse,
	normalizePage
} from '@/shared/lib/normalize-page'
import type {
	Broadcast,
	BroadcastResult,
	UserProfile
} from '@/shared/model/types'
import { EmptyState, ErrorState, TableSkeleton } from '@/shared/ui/page-state'
import { Pagination } from '@/shared/ui/pagination'

const MAX_RECIPIENTS = 10000

export function BroadcastsPage() {
	const [page, setPage] = useState(0)
	const [pageSize, setPageSize] = useState(20)
	const [sort, setSort] = useState('createdAt,desc')
	const [modalOpen, setModalOpen] = useState(false)
	const [message, setMessage] = useState('')
	const [audience, setAudience] = useState<'ALL' | 'SELECTED'>('ALL')
	const [selected, setSelected] = useState<Map<number, string>>(new Map())
	const queryClient = useQueryClient()
	const broadcasts = useQuery({
		queryKey: ['broadcasts', page, pageSize, sort],
		queryFn: () =>
			api
				.get<SpringPageResponse<Broadcast>>('/notifications/broadcasts', {
					params: { page, size: pageSize, sort }
				})
				.then(response => normalizePage(response.data))
	})
	const changePageSize = (value: number) => {
		setPageSize(value)
		setPage(0)
	}
	const toggleSort = (field: string) => {
		setPage(0)
		setSort(current =>
			current === `${field},desc` ? `${field},asc` : `${field},desc`
		)
	}
	const sortButton = (label: string, field: string) => (
		<button
			className='flex items-center gap-1'
			onClick={() => toggleSort(field)}
		>
			{label} <ArrowDownUp size={14} />
		</button>
	)
	const toggleRecipient = (
		user: Pick<UserProfile, 'userId' | 'username'>
	) =>
		setSelected(current => {
			const next = new Map(current)
			if (next.has(user.userId)) next.delete(user.userId)
			else next.set(user.userId, user.username)
			return next
		})
	const closeModal = () => {
		setModalOpen(false)
		setMessage('')
		setAudience('ALL')
		setSelected(new Map())
	}
	const send = useMutation({
		mutationFn: () => {
			const userIds =
				audience === 'SELECTED' ? [...selected.keys()] : []
			return api
				.post<BroadcastResult>('/notifications/broadcast', {
					message: message.trim(),
					...(userIds.length ? { userIds } : {})
				})
				.then(response => response.data)
		},
		onSuccess: result => {
			toast.success(
				`Рассылка #${result.broadcastId}: получателей ${result.totalRecipients}, ` +
					`доставлено ${result.sent}, ошибок ${result.failed}, пропущено ${result.skipped}`
			)
			closeModal()
			queryClient.invalidateQueries({ queryKey: ['broadcasts'] })
		},
		onError: error => {
			const backendMessage =
				isAxiosError<{ message?: string }>(error) &&
				error.response?.data?.message
			toast.error(backendMessage || 'Не удалось отправить рассылку')
		}
	})
	const tooManyRecipients = selected.size > MAX_RECIPIENTS
	const canSend =
		Boolean(message.trim()) &&
		!send.isPending &&
		(audience === 'ALL' ||
			(selected.size > 0 && !tooManyRecipients))
	return (
		<div className='space-y-6'>
			<div className='flex flex-wrap items-start justify-between gap-4'>
				<div>
					<h1 className='text-3xl font-bold'>Рассылки</h1>
					<p className='mt-1 text-slate-500'>
						История уведомлений пользователям
					</p>
				</div>
				<button
					className='btn btn-primary'
					onClick={() => setModalOpen(true)}
				>
					<Send size={17} /> Отправить уведомление
				</button>
			</div>
			<section className='card'>
				{broadcasts.isError ? (
					<ErrorState />
				) : (
					<div className='table-wrap'>
						<table className='data-table'>
							<thead>
								<tr>
									<th>Сообщение</th>
									<th>
										{sortButton(
											'Автор',
											'createdByUsername'
										)}
									</th>
									<th>
										{sortButton(
											'Получатели',
											'totalRecipients'
										)}
									</th>
									<th>{sortButton('Доставлено', 'sent')}</th>
									<th>{sortButton('Ошибки', 'failed')}</th>
									<th>
										{sortButton('Пропущено', 'skipped')}
									</th>
									<th>
										{sortButton(
											'Дата создания',
											'createdAt'
										)}
									</th>
									<th />
								</tr>
							</thead>
							<tbody>
								{broadcasts.isLoading ? (
									<TableSkeleton columns={8} />
								) : !broadcasts.data?.content?.length ? (
									<tr>
										<td colSpan={8}>
											<EmptyState message='Рассылок пока нет' />
										</td>
									</tr>
								) : (
									broadcasts.data.content.map(broadcast => (
									<tr key={broadcast.id}>
										<td className='max-w-md'>
											<p className='line-clamp-2 whitespace-normal break-words'>
												{broadcast.message}
											</p>
										</td>
										<td>
											<b>
												@
												{broadcast.createdByUsername ||
													'без username'}
											</b>
											<div className='text-xs text-slate-400'>
												ID {broadcast.createdByUserId}
											</div>
										</td>
										<td>{broadcast.totalRecipients}</td>
										<td>
											<span className='badge bg-emerald-50 text-emerald-700'>
												{broadcast.sent}
											</span>
										</td>
										<td>
											<span className='badge bg-red-50 text-red-700'>
												{broadcast.failed}
											</span>
										</td>
										<td>
											<span className='badge bg-slate-100 text-slate-600'>
												{broadcast.skipped}
											</span>
										</td>
										<td className='whitespace-nowrap'>
											{formatDateTime(
												broadcast.createdAt
											)}
										</td>
										<td>
											<Link
												className='btn btn-soft !p-2'
												href={APP_ROUTES.ADMIN.broadcast(
													broadcast.id
												)}
												aria-label='Открыть рассылку'
												title='Открыть рассылку'
											>
												<Eye size={17} />
											</Link>
										</td>
									</tr>
									))
								)}
							</tbody>
						</table>
					</div>
				)}
				<Pagination
					page={page}
					totalPages={broadcasts.data?.totalPages || 0}
					onChange={setPage}
					pageSize={pageSize}
					onPageSizeChange={changePageSize}
				/>
			</section>
			{modalOpen && (
				<div
					className='fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-5'
					role='presentation'
					onMouseDown={event =>
						event.target === event.currentTarget && closeModal()
					}
				>
					<div
						className='card flex max-h-[90vh] w-full max-w-xl flex-col p-6'
						role='dialog'
						aria-modal='true'
						aria-labelledby='broadcast-title'
					>
						<div className='flex items-center justify-between gap-4'>
							<h2
								id='broadcast-title'
								className='text-xl font-bold'
							>
								Новое уведомление
							</h2>
							<button
								className='btn btn-soft !p-2'
								onClick={closeModal}
								aria-label='Закрыть'
							>
								<X size={18} />
							</button>
						</div>
						<div className='-mr-2 mt-5 flex-1 overflow-y-auto pr-2'>
							<label
								className='block text-sm font-semibold'
								htmlFor='broadcast-message'
							>
								Текст сообщения
							</label>
							<textarea
								id='broadcast-message'
								className='field mt-2 min-h-40 resize-y'
								maxLength={4096}
								value={message}
								onChange={event =>
									setMessage(event.target.value)
								}
								placeholder='Введите текст уведомления'
							/>
							<div className='mt-1 text-right text-xs text-slate-400'>
								{message.length} / 4096
							</div>

							<div className='mt-5 text-sm font-semibold'>
								Получатели
							</div>
							<div className='mt-2 flex flex-wrap gap-2'>
								<label className='flex items-center gap-2 text-sm'>
									<input
										type='radio'
										name='broadcast-audience'
										className='h-4 w-4'
										checked={audience === 'ALL'}
										onChange={() => setAudience('ALL')}
									/>
									Всем пользователям
								</label>
								<label className='flex items-center gap-2 text-sm'>
									<input
										type='radio'
										name='broadcast-audience'
										className='h-4 w-4'
										checked={audience === 'SELECTED'}
										onChange={() =>
											setAudience('SELECTED')
										}
									/>
									Выбранным пользователям
								</label>
							</div>
							<p className='mt-1 text-xs text-slate-400'>
								Можно выбрать до {MAX_RECIPIENTS.toLocaleString('ru')}{' '}
								получателей. Администраторы всегда исключаются.
							</p>

							{audience === 'SELECTED' && (
								<RecipientPicker
									selected={selected}
									max={MAX_RECIPIENTS}
									onToggle={toggleRecipient}
									onClear={() => setSelected(new Map())}
								/>
							)}
							{tooManyRecipients && (
								<p className='mt-2 text-sm font-semibold text-red-600'>
									Слишком много получателей — не больше{' '}
									{MAX_RECIPIENTS.toLocaleString('ru')}.
								</p>
							)}
						</div>

						<div className='mt-5 flex justify-end gap-2 border-t border-slate-100 pt-4'>
							<button className='btn btn-soft' onClick={closeModal}>
								Отмена
							</button>
							<button
								className='btn btn-primary'
								disabled={!canSend}
								onClick={() => send.mutate()}
							>
								<Megaphone size={17} />
								{send.isPending
									? 'Отправка...'
									: audience === 'SELECTED'
										? `Отправить выбранным (${selected.size})`
										: 'Отправить всем'}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}
