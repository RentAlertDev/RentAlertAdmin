'use client'

import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, CalendarClock, Database, Package } from 'lucide-react'
import React from 'react'
import {
	Bar,
	BarChart,
	Cell,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis
} from 'recharts'

import { api } from '@/shared/api/http-client'
import { CITY_PROVIDERS, providerLabel } from '@/shared/config/providers'
import { daysAgo, formatDateTime } from '@/shared/lib/format'
import type {
	ListingProvider,
	ListingStatisticsOverview
} from '@/shared/model/types'
import {
	CardGridSkeleton,
	EmptyState,
	ErrorState,
	Skeleton
} from '@/shared/ui/page-state'
import { RefreshButton } from '@/shared/ui/refresh-button'

const PROVIDER_COLORS: Record<ListingProvider, string> = {
	KUFAR: '#5b5ce2',
	REALT: '#16a36a',
	ONLINER: '#f59e0b'
}
const chartColors = ['#5b5ce2', '#16a36a', '#f59e0b', '#e0528d', '#35a7c9']
const STALE_MINUTES = 6 * 60

const nf = new Intl.NumberFormat('ru-RU')
const num = (value: number) => nf.format(Math.round(value))
const cityLabel = (city?: string) => city || 'Не указан'
const dayMonth = (date: string) => `${date.slice(8, 10)}.${date.slice(5, 7)}`
const roomLabel = (key: string) =>
	key === 'unknown' ? 'не указано' : `${key}-комн.`
const roomSortKey = (key: string) =>
	key === 'unknown' ? Number.POSITIVE_INFINITY : Number(key)

