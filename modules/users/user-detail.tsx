'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
	ArrowLeft,
	Ban,
	Clock,
	Heart,
	LogIn,
	MessageSquare,
	SlidersHorizontal,
	Trash2
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import {
	Bar,
	BarChart,
	CartesianGrid,
	Legend,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis
} from 'recharts'
import { toast } from 'sonner'

import { Status } from './users-list'
import { api } from '@/shared/api/http-client'
import { APP_ROUTES } from '@/shared/config/routes'
import {
	dateInput,
	daysAgo,
	formatDateTime,
	initials
} from '@/shared/lib/format'
import type {
	UserActionSummary,
	UserActivityLog,
	UserProfile
} from '@/shared/model/types'
import {
	DetailHeaderSkeleton,
	ErrorState,
	Skeleton
} from '@/shared/ui/page-state'

const colors = [
	'#5b5ce2',
	'#16a36a',
	'#f59e0b',
	'#e0528d',
	'#35a7c9',
	'#8957d6'
]
export function UserDetail({ userId }: { userId: number }) {
	const [since, setSince] = useState(daysAgo())
	const [until, setUntil] = useState(dateInput(new Date()))
	const [confirm, setConfirm] = useState<{
		title: string
		description: string
		action: 'block' | 'delete'
	} | null>(null)
	const queryClient = useQueryClient()
	const router = useRouter()
	const profile = useQuery({
		queryKey: ['profile', userId],
		queryFn: () =>
			api.get<UserProfile>(`/profiles/${userId}`).then(r => r.data)
	})
	const summary = useQuery({
		queryKey: ['summary', userId, since],
		queryFn: () =>
			api
				.get<
					UserActionSummary | UserActionSummary[]
				>('/user-statistics/actions', { params: { userId, since } })
				.then(r => (Array.isArray(r.data) ? r.data[0] : r.data))
	})
	const log = useQuery({
		queryKey: ['log', userId, since, until],
		queryFn: () =>
			api
				.get<
					UserActivityLog[] | UserActivityLog
				>(`/user-statistics/actions/${userId}/log`, { params: { since, until } })
				.then(r => (Array.isArray(r.data) ? r.data : [r.data]))
	})
	const updateRole = useMutation({
		mutationFn: (role: 'USER' | 'BLOCKED') =>
			api.patch(`/profiles/${userId}/role`, { role }),
		onSuccess: () => {
			toast.success('Статус пользователя изменён')
			setConfirm(null)
			queryClient.invalidateQueries({ queryKey: ['profile', userId] })
		},
		onError: () => toast.error('Не удалось изменить статус пользователя')
	})
	const removeUser = useMutation({
		mutationFn: () => api.delete(`/profiles/${userId}`),
		onSuccess: () => {
			toast.success('Пользователь удалён')
			router.replace(APP_ROUTES.ADMIN.USERS)
		},
		onError: () => toast.error('Не удалось удалить пользователя')
	})
	if (profile.isLoading || summary.isLoading || log.isLoading)
		return (
			<div className='space-y-6'>
				<Skeleton className='h-4 w-48' />
				<DetailHeaderSkeleton />
				<div className='grid gap-4 md:grid-cols-3 xl:grid-cols-6'>
					{Array.from({ length: 6 }, (_, index) => (
						<div key={index} className='card p-4'>
							<Skeleton className='h-5 w-5 rounded' />
							<Skeleton className='mt-3 h-7 w-12' />
							<Skeleton className='mt-2 h-3 w-20' />
						</div>
					))}
				</div>
				<div className='card p-5'>
					<Skeleton className='h-96 w-full' />
				</div>
			</div>
		)
	if (profile.isError || summary.isError || log.isError || !profile.data)
		return <ErrorState />
	const p = profile.data,
		s = summary.data
	const types = [...new Set((log.data || []).map(x => x.eventType))]
	const rows = Object.values(
		(log.data || []).reduce<
			Record<string, Record<string, string | number>>
		>((a, x) => {
			a[x.eventDate] ??= { date: x.eventDate }
			a[x.eventDate][x.eventType] = x.count
			return a
		}, {})
	)
	return (
		<div className='space-y-6'>
			<Link
				href={APP_ROUTES.ADMIN.USERS}
				className='inline-flex items-center gap-2 text-sm font-semibold text-indigo-600'
			>
				<ArrowLeft size={17} />К списку пользователей
			</Link>
			<div className='card flex flex-wrap items-center gap-5 p-6'>
				{p.photoUrl ? (
					<Image
						src={p.photoUrl}
						alt=''
						width={88}
						height={88}
						unoptimized
						className='h-22 w-22 rounded-2xl object-cover'
					/>
				) : (
					<span className='grid h-22 w-22 place-items-center rounded-2xl bg-indigo-100 text-2xl font-bold text-indigo-700'>
						{initials(p.username)}
					</span>
				)}
				<div className='flex-1'>
					<div className='mb-2 flex flex-wrap items-center gap-3'>
						<h1 className='text-3xl font-bold'>
							@{p.username || 'без username'}
						</h1>
						<Status value={p.botStatus} />
					</div>
					<p className='text-slate-500'>
						ID {p.userId} · Последний вход{' '}
						{formatDateTime(p.lastLogin)}
					</p>
				</div>
				<div className='rounded-xl bg-slate-50 p-4'>
					<div className='flex items-center gap-2 font-semibold'>
						<Clock size={18} />
						Тихие часы
					</div>
					<div className='mt-1 text-slate-500'>
						{p.quietFrom && p.quietTo
							? `${p.quietFrom} – ${p.quietTo}`
							: 'Не настроены'}
					</div>
				</div>
				<div className='flex flex-wrap justify-end gap-2'>
					<button
						className='btn btn-soft'
						disabled={updateRole.isPending || removeUser.isPending}
						onClick={() =>
							setConfirm({
								title:
									p.roleName === 'BLOCKED'
										? 'Разблокировать пользователя?'
										: 'Заблокировать пользователя?',
								description:
									p.roleName === 'BLOCKED'
										? 'Пользователь снова получит доступ к системе.'
										: 'Активная сессия пользователя будет немедленно завершена.',
								action: 'block'
							})
						}
					>
						<Ban size={17} />
						{p.roleName === 'BLOCKED'
							? 'Разблокировать'
							: 'Заблокировать'}
					</button>
					<button
						className='btn bg-red-600 text-white hover:bg-red-700'
						disabled={updateRole.isPending || removeUser.isPending}
						onClick={() =>
							setConfirm({
								title: 'Удалить пользователя?',
								description:
									'Профиль и связанные данные будут удалены без возможности восстановления.',
								action: 'delete'
							})
						}
					>
						<Trash2 size={17} /> Удалить
					</button>
				</div>
			</div>
			<div className='grid gap-4 md:grid-cols-3 xl:grid-cols-6'>
				<Metric icon={<LogIn />} label='Входы' value={s?.loginCount} />
				<Metric
					icon={<Heart />}
					label='Избранное'
					value={s?.favoriteActions}
				/>
				<Metric
					icon={<SlidersHorizontal />}
					label='Фильтры'
					value={s?.filterActions}
				/>
				<Metric
					icon={<MessageSquare />}
					label='Отзывы'
					value={s?.feedbackCount}
				/>
				<Metric
					icon={<Clock />}
					label='Коллбэки'
					value={s?.callbackCount}
				/>
				<Metric
					icon={<Clock />}
					label='Всего'
					value={s?.totalActions}
				/>
			</div>
			<section className='card p-5'>
				<div className='mb-6 flex flex-wrap items-end justify-between gap-3'>
					<div>
						<h2 className='text-lg font-bold'>
							Активность по дням
						</h2>
						<p className='text-sm text-slate-500'>
							Распределение событий пользователя
						</p>
					</div>
					<div className='flex gap-3'>
						<label className='text-xs font-semibold'>
							С
							<input
								type='date'
								className='field mt-1'
								value={since}
								onChange={e => setSince(e.target.value)}
							/>
						</label>
						<label className='text-xs font-semibold'>
							По
							<input
								type='date'
								className='field mt-1'
								value={until}
								onChange={e => setUntil(e.target.value)}
							/>
						</label>
					</div>
				</div>
				<div className='h-96'>
					<ResponsiveContainer>
						<BarChart data={rows}>
							<CartesianGrid
								strokeDasharray='3 3'
								vertical={false}
							/>
							<XAxis dataKey='date' />
							<YAxis allowDecimals={false} />
							<Tooltip />
							<Legend />
							{types.map((t, i) => (
								<Bar
									key={t}
									dataKey={t}
									stackId='a'
									fill={colors[i % colors.length]}
								/>
							))}
						</BarChart>
					</ResponsiveContainer>
				</div>
			</section>
			{confirm && (
				<div className='fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-5'>
					<div
						className='card w-full max-w-md p-6'
						role='dialog'
						aria-modal='true'
						aria-labelledby='user-action-confirm-title'
					>
						<h2
							id='user-action-confirm-title'
							className='text-xl font-bold'
						>
							{confirm.title}
						</h2>
						<p className='my-3 text-slate-500'>
							{confirm.description}
						</p>
						<div className='flex justify-end gap-2'>
							<button
								className='btn btn-soft'
								onClick={() => setConfirm(null)}
							>
								Отмена
							</button>
							<button
								className={`btn ${confirm.action === 'delete' ? 'bg-red-600 text-white hover:bg-red-700' : 'btn-primary'}`}
								disabled={
									updateRole.isPending || removeUser.isPending
								}
								onClick={() => {
									if (confirm.action === 'delete') {
										removeUser.mutate()
										return
									}
									updateRole.mutate(
										p.roleName === 'BLOCKED'
											? 'USER'
											: 'BLOCKED'
									)
								}}
							>
								{removeUser.isPending || updateRole.isPending
									? 'Выполнение...'
									: 'Подтвердить'}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}
function Metric({
	icon,
	label,
	value
}: {
	icon: React.ReactNode
	label: string
	value?: number
}) {
	return (
		<div className='card p-4'>
			<span className='text-indigo-600'>{icon}</span>
			<div className='mt-3 text-2xl font-bold'>{value || 0}</div>
			<div className='text-xs text-slate-500'>{label}</div>
		</div>
	)
}
