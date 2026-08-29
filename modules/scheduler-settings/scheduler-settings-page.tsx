'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { Bell, BellOff, Pencil, Plus, Timer, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { api } from '@/shared/api/http-client'
import { formatDateTime } from '@/shared/lib/format'
import type {
	SchedulerSettings,
	SchedulerSettingsRequest
} from '@/shared/model/types'
import { EmptyState, ErrorState, LoadingState } from '@/shared/ui/page-state'
import { RefreshButton } from '@/shared/ui/refresh-button'

const PROVIDERS = ['KUFAR', 'REALT'] as const
const CURRENCIES = ['USD', 'BYN'] as const
const SORT_ORDERS = ['ASC', 'DESC'] as const

type FormState = {
	providerName: string
	schedulerEnabled: boolean
	notificationsEnabled: boolean
	fixedRateMs: string
	pageSize: string
	priceFrom: string
	priceTo: string
	priceCurrency: string
	regionId: string
	sortBy: string
	sortOrder: string
	categoryId: string
}

const EMPTY_FORM: FormState = {
	providerName: 'KUFAR',
	schedulerEnabled: false,
	notificationsEnabled: false,
	fixedRateMs: '60000',
	pageSize: '50',
	priceFrom: '',
	priceTo: '',
	priceCurrency: '',
	regionId: '0',
	sortBy: 'lst.d',
	sortOrder: 'DESC',
	categoryId: '0'
}

const toForm = (settings: SchedulerSettings): FormState => ({
	providerName: settings.providerName,
	schedulerEnabled: settings.schedulerEnabled,
	notificationsEnabled: settings.notificationsEnabled,
	fixedRateMs: String(settings.fixedRateMs ?? ''),
	pageSize: String(settings.pageSize ?? ''),
	priceFrom: settings.priceFrom == null ? '' : String(settings.priceFrom),
	priceTo: settings.priceTo == null ? '' : String(settings.priceTo),
	priceCurrency: settings.priceCurrency ?? '',
	regionId: settings.regionId ?? '',
	sortBy: settings.sortBy ?? '',
	sortOrder: settings.sortOrder ?? 'DESC',
	categoryId: settings.categoryId == null ? '' : String(settings.categoryId)
})

const errorMessage = (error: unknown, fallback: string) => {
	const data = (error as AxiosError<{ message?: string }>)?.response?.data
	return data?.message || fallback
}

