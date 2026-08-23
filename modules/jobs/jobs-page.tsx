'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Database, RefreshCcw, Trash2, WalletCards } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { api } from '@/shared/api/http-client'
import { formatDateTime, formatDuration } from '@/shared/lib/format'
import type { JobSetting, Page } from '@/shared/model/types'
import { EmptyState, ErrorState, LoadingState } from '@/shared/ui/page-state'
import { Pagination } from '@/shared/ui/pagination'

export function JobsPage() {
	const [page, setPage] = useState(0)
	const [all, setAll] = useState(true)
	const [confirm, setConfirm] = useState(false)
	const qc = useQueryClient()
	const jobs = useQuery({
		queryKey: ['jobs', page],
		queryFn: () =>
			api
				.get<
					Page<JobSetting>
				>('/job-settings', { params: { page, size: 20, sort: 'startedAt,desc' } })
				.then(r => r.data)
	})
	const run = useMutation({
		mutationFn: (url: string) => api.post(url),
		onSuccess: () => {
			toast.success('Задача успешно запущена')
			qc.invalidateQueries({ queryKey: ['jobs'] })
		},
		onError: () => toast.error('Не удалось запустить задачу')
	})
	return (
		<div className='space-y-6'>
			<div>
				<h1 className='text-3xl font-bold'>Фоновые задачи</h1>
				<p className='mt-1 text-slate-500'>
					Ручной запуск и история служебных операций
				</p>
			</div>
			<section className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
				<Action
					icon={<Trash2 />}
					title='Очистка данных'
					text='Удаление устаревших данных'
					action={() => setConfirm(true)}
					loading={run.isPending}
				/>
				<Action
					icon={<RefreshCcw />}
					title='Синхронизация кэша'
					text='Обновление данных в кэше'
					action={() => run.mutate('/job-settings/cacheSync')}
					loading={run.isPending}
				/>
				<div className='card p-5'>
					<span className='text-indigo-600'>
						<Database />
					</span>
					<h3 className='mt-4 font-bold'>Очистка кэша</h3>
					<p className='mb-4 mt-1 text-sm text-slate-500'>
						Удаление записей кэша
					</p>
					<label className='mb-3 flex items-center gap-2 text-sm'>
						<input
							type='checkbox'
							checked={all}
							onChange={e => setAll(e.target.checked)}
						/>
						Полностью
					</label>
					<button
						className='btn btn-primary w-full'
						onClick={() =>
							run.mutate(`/job-settings/cleanCache?all=${all}`)
						}
					>
						Запустить
					</button>
				</div>
				<Action
					icon={<WalletCards />}
					title='Курсы валют'
					text='Получить актуальные курсы'
					action={() => run.mutate('/job-settings/currency-rates')}
					loading={run.isPending}
				/>
			</section>
			<section className='card'>
				<div className='p-5'>
					<h2 className='text-lg font-bold'>История запусков</h2>
				</div>
				{jobs.isLoading ? (
					<LoadingState />
				) : jobs.isError ? (
					<ErrorState />
				) : !jobs.data?.content?.length ? (
					<EmptyState message='Запуски пока отсутствуют' />
				) : (
					<div className='table-wrap'>
						<table className='data-table'>
							<thead>
								<tr>
									<th>Задача</th>
									<th>Инициатор</th>
									<th>Область</th>
									<th>Записи</th>
									<th>Время</th>
									<th>Длительность</th>
								</tr>
							</thead>
							<tbody>
								{jobs.data.content.map((j, i) => (
									<tr
										key={`${j.jobName}-${j.startedAt}-${i}`}
									>
										<td>
											<b>{j.jobName}</b>
											<div className='max-w-xs text-xs text-slate-500'>
												{j.description}
											</div>
										</td>
										<td>
											<span
												className={`badge ${j.initiator === 'ADMIN' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'}`}
											>
												{j.initiator}
											</span>
										</td>
										<td>{j.executionScope || '—'}</td>
										<td>{j.affectedRecords ?? '—'}</td>
										<td>
											<div>
												{formatDateTime(j.startedAt)}
											</div>
											<div className='text-xs text-slate-400'>
												до{' '}
												{formatDateTime(j.finishedAt)}
											</div>
										</td>
										<td>
											{formatDuration(j.executionTimeMs)}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
				<Pagination
					page={page}
					totalPages={jobs.data?.totalPages || 0}
					onChange={setPage}
				/>
			</section>
			{confirm && (
				<div className='fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-5'>
					<div className='card max-w-md p-6'>
						<h2 className='text-xl font-bold'>
							Запустить очистку?
						</h2>
						<p className='my-3 text-slate-500'>
							Будет запущена фоновая задача очистки данных.
							Операцию нельзя отменить из панели.
						</p>
						<div className='flex justify-end gap-2'>
							<button
								className='btn btn-soft'
								onClick={() => setConfirm(false)}
							>
								Отмена
							</button>
							<button
								className='btn bg-red-600 text-white'
								onClick={() => {
									setConfirm(false)
									run.mutate('/job-settings/cleanUp')
								}}
							>
								Запустить
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}
function Action({
	icon,
	title,
	text,
	action,
	loading
}: {
	icon: React.ReactNode
	title: string
	text: string
	action: () => void
	loading: boolean
}) {
	return (
		<div className='card p-5'>
			<span className='text-indigo-600'>{icon}</span>
			<h3 className='mt-4 font-bold'>{title}</h3>
			<p className='mb-7 mt-1 text-sm text-slate-500'>{text}</p>
			<button
				disabled={loading}
				className='btn btn-primary w-full'
				onClick={action}
			>
				Запустить
			</button>
		</div>
	)
}