export function ListingsPage() {
	const [since, setSince] = React.useState(daysAgo())
	const query = useQuery({
		queryKey: ['listing-statistics', since],
		queryFn: () =>
			api
				.get<ListingStatisticsOverview>(
					'/listing-statistics/overview',
					{ params: { since } }
				)
				.then(response => response.data)
	})

	const header = (
		<div className='flex flex-wrap items-end justify-between gap-4'>
			<div>
				<h1 className='text-3xl font-bold'>Объявления</h1>
				<p className='mt-1 text-slate-500'>
					Аналитика по спарсенным объявлениям
				</p>
			</div>
			<div className='flex items-end gap-2'>
				<label className='text-sm font-semibold'>
					Период с
					<input
						className='field mt-1 block'
						type='date'
						value={since}
						max={new Date().toISOString().slice(0, 10)}
						onChange={event => setSince(event.target.value)}
					/>
				</label>
				<RefreshButton queryKey={['listing-statistics', since]} />
			</div>
		</div>
	)

	if (query.isLoading)
		return (
			<div className='space-y-6'>
				{header}
				<CardGridSkeleton count={4} />
				<div className='card p-5'>
					<Skeleton className='h-72 w-full' />
				</div>
				<div className='card p-5'>
					<Skeleton className='h-80 w-full' />
				</div>
			</div>
		)

	if (query.isError || !query.data)
		return (
			<div className='space-y-6'>
				{header}
				<ErrorState onRetry={() => query.refetch()} />
			</div>
		)

	const data = query.data
	const period = data.period
	const byProvider = data.byProvider ?? []
	const byCity = data.byCity ?? []
	const byCityAndProvider = data.byCityAndProvider ?? []
	const staleProviders = data.staleProviders ?? []
	const priceStats = data.priceStats ?? []
	const dataQuality = data.dataQuality ?? {
		withoutCity: 0,
		withoutPrice: 0,
		withoutPhotos: 0
	}

	const dailyArrivals = (period?.dailyArrivals ?? []).map(day => {
		const point: Record<string, string | number> = {
			date: dayMonth(day.date)
		}
		for (const provider of CITY_PROVIDERS)
			point[provider] = day.byProvider?.[provider] ?? 0
		return point
	})

	const shareChart = byProvider.map(row => ({
		name: providerLabel(row.provider),
		provider: row.provider,
		value: Math.round((row.sharePercent ?? 0) * 10) / 10
	}))

	const maxCityTotal = Math.max(1, ...byCity.map(row => row.total ?? 0))

	const rooms = Object.entries(data.roomsDistribution ?? {})
		.map(([key, value]) => ({ name: roomLabel(key), value, key }))
		.sort((a, b) => roomSortKey(a.key) - roomSortKey(b.key))

	return (
		<div className='space-y-6'>
			{header}

			{/* 1. KPI */}
			<div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
				<Kpi
					icon={<Package />}
					title='Всего объявлений'
					value={num(data.totalListings ?? 0)}
					hint={`активных: ${num(data.activeListings ?? 0)}`}
				/>
				<Kpi
					icon={<CalendarClock />}
					title='Новых за 24ч / 7д / 30д'
					value={`${num(data.newLast24h ?? 0)} / ${num(
						data.newLast7d ?? 0
					)} / ${num(data.newLast30d ?? 0)}`}
				/>
				<Kpi
					icon={<CalendarClock />}
					title='Новых за период'
					value={num(period?.newTotal ?? 0)}
					hint={`≈ ${
						Math.round((period?.newPerDay ?? 0) * 10) / 10
					}/день`}
				/>
				<Kpi
					icon={<Database />}
					title='Качество данных'
					value={`${num(dataQuality.withoutCity ?? 0)} / ${num(
						dataQuality.withoutPrice ?? 0
					)} / ${num(dataQuality.withoutPhotos ?? 0)}`}
					hint='без города / без цены / без фото'
				/>
			</div>

			{/* 2. Сломанные парсеры */}
			{staleProviders.length > 0 && (
				<div className='card flex items-start gap-3 border-amber-300 bg-amber-50 p-4 text-amber-800'>
					<AlertTriangle className='mt-0.5 shrink-0' size={20} />
					<div>
						<b>Нет новых объявлений &gt; 6 ч:</b>{' '}
						{staleProviders.map(providerLabel).join(', ')}
						<p className='mt-1 text-sm'>
							Вероятно, парсер по этим провайдерам не работает.
						</p>
					</div>
				</div>
			)}

			{/* 3. По провайдерам */}
			<section className='card'>
				<div className='p-5'>
					<h2 className='text-lg font-bold'>По провайдерам</h2>
					<p className='text-sm text-slate-500'>
						Объёмы объявлений по источникам за всё время
					</p>
				</div>
				{byProvider.length ? (
					<div className='grid gap-6 p-5 pt-0 xl:grid-cols-[3fr_2fr]'>
						<div className='table-wrap'>
							<table className='data-table'>
								<thead>
									<tr>
										<th>Провайдер</th>
										<th>Всего</th>
										<th>Активных / неактивных</th>
										<th>Доля</th>
										<th>Последний парсинг</th>
									</tr>
								</thead>
								<tbody>
									{byProvider.map(row => {
										const stale =
											(row.minutesSinceLastParsed ?? 0) >
											STALE_MINUTES
										return (
											<tr key={row.provider}>
												<td>
													<span
														className='badge text-white'
														style={{
															background:
																PROVIDER_COLORS[
																	row.provider
																] ?? '#5b5ce2'
														}}
													>
														{providerLabel(
															row.provider
														)}
													</span>
												</td>
												<td className='font-bold'>
													{num(row.total ?? 0)}
												</td>
												<td>
													{num(row.active ?? 0)} /{' '}
													{num(row.inactive ?? 0)}
												</td>
												<td className='w-40'>
													<Bar100
														percent={
															row.sharePercent ??
															0
														}
														color={
															PROVIDER_COLORS[
																row.provider
															]
														}
													/>
												</td>
												<td
													className={`whitespace-nowrap ${
														stale
															? 'font-semibold text-red-600'
															: ''
													}`}
												>
													{formatDateTime(
														row.lastParsedAt
													)}
												</td>
											</tr>
										)
									})}
								</tbody>
							</table>
						</div>
						<div className='h-72'>
							<ResponsiveContainer>
								<BarChart data={shareChart}>
									<XAxis
										dataKey='name'
										tick={{ fontSize: 12 }}
									/>
									<YAxis
										unit='%'
										width={44}
										tick={{ fontSize: 12 }}
									/>
									<Tooltip formatter={value => `${value}%`} />
									<Bar dataKey='value' radius={[6, 6, 0, 0]}>
										{shareChart.map(row => (
											<Cell
												key={row.provider}
												fill={
													PROVIDER_COLORS[
														row.provider
													] ?? '#5b5ce2'
												}
											/>
										))}
									</Bar>
								</BarChart>
							</ResponsiveContainer>
						</div>
					</div>
				) : (
					<EmptyState message='Нет данных по провайдерам' />
				)}
			</section>

			{/* 4. Частота поступления */}
			<section className='card'>
				<div className='p-5'>
					<h2 className='text-lg font-bold'>Частота поступления</h2>
					<p className='text-sm text-slate-500'>
						Новые объявления по дням за период {period?.since} —{' '}
						{period?.until}
					</p>
				</div>
				<div className='px-5 pb-5'>
					{dailyArrivals.length ? (
						<div className='h-80'>
							<ResponsiveContainer>
								<BarChart data={dailyArrivals}>
									<XAxis
										dataKey='date'
										tick={{ fontSize: 12 }}
									/>
									<YAxis
										width={44}
										tick={{ fontSize: 12 }}
										allowDecimals={false}
									/>
									<Tooltip />
									{CITY_PROVIDERS.map(provider => (
										<Bar
											key={provider}
											dataKey={provider}
											name={providerLabel(provider)}
											stackId='a'
											fill={PROVIDER_COLORS[provider]}
										/>
									))}
								</BarChart>
							</ResponsiveContainer>
						</div>
					) : (
						<EmptyState message='Нет объявлений за период' />
					)}
					<div className='mt-4 flex flex-wrap gap-2'>
						{(period?.newByProvider ?? []).map(row => (
							<span
								key={row.provider}
								className='badge bg-slate-100 text-slate-600'
							>
								{providerLabel(row.provider)}:{' '}
								{num(row.count ?? 0)} (≈{' '}
								{Math.round((row.perDay ?? 0) * 10) / 10}/день)
							</span>
						))}
					</div>
				</div>
			</section>

			{/* 5. По городам */}
			<section className='card'>
				<div className='p-5'>
					<h2 className='text-lg font-bold'>По городам</h2>
					<p className='text-sm text-slate-500'>
						Топ городов по числу объявлений
					</p>
				</div>
				{byCity.length ? (
					<div className='table-wrap'>
						<table className='data-table'>
							<thead>
								<tr>
									<th>Город</th>
									<th>Всего</th>
									<th>Активных</th>
									<th>Доля</th>
								</tr>
							</thead>
							<tbody>
								{byCity.slice(0, 20).map((row, index) => (
									<tr key={`${row.city ?? 'none'}-${index}`}>
										<td className='font-semibold'>
											{cityLabel(row.city)}
										</td>
										<td className='font-bold'>
											{num(row.total ?? 0)}
										</td>
										<td>{num(row.active ?? 0)}</td>
										<td className='w-48'>
											<Bar100
												percent={
													((row.total ?? 0) /
														maxCityTotal) *
													100
												}
											/>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				) : (
					<EmptyState message='Нет данных по городам' />
				)}
			</section>

			{/* 6. Город × провайдер */}
			<section className='card'>
				<div className='p-5'>
					<h2 className='text-lg font-bold'>Город × провайдер</h2>
					<p className='text-sm text-slate-500'>
						Топ связок «город — провайдер»
					</p>
				</div>
				{byCityAndProvider.length ? (
					<div className='table-wrap'>
						<table className='data-table'>
							<thead>
								<tr>
									<th>Город</th>
									<th>Провайдер</th>
									<th>Всего</th>
								</tr>
							</thead>
							<tbody>
								{byCityAndProvider
									.slice(0, 20)
									.map((row, index) => (
										<tr
											key={`${row.city ?? 'none'}-${
												row.provider
											}-${index}`}
										>
											<td className='font-semibold'>
												{cityLabel(row.city)}
											</td>
											<td>
												<span
													className='badge text-white'
													style={{
														background:
															PROVIDER_COLORS[
																row.provider
															] ?? '#5b5ce2'
													}}
												>
													{providerLabel(
														row.provider
													)}
												</span>
											</td>
											<td className='font-bold'>
												{num(row.total ?? 0)}
											</td>
										</tr>
									))}
							</tbody>
						</table>
					</div>
				) : (
					<EmptyState message='Нет данных по срезу город × провайдер' />
				)}
			</section>

			{/* 7. Цены */}
			<section className='card p-5'>
				<h2 className='text-lg font-bold'>Цены</h2>
				<p className='text-sm text-slate-500'>
					Только объявления с заполненной ценой
				</p>
				{priceStats.length ? (
					<div className='mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3'>
						{priceStats.map(row => (
							<div key={row.currency} className='card p-4'>
								<div className='flex items-center justify-between'>
									<b className='text-lg'>{row.currency}</b>
									<span className='text-sm text-slate-500'>
										n = {num(row.count ?? 0)}
									</span>
								</div>
								<p className='mt-2 text-2xl font-bold'>
									{num(row.avgPrice ?? 0)}
								</p>
								<p className='text-sm text-slate-500'>
									средняя цена
								</p>
								<p className='mt-2 text-sm text-slate-500'>
									min {num(row.minPrice ?? 0)} / max{' '}
									{num(row.maxPrice ?? 0)}
								</p>
							</div>
						))}
					</div>
				) : (
					<EmptyState message='Нет объявлений с ценой' />
				)}
			</section>

			{/* 8. Комнаты */}
			<section className='card p-5'>
				<h2 className='text-lg font-bold'>Комнаты</h2>
				<p className='text-sm text-slate-500'>
					Распределение по числу комнат
				</p>
				{rooms.length ? (
					<div className='mt-4 h-72'>
						<ResponsiveContainer>
							<PieChart>
								<Pie
									data={rooms}
									dataKey='value'
									nameKey='name'
									innerRadius={60}
									outerRadius={105}
									paddingAngle={2}
								>
									{rooms.map((_, index) => (
										<Cell
											key={index}
											fill={
												chartColors[
													index % chartColors.length
												]
											}
										/>
									))}
								</Pie>
								<Tooltip />
							</PieChart>
						</ResponsiveContainer>
					</div>
				) : (
					<EmptyState message='Нет данных по комнатам' />
				)}
			</section>
		</div>
	)
}

function Kpi({
	icon,
	title,
	value,
	hint
}: {
	icon: React.ReactNode
	title: string
	value: string | number
	hint?: string
}) {
	return (
		<div className='card flex items-center gap-4 p-5'>
			<span className='grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600'>
				{icon}
			</span>
			<div className='min-w-0'>
				<p className='text-sm text-slate-500'>{title}</p>
				<p className='text-2xl font-bold'>{value}</p>
				{hint && <p className='text-xs text-slate-400'>{hint}</p>}
			</div>
		</div>
	)
}

function Bar100({ percent, color }: { percent: number; color?: string }) {
	const clamped = Math.max(0, Math.min(100, percent))
	return (
		<div className='flex items-center gap-2'>
			<div className='h-2 flex-1 rounded-full bg-slate-100'>
				<div
					className='h-full rounded-full'
					style={{
						width: `${clamped}%`,
						background: color ?? '#5b5ce2'
					}}
				/>
			</div>
			<span className='w-11 text-right text-xs text-slate-500'>
				{Math.round(clamped * 10) / 10}%
			</span>
		</div>
	)
}
