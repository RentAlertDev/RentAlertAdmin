'use client'

import { useQuery } from '@tanstack/react-query'
import {
	ArrowLeft,
	Clock,
	Heart,
	LogIn,
	MessageSquare,
	SlidersHorizontal
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
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
import { ErrorState, LoadingState } from '@/shared/ui/page-state'

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
	if (profile.isLoading || summary.isLoading || log.isLoading)
		return <LoadingState />
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
