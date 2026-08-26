'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
	ArrowDownUp,
	Database,
	RefreshCcw,
	Trash2,
	WalletCards
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { api } from '@/shared/api/http-client'
import { formatDateTime, formatDuration } from '@/shared/lib/format'
import {
	type SpringPageResponse,
	normalizePage
} from '@/shared/lib/normalize-page'
import type { JobSetting } from '@/shared/model/types'
import { EmptyState, ErrorState, TableSkeleton } from '@/shared/ui/page-state'
import { Pagination } from '@/shared/ui/pagination'

export function JobsPage() {
	const [page, setPage] = useState(0)
	const [pageSize, setPageSize] = useState(20)
	const [sort, setSort] = useState('startedAt,desc')
	const [all, setAll] = useState(true)
	const [confirm, setConfirm] = useState<{
		url: string
		title: string
		description: string
	} | null>(null)
	const qc = useQueryClient()
	const jobs = useQuery({
		queryKey: ['jobs', page, pageSize, sort],
		queryFn: () =>
			api
				.get<SpringPageResponse<JobSetting>>('/job-settings', {
					params: { page, size: pageSize, sort }
				})
				.then(r => normalizePage(r.data))
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
	const run = useMutation({
		mutationFn: (url: string) => api.post(url),
		onSuccess: () => {
			toast.success('Задача успешно запущена')
			qc.invalidateQueries({ queryKey: ['jobs'] })
		},
		onError: () => toast.error('Не удалось запустить задачу')
	})
	const requestRun = (url: string, title: string, description: string) =>
		setConfirm({ url, title, description })
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
					action={() =>
						requestRun(
							'/job-settings/cleanUp',
							'Запустить очистку данных?',
							'Будет запущена фоновая задача очистки устаревших данных.'
						)
					}
					loading={run.isPending}
				/>
				<Action
					icon={<RefreshCcw />}
					title='Синхронизация кэша'
					text='Обновление данных в кэше'
					action={() =>
						requestRun(
							'/job-settings/cacheSync',
							'Запустить синхронизацию кэша?',
							'Кэш будет синхронизирован с актуальными данными.'
						)
					}
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
						disabled={run.isPending}
						onClick={() =>
							requestRun(
								`/job-settings/cleanCache?all=${all}`,
								'Запустить очистку кэша?',
								all
									? 'Весь кэш будет очищен.'
									: 'Будут очищены только устаревшие записи кэша.'
							)
						}
					>
						Запустить
					</button>
				</div>
				<Action
					icon={<WalletCards />}
					title='Курсы валют'
					text='Получить актуальные курсы'
					action={() =>
						requestRun(
							'/job-settings/currency-rates',
							'Запустить синхронизацию курсов?',
							'Будет запущена синхронизация курсов валют.'
						)
					}
					loading={run.isPending}
				/>
			</section>
			<section className='card'>
				<div className='p-5'>
					<h2 className='text-lg font-bold'>История запусков</h2>
				</div>
				{jobs.isError ? (
					<ErrorState />
				) : (
					<div className='table-wrap'>
						<table className='data-table'>
							<thead>
								<tr>
									<th>{sortButton('Задача', 'jobName')}</th>
									<th>
										{sortButton('Инициатор', 'initiator')}
									</th>
									<th>
										{sortButton(
											'Область',
											'executionScope'
										)}
									</th>
									<th>
										{sortButton(
											'Записи',
											'affectedRecords'
										)}
									</th>
									<th>
										{sortButton('Время', 'startedAt')}
									</th>
									<th>
										{sortButton(
											'Длительность',
											'executionTimeMs'
										)}
									</th>
								</tr>
							</thead>
							<tbody>
								{jobs.isLoading ? (
									<TableSkeleton columns={6} />
								) : !jobs.data?.content?.length ? (
									<tr>
										<td colSpan={6}>
											<EmptyState message='Запуски пока отсутствуют' />
										</td>
									</tr>
								) : (
									jobs.data.content.map((j, i) => (
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
									))
								)}
							</tbody>
						</table>
					</div>
				)}
				<Pagination
					page={page}
					totalPages={jobs.data?.totalPages || 0}
					onChange={setPage}
					pageSize={pageSize}
					onPageSizeChange={changePageSize}
				/>
			</section>
			{confirm && (
				<div className='fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-5'>
					<div
						className='card w-full max-w-md p-6'
						role='dialog'
						aria-modal='true'
						aria-labelledby='job-confirm-title'
					>
						<h2
							id='job-confirm-title'
							className='text-xl font-bold'
						>
							{confirm.title}
						</h2>
						<p className='my-3 text-slate-500'>
							{confirm.description} Операцию нельзя отменить из
							панели.
						</p>
						<div className='flex justify-end gap-2'>
							<button
								className='btn btn-soft'
								onClick={() => setConfirm(null)}
							>
								Отмена
							</button>
							<button
								className='btn bg-red-600 text-white'
								disabled={run.isPending}
								onClick={() => {
									const action = confirm
									setConfirm(null)
									run.mutate(action.url)
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
