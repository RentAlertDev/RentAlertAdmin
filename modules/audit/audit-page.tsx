'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
	ArrowDownUp,
	ChevronDown,
	ChevronUp,
	ClipboardList,
	Trash2
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { api } from '@/shared/api/http-client'
import { formatDateTime } from '@/shared/lib/format'
import type { AuditLog, Page } from '@/shared/model/types'
import { EmptyState, ErrorState, LoadingState } from '@/shared/ui/page-state'
import { Pagination } from '@/shared/ui/pagination'

type Initiator = 'ALL' | 'INTERNAL' | 'USER' | 'ADMIN'

const initiatorStyles: Record<string, string> = {
	INTERNAL: 'bg-slate-100 text-slate-600',
	USER: 'bg-emerald-50 text-emerald-700',
	ADMIN: 'bg-blue-50 text-blue-700'
}

export function AuditPage() {
	const [page, setPage] = useState(0)
	const [pageSize, setPageSize] = useState(20)
	const [sort, setSort] = useState('createdAt,desc')
	const [initiator, setInitiator] = useState<Initiator>('ALL')
	const [open, setOpen] = useState<Set<number>>(new Set())
	const [showCleanup, setShowCleanup] = useState(false)
	const [retentionDays, setRetentionDays] = useState(4)
	const queryClient = useQueryClient()
	const audit = useQuery({
		queryKey: ['audit', page, pageSize, sort, initiator],
		queryFn: () =>
			api
				.get<Page<AuditLog>>('/audit-logs', {
					params: {
						page,
						size: pageSize,
						sort,
						...(initiator !== 'ALL'
							? { eventInitiator: initiator }
							: {})
					}
				})
				.then(response => response.data)
	})
	const cleanup = useMutation({
		mutationFn: () =>
			api.delete<number>('/audit-logs', { params: { retentionDays } }),
		onSuccess: response => {
			toast.success(`Удалено записей: ${response.data}`)
			setShowCleanup(false)
			queryClient.invalidateQueries({ queryKey: ['audit'] })
		},
		onError: () => toast.error('Не удалось очистить журнал')
	})
	const toggleSort = (field: string) => {
		setPage(0)
		setSort(current =>
			current === `${field},desc` ? `${field},asc` : `${field},desc`
		)
	}
	const changeInitiator = (value: Initiator) => {
		setInitiator(value)
		setPage(0)
	}
	const changePageSize = (value: number) => {
		setPageSize(value)
		setPage(0)
	}
	const toggleOpen = (id: number) =>
		setOpen(current => {
			const next = new Set(current)
			if (next.has(id)) next.delete(id)
			else next.add(id)
			return next
		})

	return (
		<div className='space-y-6'>
			<div className='flex flex-wrap items-start justify-between gap-4'>
				<div>
					<h1 className='text-3xl font-bold'>Аудит</h1>
					<p className='mt-1 text-slate-500'>
						История действий пользователей, администраторов и системы
					</p>
				</div>
				<button
					className='btn btn-soft text-red-600'
					onClick={() => setShowCleanup(true)}
				>
					<Trash2 size={17} />
					Очистить журнал
				</button>
			</div>

			<section className='card'>
				<div className='flex flex-wrap items-end gap-4 border-b border-slate-100 p-5'>
					<label className='min-w-48 text-sm font-semibold'>
						<span className='mb-2 block text-slate-500'>Инициатор</span>
						<select
							className='field'
							value={initiator}
							onChange={event =>
								changeInitiator(event.target.value as Initiator)
							}
						>
							<option value='ALL'>Все события</option>
							<option value='USER'>Пользователь</option>
							<option value='ADMIN'>Администратор</option>
							<option value='INTERNAL'>Система</option>
						</select>
					</label>
					<div className='flex items-center gap-2 text-sm text-slate-500'>
						<ClipboardList size={18} />
						{audit.data?.totalElements ?? 0} записей
					</div>
				</div>
				{audit.isLoading ? (
					<LoadingState />
				) : audit.isError ? (
					<ErrorState />
				) : !audit.data?.content?.length ? (
					<EmptyState message='Записей аудита пока нет' />
				) : (
					<div className='table-wrap'>
						<table className='data-table table-fixed'>
							<colgroup>
								<col className='w-[22%]' />
								<col />
								<col className='w-[15%]' />
								<col className='w-[13%]' />
								<col className='w-[19%]' />
							</colgroup>
							<thead>
								<tr>
									<th>Событие</th>
									<th>Описание</th>
									<th>Инициатор</th>
									<th>Статус</th>
									<th>
										<button
											className='flex items-center gap-1'
											onClick={() => toggleSort('createdAt')}
										>
											Дата <ArrowDownUp size={14} />
										</button>
									</th>
								</tr>
							</thead>
							<tbody>
								{audit.data.content.map(event => {
									const expanded = open.has(event.id)
									const description = event.eventDescription || '—'
									return (
										<tr key={event.id}>
											<td className='overflow-hidden'>
												<b className='block break-words'>
													{event.eventName || 'Без названия'}
												</b>
												<div className='text-xs text-slate-400'>
													ID {event.id}
												</div>
											</td>
											<td className='min-w-0 overflow-hidden'>
												<p className={`break-words whitespace-normal ${expanded ? '' : 'line-clamp-2'}`}>
													{description}
												</p>
												{description.length > 120 && (
													<button
													className='mt-1 flex items-center gap-1 text-xs font-bold text-indigo-600'
														onClick={() => toggleOpen(event.id)}
													>
														{expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
														{expanded ? 'Свернуть' : 'Показать целиком'}
													</button>
												)}
											</td>
											<td>
												<span className={`badge ${initiatorStyles[event.eventInitiator] || 'bg-slate-100 text-slate-600'}`}>
													{event.eventInitiator || '—'}
												</span>
											</td>
											<td>{event.eventStatus || '—'}</td>
											<td className='whitespace-nowrap'>{formatDateTime(event.createdAt)}</td>
										</tr>
									)
								})}
							</tbody>
						</table>
					</div>
				)}
				<Pagination
					page={page}
					totalPages={audit.data?.totalPages || 0}
					onChange={setPage}
					pageSize={pageSize}
					onPageSizeChange={changePageSize}
				/>
			</section>

			{showCleanup && (
				<div className='fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-5'>
					<div className='card w-full max-w-md p-6' role='dialog' aria-modal='true' aria-labelledby='audit-cleanup-title'>
						<h2 id='audit-cleanup-title' className='text-xl font-bold'>
							Очистить журнал аудита?
						</h2>
						<p className='my-3 text-slate-500'>
							Будут удалены записи старше указанного срока. Операцию нельзя отменить.
						</p>
						<label className='block text-sm font-semibold'>
							Хранить записи не старше, дней
							<input
								className='field mt-2'
								type='number'
								min={1}
								value={retentionDays}
								onChange={event => setRetentionDays(Number(event.target.value))}
							/>
						</label>
						<div className='mt-5 flex justify-end gap-2'>
							<button className='btn btn-soft' onClick={() => setShowCleanup(false)}>
								Отмена
							</button>
							<button
								className='btn bg-red-600 text-white'
								disabled={cleanup.isPending || retentionDays < 1}
								onClick={() => cleanup.mutate()}
							>
								Очистить
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}