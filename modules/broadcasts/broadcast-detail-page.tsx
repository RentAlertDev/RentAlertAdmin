'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
	ArrowDownUp,
	ArrowLeft,
	CheckCircle2,
	CircleOff,
	Trash2,
	XCircle
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

import { api } from '@/shared/api/http-client'
import { APP_ROUTES } from '@/shared/config/routes'
import { formatDateTime } from '@/shared/lib/format'
import type { Broadcast, BroadcastRecipient, Page } from '@/shared/model/types'
import {
	DetailHeaderSkeleton,
	EmptyState,
	ErrorState,
	TableSkeleton
} from '@/shared/ui/page-state'
import { Pagination } from '@/shared/ui/pagination'

const statusInfo = {
	SENT: {
		label: 'Отправлено',
		className: 'bg-emerald-50 text-emerald-700',
		icon: CheckCircle2
	},
	FAILED: {
		label: 'Ошибка',
		className: 'bg-red-50 text-red-700',
		icon: XCircle
	},
	SKIPPED: {
		label: 'Пропущено',
		className: 'bg-slate-100 text-slate-600',
		icon: CircleOff
	}
} as const

export function BroadcastDetailPage({ broadcastId }: { broadcastId: string }) {
	const [page, setPage] = useState(0)
	const [pageSize, setPageSize] = useState(50)
	const [sort, setSort] = useState('createdAt,asc')
	const [confirmDelete, setConfirmDelete] = useState(false)
	const queryClient = useQueryClient()
	const router = useRouter()
	const detail = useQuery({
		queryKey: ['broadcast', broadcastId],
		queryFn: () =>
			api
				.get<Broadcast>(`/notifications/broadcasts/${broadcastId}`)
				.then(response => response.data)
	})
	const recipients = useQuery({
		queryKey: ['broadcast-recipients', broadcastId, page, pageSize, sort],
		queryFn: () =>
			api
				.get<
					Page<BroadcastRecipient>
				>(`/notifications/broadcasts/${broadcastId}/recipients`, { params: { page, size: pageSize, sort } })
				.then(response => response.data),
		enabled: !detail.isLoading && !detail.isError
	})
	const changePageSize = (value: number) => {
		setPageSize(value)
		setPage(0)
	}
	const removeBroadcast = useMutation({
		mutationFn: () =>
			api.delete(`/notifications/broadcasts/${broadcastId}`),
		onSuccess: () => {
			toast.success('Рассылка удалена из истории')
			queryClient.invalidateQueries({ queryKey: ['broadcasts'] })
			router.replace(APP_ROUTES.ADMIN.BROADCASTS)
		},
		onError: () => toast.error('Не удалось удалить рассылку')
	})
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
	if (detail.isLoading)
		return (
			<div className='space-y-6'>
				<DetailHeaderSkeleton />
			</div>
		)
	if (detail.isError || !detail.data) return <ErrorState />
	const broadcast = detail.data
	return (
		<div className='space-y-6'>
			<div className='flex flex-wrap items-center justify-between gap-3'>
				<div className='flex items-center gap-3'>
					<Link
						href={APP_ROUTES.ADMIN.BROADCASTS}
						className='btn btn-soft !p-2'
						aria-label='Назад к рассылкам'
						title='Назад к рассылкам'
					>
						<ArrowLeft size={18} />
					</Link>
					<div>
						<h1 className='text-3xl font-bold'>
							Рассылка #{broadcast.id}
						</h1>
						<p className='mt-1 text-slate-500'>
							{formatDateTime(broadcast.createdAt)}
						</p>
					</div>
				</div>
				<button
					className='btn bg-red-600 text-white hover:bg-red-700'
					disabled={removeBroadcast.isPending}
					onClick={() => setConfirmDelete(true)}
				>
					<Trash2 size={17} /> Удалить рассылку
				</button>
			</div>
			<section className='card p-6'>
				<div className='grid gap-5 md:grid-cols-4'>
					<div className='md:col-span-4'>
						<div className='mb-2 text-xs font-bold uppercase tracking-wide text-slate-400'>
							Сообщение
						</div>
						<p className='whitespace-pre-wrap break-words'>
							{broadcast.message}
						</p>
					</div>
					<div>
						<div className='text-xs text-slate-400'>Автор</div>
						<b>@{broadcast.createdByUsername || 'без username'}</b>
						<div className='text-xs text-slate-400'>
							ID {broadcast.createdByUserId}
						</div>
					</div>
					<div>
						<div className='text-xs text-slate-400'>
							Всего получателей
						</div>
						<b className='text-xl'>{broadcast.totalRecipients}</b>
					</div>
					<div>
						<div className='text-xs text-slate-400'>Доставлено</div>
						<b className='text-xl text-emerald-600'>
							{broadcast.sent}
						</b>
					</div>
					<div>
						<div className='text-xs text-slate-400'>
							Ошибки / пропущено
						</div>
						<b className='text-xl'>
							<span className='text-red-600'>
								{broadcast.failed}
							</span>{' '}
							/{' '}
							<span className='text-slate-500'>
								{broadcast.skipped}
							</span>
						</b>
					</div>
				</div>
			</section>
			<section className='card'>
				<div className='p-5'>
					<h2 className='text-lg font-bold'>Получатели</h2>
					<p className='mt-1 text-sm text-slate-500'>
						Результат доставки для каждого пользователя
					</p>
				</div>
				{recipients.isError ? (
					<ErrorState />
				) : (
					<div className='table-wrap'>
						<table className='data-table'>
							<thead>
								<tr>
									<th>
										{sortButton('Пользователь', 'username')}
									</th>
									<th>{sortButton('Статус', 'status')}</th>
									<th>Причина</th>
									<th>{sortButton('Дата', 'createdAt')}</th>
								</tr>
							</thead>
							<tbody>
								{recipients.isLoading ? (
									<TableSkeleton columns={4} />
								) : !recipients.data?.content?.length ? (
									<tr>
										<td colSpan={4}>
											<EmptyState message='Получатели отсутствуют' />
										</td>
									</tr>
								) : (
									recipients.data.content.map(recipient => {
									const info = statusInfo[recipient.status]
									const Icon = info.icon
									return (
										<tr key={recipient.id}>
											<td>
												<Link
													className='block hover:text-indigo-600'
													href={APP_ROUTES.ADMIN.user(
														recipient.userId
													)}
												>
													<b>
														@
														{recipient.username ||
															'без username'}
													</b>
													<div className='text-xs text-slate-400'>
														ID {recipient.userId}
													</div>
													{recipient.photoUrl && (
														<div className='max-w-xs truncate text-xs text-slate-400'>
															{recipient.photoUrl}
														</div>
													)}
												</Link>
											</td>
											<td>
												<span
													className={`badge gap-1 ${info.className}`}
												>
													<Icon size={14} />
													{info.label}
												</span>
											</td>
											<td className='max-w-md whitespace-normal break-words'>
												{recipient.errorMessage || '—'}
											</td>
											<td className='whitespace-nowrap'>
												{formatDateTime(
													recipient.createdAt
												)}
											</td>
										</tr>
									)
									})
								)}
							</tbody>
						</table>
					</div>
				)}
				<Pagination
					page={page}
					totalPages={recipients.data?.totalPages || 0}
					onChange={setPage}
					pageSize={pageSize}
					onPageSizeChange={changePageSize}
				/>
			</section>
			{confirmDelete && (
				<div
					className='fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-5'
					role='presentation'
					onMouseDown={event =>
						event.target === event.currentTarget &&
						setConfirmDelete(false)
					}
				>
					<div
						className='card w-full max-w-md p-6'
						role='dialog'
						aria-modal='true'
						aria-labelledby='broadcast-delete-title'
					>
						<h2
							id='broadcast-delete-title'
							className='text-xl font-bold'
						>
							Удалить рассылку?
						</h2>
						<p className='my-3 text-slate-500'>
							Рассылка и все результаты по получателям будут
							удалены без возможности восстановления.
						</p>
						<div className='flex justify-end gap-2'>
							<button
								className='btn btn-soft'
								onClick={() => setConfirmDelete(false)}
							>
								Отмена
							</button>
							<button
								className='btn bg-red-600 text-white hover:bg-red-700'
								disabled={removeBroadcast.isPending}
								onClick={() => removeBroadcast.mutate()}
							>
								<Trash2 size={17} />
								{removeBroadcast.isPending
									? 'Удаление...'
									: 'Удалить'}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}
