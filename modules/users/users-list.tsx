'use client'

import { useQuery } from '@tanstack/react-query'
import { ArrowDownUp, Search, SlidersHorizontal, Star } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'

import { api } from '@/shared/api/http-client'
import { APP_ROUTES } from '@/shared/config/routes'
import { useDebouncedValue } from '@/shared/hooks/use-debounced-value'
import { formatDate, formatDateTime, initials } from '@/shared/lib/format'
import {
	type SpringPageResponse,
	normalizePage
} from '@/shared/lib/normalize-page'
import type { UserProfile } from '@/shared/model/types'
import { EmptyState, ErrorState, TableSkeleton } from '@/shared/ui/page-state'
import { Pagination } from '@/shared/ui/pagination'
import { RefreshButton } from '@/shared/ui/refresh-button'

export function UsersList() {
	const [page, setPage] = useState(0)
	const [pageSize, setPageSize] = useState(20)
	const [sort, setSort] = useState('id,desc')
	const [search, setSearch] = useState('')
	const debouncedSearch = useDebouncedValue(search)
	const filter = debouncedSearch.trim()
	const query = useQuery({
		queryKey: ['profiles', page, pageSize, sort, filter],
		queryFn: () =>
			api
				.get<SpringPageResponse<UserProfile>>('/profiles', {
					params: {
						page,
						size: pageSize,
						sort,
						...(filter ? { filter } : {})
					}
				})
				.then(r => normalizePage(r.data))
	})
	const changePageSize = (value: number) => {
		setPageSize(value)
		setPage(0)
	}
	const changeSearch = (value: string) => {
		setSearch(value)
		setPage(0)
	}
	const toggleSort = (field: string) => {
		setPage(0)
		setSort(current =>
			current === `${field},desc` ? `${field},asc` : `${field},desc`
		)
	}
	const users = query.data?.content || []
	return (
		<div className='space-y-6'>
			<div>
				<h1 className='text-3xl font-bold'>Профили пользователей</h1>
				<p className='mt-1 text-slate-500'>
					Все пользователи RentAlert и их текущее состояние
				</p>
			</div>
			<div className='card'>
				<div className='flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4'>
					<div className='relative w-full max-w-sm'>
						<Search
							className='absolute left-3 top-3 text-slate-400'
							size={18}
						/>
						<input
							className='field !pl-10'
							placeholder='Поиск по username…'
							value={search}
							onChange={e => changeSearch(e.target.value)}
						/>
					</div>
					<div className='flex items-center gap-3'>
						<span className='text-sm text-slate-500'>
							Всего: {query.data?.totalElements ?? 0}
						</span>
						<RefreshButton
							queryKey={[
								'profiles',
								page,
								pageSize,
								sort,
								filter
							]}
						/>
					</div>
				</div>
				{query.isError ? (
					<ErrorState />
				) : (
					<div className='table-wrap'>
						<table className='data-table'>
							<thead>
								<tr>
									<th>
										<button
											className='flex items-center gap-1'
											onClick={() =>
												toggleSort('username')
											}
										>
											Пользователь{' '}
											<ArrowDownUp size={14} />
										</button>
									</th>
									<th>Статус бота</th>
									<th>
										<button
											className='flex items-center gap-1'
											onClick={() =>
												toggleSort('registeredAt')
											}
										>
											Дата регистрации{' '}
											<ArrowDownUp size={14} />
										</button>
									</th>
									<th>
										<button
											className='flex items-center gap-1'
											onClick={() =>
												toggleSort('lastLogin')
											}
										>
											Последний вход{' '}
											<ArrowDownUp size={14} />
										</button>
									</th>
									<th>Тихие часы</th>
									<th>Активность</th>
									<th>Действия</th>
								</tr>
							</thead>
							<tbody>
								{query.isLoading ? (
									<TableSkeleton columns={7} />
								) : users.length === 0 ? (
									<tr>
										<td colSpan={7}>
											<EmptyState message='Пользователи не найдены' />
										</td>
									</tr>
								) : (
									users.map(u => (
										<tr key={u.userId}>
											<td>
												<div className='flex items-center gap-3'>
													{u.photoUrl ? (
														<Image
															src={u.photoUrl}
															alt=''
															width={40}
															height={40}
															unoptimized
															className='h-10 w-10 rounded-full object-cover'
														/>
													) : (
														<span className='grid h-10 w-10 place-items-center rounded-full bg-indigo-100 font-bold text-indigo-700'>
															{initials(
																u.username
															)}
														</span>
													)}
													<div>
														<b>
															@
															{u.username ||
																'без username'}
														</b>
														<div className='text-xs text-slate-400'>
															ID {u.userId}
														</div>
													</div>
												</div>
											</td>
											<td>
												<Status value={u.botStatus} />
											</td>
											<td className='whitespace-nowrap'>
												{formatDate(u.registeredAt)}
											</td>
											<td>
												{formatDateTime(u.lastLogin)}
											</td>
											<td>
												{u.quietFrom && u.quietTo
													? `${u.quietFrom} – ${u.quietTo}`
													: '—'}
											</td>
											<td>
												<ActivityBadges user={u} />
											</td>
											<td>
												<Link
													className='btn btn-soft'
													href={APP_ROUTES.ADMIN.user(
														u.userId
													)}
												>
													Профиль 360°
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
					totalPages={query.data?.totalPages || 0}
					onChange={setPage}
					pageSize={pageSize}
					onPageSizeChange={changePageSize}
				/>
			</div>
		</div>
	)
}
function ActivityBadges({ user }: { user: UserProfile }) {
	const filters = user.activeFilters?.length ?? 0
	const feedbacks = user.recentFeedbacks ?? []
	const avg = feedbacks.length
		? feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length
		: null
	if (!filters && avg == null)
		return <span className='text-slate-300'>—</span>
	return (
		<div className='flex flex-wrap items-center gap-2'>
			{filters > 0 && (
				<span
					className='badge gap-1 bg-indigo-50 text-indigo-700'
					title='Активные фильтры'
				>
					<SlidersHorizontal size={13} />
					{filters}
				</span>
			)}
			{avg != null && (
				<span
					className='badge gap-1 bg-amber-50 text-amber-700'
					title='Средний рейтинг последних отзывов'
				>
					<Star size={13} fill='currentColor' />
					{avg.toFixed(1)}
				</span>
			)}
		</div>
	)
}
export function Status({ value }: { value: string }) {
	const c =
		value === 'ACTIVE'
			? 'bg-emerald-50 text-emerald-700'
			: value === 'PAUSED'
				? 'bg-amber-50 text-amber-700'
				: 'bg-slate-100 text-slate-600'
	return <span className={`badge ${c}`}>{value}</span>
}
