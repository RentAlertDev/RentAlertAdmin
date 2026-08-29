'use client'

import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react'
import { useState } from 'react'

import { api } from '@/shared/api/http-client'
import { useDebouncedValue } from '@/shared/hooks/use-debounced-value'
import {
	type SpringPageResponse,
	normalizePage
} from '@/shared/lib/normalize-page'
import type { UserProfile } from '@/shared/model/types'
import { EmptyState, ErrorState, Skeleton } from '@/shared/ui/page-state'

const PAGE_SIZE = 20

export function RecipientPicker({
	selected,
	max,
	onToggle,
	onClear
}: {
	selected: Map<number, string>
	max: number
	onToggle: (user: Pick<UserProfile, 'userId' | 'username'>) => void
	onClear: () => void
}) {
	const [search, setSearch] = useState('')
	const [page, setPage] = useState(0)
	const filter = useDebouncedValue(search).trim()
	const query = useQuery({
		queryKey: ['broadcast-recipient-picker', filter, page],
		queryFn: () =>
			api
				.get<SpringPageResponse<UserProfile>>('/profiles', {
					params: {
						page,
						size: PAGE_SIZE,
						sort: 'username,asc',
						...(filter ? { filter } : {})
					}
				})
				.then(response => normalizePage(response.data)),
		placeholderData: keepPreviousData
	})
	const changeSearch = (value: string) => {
		setSearch(value)
		setPage(0)
	}
	const totalPages = query.data?.totalPages || 0
	const users = query.data?.content || []
	const limitReached = selected.size >= max
	return (
		<div className='mt-3 space-y-3'>
			<div className='relative'>
				<Search
					className='absolute left-3 top-3 text-slate-400'
					size={18}
				/>
				<input
					className='field !pl-10'
					placeholder='Поиск по username…'
					value={search}
					onChange={event => changeSearch(event.target.value)}
				/>
			</div>

			<div className='flex items-center justify-between text-sm'>
				<span
					className={
						selected.size > max
							? 'font-semibold text-red-600'
							: 'text-slate-500'
					}
				>
					Выбрано: {selected.size} / {max}
				</span>
				{selected.size > 0 && (
					<button
						className='font-semibold text-indigo-600'
						onClick={onClear}
					>
						Очистить
					</button>
				)}
			</div>

			{selected.size > 0 && (
				<div className='flex max-h-24 flex-wrap gap-1.5 overflow-y-auto'>
					{[...selected.entries()].map(([id, username]) => (
						<span
							key={id}
							className='badge gap-1 bg-indigo-50 text-indigo-700'
						>
							@{username || 'без username'}
							<button
								aria-label='Убрать получателя'
								onClick={() => onToggle({ userId: id, username })}
							>
								<X size={13} />
							</button>
						</span>
					))}
				</div>
			)}

			{query.isError ? (
				<ErrorState />
			) : (
				<div className='rounded-xl border border-slate-100'>
					<div className='max-h-64 divide-y divide-slate-100 overflow-y-auto'>
						{query.isLoading ? (
							<div className='space-y-2 p-3'>
								{Array.from({ length: 5 }, (_, index) => (
									<Skeleton key={index} className='h-9 w-full' />
								))}
							</div>
						) : users.length === 0 ? (
							<EmptyState message='Пользователи не найдены' />
						) : (
							users.map(user => {
								const checked = selected.has(user.userId)
								const isAdmin = user.roleName === 'ADMIN'
								return (
									<label
										key={user.userId}
										className={`flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-slate-50 ${
											!checked && (limitReached || isAdmin)
												? 'cursor-not-allowed opacity-50'
												: ''
										}`}
									>
										<input
											type='checkbox'
											className='h-4 w-4'
											checked={checked}
											disabled={
												!checked &&
												(limitReached || isAdmin)
											}
											onChange={() => onToggle(user)}
										/>
										<span className='min-w-0 flex-1'>
											<b className='block truncate'>
												@{user.username || 'без username'}
											</b>
											<span className='text-xs text-slate-400'>
												ID {user.userId}
											</span>
										</span>
										{isAdmin && (
											<span className='badge bg-slate-100 text-slate-500'>
												админ — исключается
											</span>
										)}
									</label>
								)
							})
						)}
					</div>
					{totalPages > 1 && (
						<div className='flex items-center justify-between border-t border-slate-100 px-3 py-2 text-sm text-slate-500'>
							<button
								className='btn btn-soft !p-2'
								disabled={page === 0}
								onClick={() => setPage(current => current - 1)}
								aria-label='Предыдущая страница'
							>
								<ChevronLeft size={16} />
							</button>
							<span>
								Стр. {page + 1} из {totalPages}
							</span>
							<button
								className='btn btn-soft !p-2'
								disabled={page + 1 >= totalPages}
								onClick={() => setPage(current => current + 1)}
								aria-label='Следующая страница'
							>
								<ChevronRight size={16} />
							</button>
						</div>
					)}
				</div>
			)}
		</div>
	)
}