export function SchedulerSettingsPage() {
	const [editor, setEditor] = useState<
		{ mode: 'create' } | { mode: 'edit'; provider: string } | null
	>(null)
	const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
	const queryClient = useQueryClient()

	const settings = useQuery({
		queryKey: ['scheduler-settings'],
		queryFn: () =>
			api
				.get<SchedulerSettings[]>('/scheduler-settings')
				.then(response => response.data)
	})

	const save = useMutation({
		mutationFn: ({
			mode,
			body
		}: {
			mode: 'create' | 'edit'
			body: SchedulerSettingsRequest
		}) =>
			mode === 'create'
				? api.post('/scheduler-settings', body)
				: api.put('/scheduler-settings', body),
		onSuccess: (_, variables) => {
			toast.success(
				variables.mode === 'create'
					? 'Настройки планировщика созданы'
					: 'Настройки планировщика обновлены'
			)
			setEditor(null)
			queryClient.invalidateQueries({ queryKey: ['scheduler-settings'] })
		},
		onError: error =>
			toast.error(errorMessage(error, 'Не удалось сохранить настройки'))
	})

	const remove = useMutation({
		mutationFn: (provider: string) =>
			api.delete(`/scheduler-settings/${provider}`),
		onSuccess: () => {
			toast.success('Настройки планировщика удалены')
			setConfirmDelete(null)
			queryClient.invalidateQueries({ queryKey: ['scheduler-settings'] })
		},
		onError: error =>
			toast.error(errorMessage(error, 'Не удалось удалить настройки'))
	})

	const list = settings.data ?? []
	const editing =
		editor?.mode === 'edit'
			? list.find(item => item.providerName === editor.provider)
			: undefined
	const usedProviders = new Set(list.map(item => item.providerName))

	return (
		<div className='space-y-6'>
			<div className='flex flex-wrap items-start justify-between gap-4'>
				<div>
					<h1 className='text-3xl font-bold'>
						Настройки планировщиков
					</h1>
					<p className='mt-1 text-slate-500'>
						Управление фоновым опросом провайдеров и уведомлениями
					</p>
				</div>
				<div className='flex items-center gap-2'>
					<RefreshButton queryKey={['scheduler-settings']} />
					<button
						className='btn btn-primary'
						onClick={() => setEditor({ mode: 'create' })}
						disabled={PROVIDERS.every(provider =>
							usedProviders.has(provider)
						)}
					>
						<Plus size={17} /> Добавить провайдера
					</button>
				</div>
			</div>

			{settings.isLoading ? (
				<LoadingState />
			) : settings.isError ? (
				<ErrorState />
			) : !list.length ? (
				<EmptyState message='Настройки планировщиков ещё не заданы' />
			) : (
				<div className='grid gap-4 lg:grid-cols-2'>
					{list.map(item => (
						<SettingsCard
							key={item.id}
							settings={item}
							onEdit={() =>
								setEditor({
									mode: 'edit',
									provider: item.providerName
								})
							}
							onDelete={() => setConfirmDelete(item.providerName)}
						/>
					))}
				</div>
			)}

			{editor && (
				<SettingsEditor
					initial={editing ? toForm(editing) : EMPTY_FORM}
					mode={editor.mode}
					takenProviders={usedProviders}
					pending={save.isPending}
					onClose={() => setEditor(null)}
					onSubmit={body => save.mutate({ mode: editor.mode, body })}
				/>
			)}

			{confirmDelete && (
				<div className='fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-5'>
					<div
						className='card w-full max-w-md p-6'
						role='dialog'
						aria-modal='true'
						aria-labelledby='scheduler-delete-title'
					>
						<h2
							id='scheduler-delete-title'
							className='text-xl font-bold'
						>
							Удалить настройки планировщика?
						</h2>
						<p className='my-3 text-slate-500'>
							Настройки провайдера {confirmDelete} будут удалены.
							Операцию нельзя отменить.
						</p>
						<div className='flex justify-end gap-2'>
							<button
								className='btn btn-soft'
								onClick={() => setConfirmDelete(null)}
							>
								Отмена
							</button>
							<button
								className='btn bg-red-600 text-white hover:bg-red-700'
								disabled={remove.isPending}
								onClick={() => remove.mutate(confirmDelete)}
							>
								{remove.isPending ? 'Удаление...' : 'Удалить'}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}

function SettingsCard({
	settings,
	onEdit,
	onDelete
}: {
	settings: SchedulerSettings
	onEdit: () => void
	onDelete: () => void
}) {
	const rows: [string, string][] = [
		['Интервал опроса', formatRate(settings.fixedRateMs)],
		['Размер страницы', String(settings.pageSize)],
		[
			'Цена',
			settings.priceFrom == null && settings.priceTo == null
				? '—'
				: `${settings.priceFrom ?? '0'} – ${settings.priceTo ?? '∞'} ${settings.priceCurrency ?? ''}`.trim()
		],
		['Регион', settings.regionId || '—'],
		[
			'Категория',
			settings.categoryId == null ? '—' : String(settings.categoryId)
		],
		[
			'Сортировка',
			settings.sortBy
				? `${settings.sortBy} ${settings.sortOrder ?? ''}`.trim()
				: '—'
		],
		['Обновлено', formatDateTime(settings.updatedAt)]
	]
	return (
		<section className='card p-5'>
			<div className='flex items-start justify-between gap-3'>
				<div className='flex items-center gap-2'>
					<span className='text-indigo-600'>
						<Timer size={20} />
					</span>
					<h2 className='text-lg font-bold'>
						{settings.providerName}
					</h2>
				</div>
				<div className='flex gap-2'>
					<button
						className='btn btn-soft !p-2'
						onClick={onEdit}
						aria-label='Редактировать'
						title='Редактировать'
					>
						<Pencil size={16} />
					</button>
					<button
						className='btn btn-soft !p-2 text-red-600'
						onClick={onDelete}
						aria-label='Удалить'
						title='Удалить'
					>
						<Trash2 size={16} />
					</button>
				</div>
			</div>
			<div className='mt-3 flex flex-wrap gap-2'>
				<span
					className={`badge ${settings.schedulerEnabled ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}
				>
					{settings.schedulerEnabled
						? 'Планировщик включён'
						: 'Планировщик выключен'}
				</span>
				<span
					className={`badge ${settings.notificationsEnabled ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'}`}
				>
					{settings.notificationsEnabled ? (
						<Bell size={12} className='mr-1' />
					) : (
						<BellOff size={12} className='mr-1' />
					)}
					{settings.notificationsEnabled
						? 'Уведомления вкл.'
						: 'Уведомления выкл.'}
				</span>
			</div>
			<dl className='mt-4 space-y-2 text-sm'>
				{rows.map(([label, value]) => (
					<div
						key={label}
						className='flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5'
					>
						<dt className='shrink-0 text-slate-500'>{label}</dt>
						<dd className='min-w-0 break-all text-left font-semibold sm:text-right'>
							{value}
						</dd>
					</div>
				))}
			</dl>
		</section>
	)
}

function SettingsEditor({
	initial,
	mode,
	takenProviders,
	pending,
	onClose,
	onSubmit
}: {
	initial: FormState
	mode: 'create' | 'edit'
	takenProviders: Set<string>
	pending: boolean
	onClose: () => void
	onSubmit: (body: SchedulerSettingsRequest) => void
}) {
	const [form, setForm] = useState<FormState>(initial)
	const [errors, setErrors] = useState<
		Partial<Record<keyof FormState, string>>
	>({})
	const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
		setForm(current => ({ ...current, [key]: value }))

	const availableProviders =
		mode === 'create'
			? PROVIDERS.filter(provider => !takenProviders.has(provider))
			: [initial.providerName]

	const submit = () => {
		const next: Partial<Record<keyof FormState, string>> = {}
		const fixedRateMs = Number(form.fixedRateMs)
		const pageSize = Number(form.pageSize)
		const categoryId = Number(form.categoryId)

		if (!form.providerName) next.providerName = 'Выберите провайдера'
		if (!Number.isFinite(fixedRateMs) || fixedRateMs < 10000)
			next.fixedRateMs = 'Минимум 10000 мс'
		if (!Number.isFinite(pageSize) || pageSize < 1 || pageSize > 500)
			next.pageSize = 'От 1 до 500'
		if (!form.regionId.trim()) next.regionId = 'Обязательное поле'
		else if (form.regionId.length > 255)
			next.regionId = 'Не более 255 символов'
		if (!form.sortBy.trim()) next.sortBy = 'Обязательное поле'
		else if (form.sortBy.length > 50) next.sortBy = 'Не более 50 символов'
		if (
			!SORT_ORDERS.includes(
				form.sortOrder as (typeof SORT_ORDERS)[number]
			)
		)
			next.sortOrder = 'ASC или DESC'
		if (!form.categoryId.trim() || !Number.isInteger(categoryId))
			next.categoryId = 'Укажите число'
		if (form.priceFrom && Number(form.priceFrom) < 0)
			next.priceFrom = 'Не меньше 0'
		if (form.priceTo && Number(form.priceTo) < 0)
			next.priceTo = 'Не меньше 0'

		setErrors(next)
		if (Object.keys(next).length) return

		const body: SchedulerSettingsRequest = {
			providerName: form.providerName,
			schedulerEnabled: form.schedulerEnabled,
			notificationsEnabled: form.notificationsEnabled,
			fixedRateMs,
			pageSize,
			regionId: form.regionId.trim(),
			sortBy: form.sortBy.trim(),
			sortOrder: form.sortOrder,
			categoryId
		}
		if (form.priceFrom.trim()) body.priceFrom = Number(form.priceFrom)
		if (form.priceTo.trim()) body.priceTo = Number(form.priceTo)
		if (form.priceCurrency) body.priceCurrency = form.priceCurrency
		onSubmit(body)
	}

	return (
		<div
			className='fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-950/40 p-5'
			role='presentation'
			onMouseDown={event =>
				event.target === event.currentTarget && onClose()
			}
		>
			<div
				className='card flex max-h-[90vh] w-full max-w-2xl flex-col p-6'
				role='dialog'
				aria-modal='true'
				aria-labelledby='scheduler-editor-title'
			>
				<div className='flex items-center justify-between gap-4'>
					<h2
						id='scheduler-editor-title'
						className='text-xl font-bold'
					>
						{mode === 'create'
							? 'Новый планировщик'
							: `Планировщик ${initial.providerName}`}
					</h2>
					<button
						className='btn btn-soft !p-2'
						onClick={onClose}
						aria-label='Закрыть'
					>
						<X size={18} />
					</button>
				</div>

				<div className='-mr-2 mt-5 flex-1 overflow-y-auto pr-2'>
					<div className='grid gap-4 sm:grid-cols-2'>
						<Field label='Провайдер' error={errors.providerName}>
							<select
								className='field'
								value={form.providerName}
								disabled={mode === 'edit'}
								onChange={event =>
									set('providerName', event.target.value)
								}
							>
								{availableProviders.map(provider => (
									<option key={provider} value={provider}>
										{provider}
									</option>
								))}
							</select>
						</Field>
						<Field
							label='Интервал опроса, мс'
							error={errors.fixedRateMs}
							hint='Не менее 10000'
						>
							<input
								type='number'
								className='field'
								min={10000}
								step={1000}
								value={form.fixedRateMs}
								onChange={event =>
									set('fixedRateMs', event.target.value)
								}
							/>
						</Field>
						<Field
							label='Размер страницы'
							error={errors.pageSize}
							hint='От 1 до 500'
						>
							<input
								type='number'
								className='field'
								min={1}
								max={500}
								value={form.pageSize}
								onChange={event =>
									set('pageSize', event.target.value)
								}
							/>
						</Field>
						<Field label='ID категории' error={errors.categoryId}>
							<input
								type='number'
								className='field'
								value={form.categoryId}
								onChange={event =>
									set('categoryId', event.target.value)
								}
							/>
						</Field>
						<Field label='ID региона' error={errors.regionId}>
							<input
								className='field'
								maxLength={255}
								value={form.regionId}
								onChange={event =>
									set('regionId', event.target.value)
								}
							/>
						</Field>
						<Field label='Валюта цены' error={errors.priceCurrency}>
							<select
								className='field'
								value={form.priceCurrency}
								onChange={event =>
									set('priceCurrency', event.target.value)
								}
							>
								<option value=''>Не задана</option>
								{CURRENCIES.map(currency => (
									<option key={currency} value={currency}>
										{currency}
									</option>
								))}
							</select>
						</Field>
						<Field label='Цена от' error={errors.priceFrom}>
							<input
								type='number'
								className='field'
								min={0}
								value={form.priceFrom}
								onChange={event =>
									set('priceFrom', event.target.value)
								}
							/>
						</Field>
						<Field label='Цена до' error={errors.priceTo}>
							<input
								type='number'
								className='field'
								min={0}
								value={form.priceTo}
								onChange={event =>
									set('priceTo', event.target.value)
								}
							/>
						</Field>
						<Field label='Поле сортировки' error={errors.sortBy}>
							<input
								className='field'
								maxLength={50}
								value={form.sortBy}
								onChange={event =>
									set('sortBy', event.target.value)
								}
							/>
						</Field>
						<Field
							label='Направление сортировки'
							error={errors.sortOrder}
						>
							<select
								className='field'
								value={form.sortOrder}
								onChange={event =>
									set('sortOrder', event.target.value)
								}
							>
								{SORT_ORDERS.map(order => (
									<option key={order} value={order}>
										{order}
									</option>
								))}
							</select>
						</Field>
					</div>

					<div className='mt-4 flex flex-wrap gap-5'>
						<label className='flex items-center gap-2 text-sm font-semibold'>
							<input
								type='checkbox'
								checked={form.schedulerEnabled}
								onChange={event =>
									set(
										'schedulerEnabled',
										event.target.checked
									)
								}
							/>
							Планировщик включён
						</label>
						<label className='flex items-center gap-2 text-sm font-semibold'>
							<input
								type='checkbox'
								checked={form.notificationsEnabled}
								onChange={event =>
									set(
										'notificationsEnabled',
										event.target.checked
									)
								}
							/>
							Уведомления включены
						</label>
					</div>
				</div>

				<div className='mt-5 flex justify-end gap-2 border-t border-slate-100 pt-4'>
					<button className='btn btn-soft' onClick={onClose}>
						Отмена
					</button>
					<button
						className='btn btn-primary'
						disabled={pending}
						onClick={submit}
					>
						{pending ? 'Сохранение...' : 'Сохранить'}
					</button>
				</div>
			</div>
		</div>
	)
}

function Field({
	label,
	error,
	hint,
	children
}: {
	label: string
	error?: string
	hint?: string
	children: React.ReactNode
}) {
	return (
		<label className='block text-sm font-semibold'>
			<span className='mb-1.5 block'>{label}</span>
			{children}
			{error ? (
				<span className='mt-1 block text-xs font-medium text-red-600'>
					{error}
				</span>
			) : hint ? (
				<span className='mt-1 block text-xs font-normal text-slate-400'>
					{hint}
				</span>
			) : null}
		</label>
	)
}

function formatRate(ms: number) {
	if (!ms) return '—'
	if (ms < 60000) return `${Math.round(ms / 1000)} сек`
	const minutes = ms / 60000
	return Number.isInteger(minutes)
		? `${minutes} мин`
		: `${minutes.toFixed(1)} мин`
}
