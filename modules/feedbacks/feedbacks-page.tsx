'use client'

import { useQuery } from '@tanstack/react-query'
import { ArrowDownUp, ChevronDown, ChevronUp, Star } from 'lucide-react'
import { useState } from 'react'

import { api } from '@/shared/api/http-client'
import { formatDateTime } from '@/shared/lib/format'
import {
	type SpringPageResponse,
	normalizePage
} from '@/shared/lib/normalize-page'
import type { Feedback } from '@/shared/model/types'
import { EmptyState, ErrorState, LoadingState } from '@/shared/ui/page-state'
import { Pagination } from '@/shared/ui/pagination'

export function FeedbacksPage() {
	const [page, setPage] = useState(0)
	const [pageSize, setPageSize] = useState(20)
	const [sort, setSort] = useState('createdAt,desc')
	const [open, setOpen] = useState<Set<number>>(new Set())
	const query = useQuery({
		queryKey: ['feedbacks', page, pageSize, sort],
		queryFn: () =>
			api
				.get<SpringPageResponse<Feedback>>('/feedbacks', {
					params: { page, size: pageSize, sort }
				})
				.then(r => normalizePage(r.data))
	})
	const toggleSort = (field: string) =>
		setSort(s => (s === `${field},desc` ? `${field},asc` : `${field},desc`))
	const changePageSize = (value: number) => {
		setPageSize(value)
		setPage(0)
	}
	return (
		<div className='space-y-6'>
			<div>
				<h1 className='text-3xl font-bold'>Отзывы</h1>
				<p className='mt-1 text-slate-500'>
					Отзывы пользователей в режиме только для чтения
				</p>
			</div>
			<section className='card'>
				{query.isLoading ? (
					<LoadingState />
				) : query.isError ? (
					<ErrorState />
				) : !query.data?.content?.length ? (
					<EmptyState message='Отзывов пока нет' />
				) : (
					<div className='table-wrap'>
						<table className='data-table table-fixed'>
							<colgroup>
								<col className='w-[18%]' />
								<col className='w-[14%]' />
								<col />
								<col className='w-[19%]' />
							</colgroup>
							<thead>
								<tr>
									<th>
										<button
											className='flex items-center gap-1'
											onClick={() =>
												toggleSort('username')
											}
										>
											Автор <ArrowDownUp size={14} />
										</button>
									</th>
									<th>
										<button
											className='flex items-center gap-1'
											onClick={() => toggleSort('rating')}
										>
											Оценка <ArrowDownUp size={14} />
										</button>
									</th>
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
								</tr>
							</thead>
							<tbody>
								{query.data.content.map(f => {
									const expanded = open.has(f.id)
									return (
										<tr key={f.id}>
											<td className='overflow-hidden'>
												<b className='block truncate'>
													@
													{f.username ||
														'без username'}
												</b>
												<div className='text-xs text-slate-400'>
													ID {f.userId}
												</div>
											</td>
											<td>
												<div className='flex text-amber-400'>
													{[1, 2, 3, 4, 5].map(x => (
														<Star
															key={x}
															size={17}
															fill={
																x <= f.rating
																	? 'currentColor'
																	: 'none'
															}
															className={
																x > f.rating
																	? 'text-slate-200'
																	: ''
															}
														/>
													))}
												</div>
											</td>
											<td className='min-w-0 overflow-hidden'>
												<p
													className={`break-all whitespace-normal ${expanded ? '' : 'line-clamp-2'}`}
												>
													{f.message}
												</p>
												{f.message?.length > 120 && (
													<button
														className='mt-1 flex items-center gap-1 text-xs font-bold text-indigo-600'
														onClick={() =>
															setOpen(x => {
																const n =
																	new Set(x)
																if (n.has(f.id))
																	n.delete(
																		f.id
																	)
																else n.add(f.id)
																return n
															})
														}
													>
														{expanded ? (
															<>
																<ChevronUp
																	size={14}
																/>
																Свернуть
															</>
														) : (
															<>
																<ChevronDown
																	size={14}
																/>
																Показать целиком
															</>
														)}
													</button>
												)}
											</td>
											<td className='whitespace-nowrap'>
												<div>
													{formatDateTime(
														f.createdAt
													)}
												</div>
												{f.updatedAt &&
													f.updatedAt !==
														f.createdAt && (
														<div className='text-xs text-slate-400'>
															изм.{' '}
															{formatDateTime(
																f.updatedAt
															)}
														</div>
													)}
											</td>
										</tr>
									)
								})}
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
