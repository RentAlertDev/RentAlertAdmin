'use client'

import { useQuery } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useMemo, useState } from 'react'

import { api } from '@/shared/api/http-client'
import { APP_ROUTES } from '@/shared/config/routes'
import { useDebouncedValue } from '@/shared/hooks/use-debounced-value'
import { formatDateTime, initials } from '@/shared/lib/format'
import type { Page, UserProfile } from '@/shared/model/types'
import { EmptyState, ErrorState, LoadingState } from '@/shared/ui/page-state'
import { Pagination } from '@/shared/ui/pagination'

export function UsersList() {
	const [page, setPage] = useState(0)
	const [search, setSearch] = useState('')
	const debouncedSearch = useDebouncedValue(search)
	const query = useQuery({
		queryKey: ['profiles', page],
		queryFn: () =>
			api
				.get<
					Page<UserProfile>
				>('/profiles', { params: { page, size: 20 } })
				.then(r => r.data)
	})
	const users = useMemo(
		() =>
			query.data?.content?.filter(u =>
				(u.username || '')
					.toLowerCase()
					.includes(debouncedSearch.trim().toLowerCase())
			) || [],
		[query.data, debouncedSearch]
	)
	return (
		<div className='space-y-6'>
			<div>
				<h1 className='text-3xl font-bold'>Профили пользователей</h1>
				<p className='mt-1 text-slate-500'>
					Все пользователи RentAlert и их текущее состояние
				</p>
			</div>
			<div className='card'>
				<div className='flex items-center justify-between gap-3 border-b border-slate-100 p-4'>
					<div className='relative w-full max-w-sm'>
						<Search
							className='absolute left-3 top-3 text-slate-400'
							size={18}
						/>
						<input
							className='field !pl-10'
							placeholder='Поиск по username…'
							value={search}
							onChange={e => setSearch(e.target.value)}
						/>
					</div>
					<span className='text-sm text-slate-500'>
						Всего: {query.data?.totalElements || 0}
					</span>
				</div>
				{query.isLoading ? (
					<LoadingState />
				) : query.isError ? (
					<ErrorState />
				) : users.length === 0 ? (
					<EmptyState message='Пользователи не найдены' />
				) : (
					<div className='table-wrap'>
						<table className='data-table'>
							<thead>
								<tr>
									<th>Пользователь</th>
									<th>Статус бота</th>
									<th>Последний вход</th>
									<th>Тихие часы</th>
									<th>Действия</th>
								</tr>
							</thead>
							<tbody>
								{users.map(u => (
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
														{initials(u.username)}
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
										<td>{formatDateTime(u.lastLogin)}</td>
										<td>
											{u.quietFrom && u.quietTo
												? `${u.quietFrom} – ${u.quietTo}`
												: '—'}
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
								))}
							</tbody>
						</table>
					</div>
				)}
				<Pagination
					page={page}
					totalPages={query.data?.totalPages || 0}
					onChange={setPage}
				/>
			</div>
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
