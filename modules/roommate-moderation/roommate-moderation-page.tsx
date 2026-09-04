'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
	ArrowDownUp,
	Building2,
	Check,
	ChevronDown,
	ChevronUp,
	FileText,
	Flag,
	User,
	X
} from 'lucide-react'
import { Fragment, useState } from 'react'
import { toast } from 'sonner'

import { api } from '@/shared/api/http-client'
import { apiErrorMessage, apiStatus } from '@/shared/lib/api-error'
import { formatDateTime } from '@/shared/lib/format'
import {
	type SpringPageResponse,
	normalizePage
} from '@/shared/lib/normalize-page'
import type { Page, RoommateModerationTask } from '@/shared/model/types'
import { EmptyState, ErrorState, TableSkeleton } from '@/shared/ui/page-state'
import { Pagination } from '@/shared/ui/pagination'
import { RefreshButton } from '@/shared/ui/refresh-button'

const QUERY_KEY = 'roommate-moderation-queue'
const COLUMNS = 5

type Action = 'approve' | 'reject'
type DecideVars = {
	task: RoommateModerationTask
	action: Action
	reason?: string
}

export function RoommateModerationPage() {
	const [page, setPage] = useState(0)
	const [pageSize, setPageSize] = useState(20)
	const [sort, setSort] = useState('createdAt,asc')
	const [expanded, setExpanded] = useState<Set<number>>(new Set())
	const [reasons, setReasons] = useState<Map<number, string>>(new Map())
	const queryClient = useQueryClient()

	const query = useQuery({
		queryKey: [QUERY_KEY, page, pageSize, sort],
		queryFn: () =>
			api
				.get<
					SpringPageResponse<RoommateModerationTask>
				>('/roommate/moderation/queue', { params: { page, size: pageSize, sort } })
				.then(response => normalizePage(response.data))
	})

	const decide = useMutation({
		mutationFn: ({ task, action, reason }: DecideVars) =>
			api
				.post<RoommateModerationTask>(
					`/roommate/moderation/${task.id}/${action}`,
					reason?.trim() ? { reason: reason.trim() } : {}
				)
				.then(response => response.data),
		onMutate: async ({ task }) => {
			await queryClient.cancelQueries({ queryKey: [QUERY_KEY] })
			const previous = queryClient.getQueriesData<
				Page<RoommateModerationTask>
			>({ queryKey: [QUERY_KEY] })
			queryClient.setQueriesData<Page<RoommateModerationTask>>(
				{ queryKey: [QUERY_KEY] },
				data =>
					data && {
						...data,
						content: data.content.filter(t => t.id !== task.id),
						totalElements: Math.max(0, data.totalElements - 1)
					}
			)
			return { previous }
		},
		onError: (error, { task }, context) => {
			if (apiStatus(error) === 409) {
				toast.error('Эта задача уже обработана другим модератором')
			} else {
				context?.previous?.forEach(([key, data]) =>
					queryClient.setQueryData(key, data)
				)
				toast.error(
					apiErrorMessage(error, 'Не удалось выполнить действие')
				)
			}
			setReasons(current => {
				const next = new Map(current)
				next.delete(task.id)
				return next
			})
		},
		onSuccess: (_, { task, action }) => {
			toast.success(
				action === 'approve' ? 'Задача одобрена' : 'Задача отклонена'
			)
			setReasons(current => {
				const next = new Map(current)
				next.delete(task.id)
				return next
			})
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
		}
	})

	const toggleSort = (field: string) => {
		setPage(0)
		setSort(current =>
			current === `${field},asc` ? `${field},desc` : `${field},asc`
		)
	}
	const changePageSize = (value: number) => {
		setPageSize(value)
		setPage(0)
	}
	const toggleExpand = (id: number) =>
		setExpanded(current => {
			const next = new Set(current)
			if (next.has(id)) next.delete(id)
			else next.add(id)
			return next
		})
	const setReason = (taskId: number, value: string) =>
		setReasons(current => new Map(current).set(taskId, value))

	const isPending = (taskId: number, action: Action) =>
		decide.isPending &&
		decide.variables?.task.id === taskId &&
		decide.variables?.action === action

	return (
		<div className='space-y-6'>
			<div className='flex flex-wrap items-start justify-between gap-4'>
				<div>
					<h1 className='text-3xl font-bold'>
						Очередь модерации: Соседи
					</h1>
					<p className='mt-1 text-slate-500'>
						Проверка текста анкет/объявлений и жалобы пользователей
					</p>
				</div>
				<div className='flex items-center gap-3'>
					<span className='text-sm text-slate-500'>
						Всего: {query.data?.totalElements ?? 0}
					</span>
					<RefreshButton
						queryKey={[QUERY_KEY, page, pageSize, sort]}
					/>
				</div>
			</div>
			<section className='card'>
				{query.isError ? (
					<ErrorState onRetry={() => query.refetch()} />
				) : (
					<div className='table-wrap'>
						<table className='data-table table-fixed'>
							<colgroup>
								<col className='w-[16%]' />
								<col className='w-[16%]' />
								<col />
								<col className='w-[16%]' />
								<col className='w-12' />
							</colgroup>
							<thead>
								<tr>
									<th>Тип</th>
									<th>Проверка</th>
									<th>Текст</th>
									<th>
										<button
											className='flex items-center gap-1'
											onClick={() =>
												toggleSort('createdAt')
											}
										>
											Дата создания{' '}
											<ArrowDownUp size={14} />
										</button>
									</th>
									<th />
								</tr>
							</thead>
							<tbody>
								{query.isLoading ? (
									<TableSkeleton columns={COLUMNS} />
								) : !query.data?.content?.length ? (
									<tr>
										<td colSpan={COLUMNS}>
											<EmptyState message='Очередь пуста, все задачи обработаны' />
										</td>
									</tr>
								) : (
									query.data.content.map(task => {
										const isOpen = expanded.has(task.id)
										const reason =
											reasons.get(task.id) ?? ''
										const isReport = task.field === 'report'
										return (
											<Fragment key={task.id}>
												<tr
													className='cursor-pointer'
													onClick={() =>
														toggleExpand(task.id)
													}
												>
													<td>
														<SubjectBadge
															subjectType={
																task.subjectType
															}
															subjectId={
																task.subjectId
															}
														/>
													</td>
													<td>
														<FieldBadge
															field={task.field}
														/>
													</td>
													<td className='overflow-hidden'>
														<p className='line-clamp-1 whitespace-normal break-words text-slate-500'>
															{isReport
																? `Жалоба на ${
																		task.subjectType ===
																		'PROFILE'
																			? 'анкету'
																			: 'объявление'
																	} #${task.subjectId}`
																: (task.submittedText ??
																	'—')}
														</p>
													</td>
													<td className='whitespace-nowrap'>
														{formatDateTime(
															task.createdAt
														)}
													</td>
													<td>
														<button
															className='btn btn-soft !p-2'
															aria-label={
																isOpen
																	? 'Свернуть'
																	: 'Развернуть'
															}
															onClick={event => {
																event.stopPropagation()
																toggleExpand(
																	task.id
																)
															}}
														>
															{isOpen ? (
																<ChevronUp
																	size={16}
																/>
															) : (
																<ChevronDown
																	size={16}
																/>
															)}
														</button>
													</td>
												</tr>
												{isOpen && (
													<tr>
														<td
															colSpan={COLUMNS}
															className='bg-slate-50'
															onClick={event =>
																event.stopPropagation()
															}
														>
															<div className='space-y-4 p-4'>
																{isReport ? (
																	<p className='text-sm text-slate-600'>
																		Жалоба
																		на{' '}
																		{task.subjectType ===
																		'PROFILE'
																			? 'анкету'
																			: 'объявление'}{' '}
																		#
																		{
																			task.subjectId
																		}
																		: порог
																		в 3
																		жалобы
																		достигнут,
																		объект
																		временно
																		скрыт.
																	</p>
																) : (
																	<p className='rounded-lg bg-white p-3 text-sm whitespace-pre-wrap text-slate-700'>
																		{task.submittedText ||
																			'—'}
																	</p>
																)}
																<label className='block text-sm font-semibold'>
																	Причина
																	{!isReport &&
																		' (обязательна для отклонения)'}
																	<textarea
																		className='field mt-1.5 min-h-20 resize-y font-normal'
																		value={
																			reason
																		}
																		onChange={event =>
																			setReason(
																				task.id,
																				event
																					.target
																					.value
																			)
																		}
																		placeholder={
																			isReport
																				? 'Комментарий к решению (необязательно)'
																				: 'Пользователь увидит эту причину, если текст отклонён'
																		}
																	/>
																</label>
																<div className='flex flex-wrap justify-end gap-2'>
																	<button
																		className='btn bg-red-600 text-white hover:bg-red-700'
																		disabled={
																			!reason.trim() ||
																			decide.isPending
																		}
																		onClick={() =>
																			decide.mutate(
																				{
																					task,
																					action: 'reject',
																					reason
																				}
																			)
																		}
																	>
																		<X
																			size={
																				16
																			}
																		/>
																		{isPending(
																			task.id,
																			'reject'
																		)
																			? 'Выполнение…'
																			: isReport
																				? 'Снять блокировку'
																				: 'Отклонить'}
																	</button>
																	<button
																		className='btn bg-emerald-600 text-white hover:bg-emerald-700'
																		disabled={
																			decide.isPending
																		}
																		onClick={() =>
																			decide.mutate(
																				{
																					task,
																					action: 'approve',
																					reason
																				}
																			)
																		}
																	>
																		<Check
																			size={
																				16
																			}
																		/>
																		{isPending(
																			task.id,
																			'approve'
																		)
																			? 'Выполнение…'
																			: isReport
																				? 'Подтвердить блокировку'
																				: 'Одобрить'}
																	</button>
																</div>
															</div>
														</td>
													</tr>
												)}
											</Fragment>
										)
									})
								)}
							</tbody>
						</table>
					</div>
				)}
				<Pagination
					page={page}
					totalPages={query.data?.totalPages || 0}
					onChange={setPage}
					pageSize={pageSize}
					onPageSizeChange={changePageSize}
				/>
			</section>
		</div>
	)
}

function SubjectBadge({
	subjectType,
	subjectId
}: {
	subjectType: RoommateModerationTask['subjectType']
	subjectId: number
}) {
	const isProfile = subjectType === 'PROFILE'
	return (
		<div className='flex items-center gap-2'>
			<span
				className={`badge gap-1 ${isProfile ? 'bg-indigo-50 text-indigo-700' : 'bg-sky-50 text-sky-700'}`}
			>
				{isProfile ? <User size={12} /> : <Building2 size={12} />}
				{isProfile ? 'Анкета' : 'Объявление'}
			</span>
			<span className='text-xs text-slate-400'>#{subjectId}</span>
		</div>
	)
}

function FieldBadge({ field }: { field: RoommateModerationTask['field'] }) {
	if (field === 'report')
		return (
			<span className='badge gap-1 bg-red-50 text-red-700'>
				<Flag size={12} />
				Жалоба ×3
			</span>
		)
	return (
		<span className='badge gap-1 bg-amber-50 text-amber-700'>
			<FileText size={12} />
			Текст на проверке
		</span>
	)
}
