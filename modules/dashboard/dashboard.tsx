'use client'

import { useQuery } from '@tanstack/react-query'
import { Activity, MessageSquare, UserPlus, Users } from 'lucide-react'
import Link from 'next/link'
import React from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

import { api } from '@/shared/api/http-client'
import { APP_ROUTES } from '@/shared/config/routes'
import { daysAgo, formatDate } from '@/shared/lib/format'
import type {
	SystemActivity,
	UserActionSummary,
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
const eventName = (s: string) =>
	({
		LOGIN_SUCCESS: 'Входы',
		FAVORITE_ADDED: 'В избранное',
		FAVORITE_REMOVED: 'Из избранного',
		FILTER_UPDATED: 'Фильтры',
		BOT_COMMAND: 'Команды',
		FEEDBACK_CREATED: 'Отзывы',
		TELEGRAM_CALLBACK: 'Коллбэки'
	})[s] || s.replaceAll('_', ' ')
const normalize = <T,>(value: T | T[] | { content: T[] }): T[] =>
	Array.isArray(value)
		? value
		: value && typeof value === 'object' && 'content' in value
			? (value as { content: T[] }).content
			: [value as T]
export function Dashboard() {
	const [since, setSince] = React.useState(daysAgo())
	const system = useQuery({
		queryKey: ['system', since],
		queryFn: async () => {
			const { data } = await api.get<SystemActivity>(
				'/user-statistics/system',
				{ params: { since } }
			)
			const topActiveUsers = await Promise.all(
				(data.topActiveUsers || []).map(async user => {
					try {
						const profile = await api.get<UserProfile>(
							`/profiles/${user.userId}`
						)
						return { ...user, username: profile.data.username }
					} catch {
						return user
					}
				})
			)
			return { ...data, topActiveUsers }
		}
	})
	const actions = useQuery({
		queryKey: ['actions', since],
		queryFn: () =>
			api
				.get<
					UserActionSummary[] | UserActionSummary
				>('/user-statistics/actions', { params: { since, limit: 10 } })
				.then(r => normalize(r.data))
	})
	if (system.isLoading || actions.isLoading) return <LoadingState />
	if (system.isError || actions.isError || !system.data) return <ErrorState />
	const s = system.data
	const newUsersToday = Number(
		s.totalUsersToday ?? s.newUsersToday ?? s.totalNewUsersToday ?? 0
	)
	const newUsersThisWeek = Number(
		s.totalUsersThisWeek ??
			s.newUsersThisWeek ??
			s.totalNewUsersThisWeek ??
			0
	)
	const chart = Object.entries(s.eventDistribution || {}).map(
		([name, value]) => ({ name: eventName(name), value })
	)
	return (
		<div className='space-y-6'>
			<div className='flex flex-wrap items-end justify-between gap-4'>
				<div>
					<h1 className='text-3xl font-bold'>
						Статистика и активность
					</h1>
					<p className='mt-1 text-slate-500'>
						Обзор ключевых показателей RentAlert
					</p>
				</div>
				<label className='text-sm font-semibold'>
					Период с
					<input
						className='field mt-1 block'
						type='date'
						value={since}
						max={new Date().toISOString().slice(0, 10)}
						onChange={e => setSince(e.target.value)}
					/>
				</label>
			</div>
			<div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
				<Kpi
					icon={<Users />}
					title='Активные пользователи'
					value={s.totalActiveUsers}
				/>
				<Kpi
					icon={<UserPlus />}
					title='Новые сегодня / неделю'
					value={`${newUsersToday} / ${newUsersThisWeek}`}
				/>
				<Kpi
					icon={<MessageSquare />}
					title='Всего отзывов'
					value={s.totalFeedbacks}
				/>
				<Kpi
					icon={<Activity />}
					title='Действий в топ-10'
					value={(actions.data || []).reduce(
						(a, x) => a + x.totalActions,
						0
					)}
				/>
			</div>
			<div className='grid gap-6 xl:grid-cols-[3fr_2fr]'>
				<section className='card p-5'>
					<h2 className='mb-5 text-lg font-bold'>
						Распределение событий
					</h2>
					{chart.length ? (
						<div className='h-80'>
							<ResponsiveContainer>
								<PieChart>
									<Pie
										data={chart}
										dataKey='value'
										nameKey='name'
										innerRadius={70}
										outerRadius={115}
										paddingAngle={2}
									>
										{chart.map((_, i) => (
											<Cell
												key={i}
												fill={colors[i % colors.length]}
											/>
										))}
									</Pie>
									<Tooltip />
								</PieChart>
							</ResponsiveContainer>
						</div>
					) : (
						<div className='grid h-80 place-items-center text-slate-400'>
							Нет событий за период
						</div>
					)}
				</section>
				<section className='card p-5'>
					<h2 className='mb-4 text-lg font-bold'>
						Топ-5 пользователей
					</h2>
					<div className='space-y-2'>
						{(s.topActiveUsers || []).slice(0, 5).map((u, i) => (
							<Link
								href={APP_ROUTES.ADMIN.user(u.userId)}
								key={u.userId}
								className='flex items-center gap-3 rounded-xl p-3 hover:bg-slate-50'
							>
								<span className='grid h-9 w-9 place-items-center rounded-full bg-indigo-50 font-bold text-indigo-700'>
									{i + 1}
								</span>
								<span className='min-w-0 flex-1'>
									<span className='block truncate font-semibold'>
										{u.username
											? `@${u.username}`
											: 'Пользователь'}
									</span>
									<span className='block text-xs text-slate-400'>
										ID {u.userId}
									</span>
								</span>
								<b>{u.actionCount}</b>
								<span className='text-xs text-slate-400'>
									действий
								</span>
							</Link>
						))}
					</div>
				</section>
			</div>
			<section className='card'>
				<div className='p-5'>
					<h2 className='text-lg font-bold'>Сводка активности</h2>
					<p className='text-sm text-slate-500'>
						10 самых активных пользователей
					</p>
				</div>
				<div className='table-wrap'>
					<table className='data-table'>
						<thead>
							<tr>
								<th>Пользователь</th>
								<th>Последняя активность</th>
								<th>Всего</th>
								<th>В день</th>
								<th>Категории</th>
							</tr>
						</thead>
						<tbody>
							{(actions.data || []).map(u => (
								<tr key={u.userId}>
									<td>
										<Link
											className='font-bold text-indigo-600'
											href={APP_ROUTES.ADMIN.user(
												u.userId
											)}
										>
											@{u.username || u.userId}
										</Link>
										<div className='text-xs text-slate-400'>
											ID {u.userId}
										</div>
									</td>
									<td>{formatDate(u.lastActivityDate)}</td>
									<td className='font-bold'>
										{u.totalActions}
									</td>
									<td>
										{u.actionRatePerDay?.toFixed(1) || '0'}
									</td>
									<td>
										<div className='flex flex-wrap gap-1'>
											<Pill t='Входы' n={u.loginCount} />
											<Pill
												t='Избранное'
												n={u.favoriteActions}
											/>
											<Pill
												t='Фильтры'
												n={u.filterActions}
											/>
											<Pill
												t='Бот'
												n={u.botCommandCount}
											/>
											<Pill
												t='Отзывы'
												n={u.feedbackCount}
											/>
											<Pill
												t='Коллбэки'
												n={u.callbackCount}
											/>
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</section>
		</div>
	)
}

function Kpi({
	icon,
	title,
	value
}: {
	icon: React.ReactNode
	title: string
	value: string | number
}) {
	return (
		<div className='card flex items-center gap-4 p-5'>
			<span className='grid h-12 w-12 place-items-center rounded-xl bg-indigo-50 text-indigo-600'>
				{icon}
			</span>
			<div>
				<p className='text-sm text-slate-500'>{title}</p>
				<p className='text-2xl font-bold'>{value}</p>
			</div>
		</div>
	)
}
function Pill({ t, n }: { t: string; n: number }) {
	return (
		<span className='badge bg-slate-100 text-slate-600'>
			{t}: {n || 0}
		</span>
	)
}
