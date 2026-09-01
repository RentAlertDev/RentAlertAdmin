'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
	ArrowDown,
	ArrowDownUp,
	ArrowUp,
	Check,
	LoaderCircle,
	Pencil,
	Plus,
	Search,
	Trash2,
	X
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { api } from '@/shared/api/http-client'
import { CITY_PROVIDERS, providerLabel } from '@/shared/config/providers'
import {
	apiErrorId,
	apiErrorMessage,
	apiFieldErrors,
	apiStatus
} from '@/shared/lib/api-error'
import { formatDateTime } from '@/shared/lib/format'
import {
	type SpringPageResponse,
	normalizePage
} from '@/shared/lib/normalize-page'
import type { City, CityProvider } from '@/shared/model/types'
import { EmptyState, ErrorState, TableSkeleton } from '@/shared/ui/page-state'
import { Pagination } from '@/shared/ui/pagination'
import { RefreshButton } from '@/shared/ui/refresh-button'

const NAME_MAX = 255
const PAGE_SIZE_OPTIONS = [20, 50, 100]
const DEFAULT_SORT = ['provider,asc', 'name,asc']
const COLUMNS = 7

type Editor = { mode: 'create' } | { mode: 'edit'; city: City } | null
type ActiveFilter = 'all' | 'active' | 'inactive'

const ACTIVE_FILTERS: { value: ActiveFilter; label: string }[] = [
	{ value: 'all', label: 'Все статусы' },
	{ value: 'active', label: 'Только активные' },
	{ value: 'inactive', label: 'Только неактивные' }
]

export function CitiesPage() {
	const [page, setPage] = useState(0)
	const [pageSize, setPageSize] = useState(20)
	const [sort, setSort] = useState<string[]>(DEFAULT_SORT)
	const [search, setSearch] = useState('')
	const [activeFilter, setActiveFilter] = useState<ActiveFilter>('all')
	const [editor, setEditor] = useState<Editor>(null)
	const [confirmDelete, setConfirmDelete] = useState<City | null>(null)
	const queryClient = useQueryClient()

	const query = useQuery({
		queryKey: ['cities', page, pageSize, sort, activeFilter],
		queryFn: () =>
			api
				.get<SpringPageResponse<City>>('/cities', {
					params: {
						page,
						size: pageSize,
						sort,
						...(activeFilter === 'all'
							? {}
							: { active: activeFilter === 'active' })
					},
					paramsSerializer: { indexes: null }
				})
				.then(response => normalizePage(response.data))
	})

	const setActive = useMutation({
		mutationFn: ({ city, active }: { city: City; active: boolean }) =>
			api.put<City>(`/cities/${city.id}`, { name: city.name, active }),
		onSuccess: (_, { active }) => {
			toast.success(active ? 'Город активирован' : 'Город деактивирован')
			queryClient.invalidateQueries({ queryKey: ['cities'] })
		},
		onError: error => {
			if (apiStatus(error) === 404) {
				toast.error('Город не найден — возможно, уже удалён')
				queryClient.invalidateQueries({ queryKey: ['cities'] })
				return
			}
			toast.error(apiErrorMessage(error, 'Не удалось изменить статус'))
		}
	})

	const remove = useMutation({
		mutationFn: (id: number) => api.delete(`/cities/${id}`),
		onSuccess: () => {
			toast.success('Город удалён')
			setConfirmDelete(null)
			queryClient.invalidateQueries({ queryKey: ['cities'] })
		},
		onError: error => {
			if (apiStatus(error) === 404) {
				toast.error('Город не найден — возможно, уже удалён')
				setConfirmDelete(null)
				queryClient.invalidateQueries({ queryKey: ['cities'] })
				return
			}
			toast.error(apiErrorMessage(error, 'Не удалось удалить город'))
		}
	})

	const [primaryField, primaryDir] = sort[0].split(',')
	const toggleSort = (field: string) => {
		setPage(0)
		setSort(current => {
			const [f, d] = current[0].split(',')
			const dir = f === field && d === 'asc' ? 'desc' : 'asc'
			return field === 'provider'
				? [`provider,${dir}`, 'name,asc']
				: [`${field},${dir}`]
		})
	}
	const changePageSize = (value: number) => {
		setPageSize(value)
		setPage(0)
	}
	const changeActiveFilter = (value: ActiveFilter) => {
		setActiveFilter(value)
		setPage(0)
	}

	const term = search.trim().toLowerCase()
	const rows = (query.data?.content ?? []).filter(city =>
		term ? city.name.toLowerCase().includes(term) : true
	)

	return (
		<div className='space-y-6'>
			<div className='flex flex-wrap items-start justify-between gap-4'>
				<div>
					<h1 className='text-3xl font-bold'>Города</h1>
					<p className='mt-1 text-slate-500'>
						Справочник городов по провайдерам
					</p>
				</div>
				<div className='flex items-center gap-2'>
					<RefreshButton queryKey={['cities']} />
					<button
						className='btn btn-primary'
						onClick={() => setEditor({ mode: 'create' })}
					>
						<Plus size={17} /> Добавить город
					</button>
				</div>
			</div>

			<section className='card'>
				<div className='flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4'>
					<div className='flex flex-wrap items-center gap-3'>
						<div className='relative w-full max-w-sm sm:w-80'>
							<Search
								className='absolute left-3 top-3 text-slate-400'
								size={18}
							/>
							<input
								className='field !pl-10'
								placeholder='Поиск по названию (на этой странице)…'
								value={search}
								onChange={event =>
									setSearch(event.target.value)
								}
							/>
						</div>
						<select
							className='field !w-auto'
							value={activeFilter}
							onChange={event =>
								changeActiveFilter(
									event.target.value as ActiveFilter
								)
							}
						>
							{ACTIVE_FILTERS.map(option => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</select>
					</div>
					<span className='text-sm text-slate-500'>
						Всего: {query.data?.totalElements ?? 0}
					</span>
				</div>

				{query.isError ? (
					<ErrorState onRetry={() => query.refetch()} />
				) : (
					<div className='table-wrap'>
						<table className='data-table'>
							<thead>
								<tr>
									<SortableTh
										label='Провайдер'
										field='provider'
										activeField={primaryField}
										activeDir={primaryDir}
										onSort={toggleSort}
									/>
									<SortableTh
										label='Название'
										field='name'
										activeField={primaryField}
										activeDir={primaryDir}
										onSort={toggleSort}
									/>
									<SortableTh
										label='Код'
										field='cityCode'
										activeField={primaryField}
										activeDir={primaryDir}
										onSort={toggleSort}
									/>
									<SortableTh
										label='Создан'
										field='createdAt'
										activeField={primaryField}
										activeDir={primaryDir}
										onSort={toggleSort}
									/>
									<SortableTh
										label='Обновлён'
										field='updatedAt'
										activeField={primaryField}
										activeDir={primaryDir}
										onSort={toggleSort}
									/>
									<th>Статус</th>
									<th className='text-right'>Действия</th>
								</tr>
							</thead>
							<tbody>
								{query.isLoading ? (
									<TableSkeleton columns={COLUMNS} />
								) : !query.data?.content?.length ? (
									<tr>
										<td colSpan={COLUMNS}>
											<EmptyState message='Справочник городов пуст' />
										</td>
									</tr>
								) : !rows.length ? (
									<tr>
										<td colSpan={COLUMNS}>
											<EmptyState message='На этой странице ничего не найдено' />
										</td>
									</tr>
								) : (
									rows.map(city => (
										<tr key={city.id}>
											<td>
												<span className='badge bg-indigo-50 text-indigo-700'>
													{providerLabel(
														city.provider
													)}
												</span>
											</td>
											<td className='font-semibold'>
												{city.name}
											</td>
											<td className='font-mono text-sm text-slate-500'>
												{city.cityCode}
											</td>
											<td className='whitespace-nowrap'>
												{formatDateTime(city.createdAt)}
											</td>
											<td className='whitespace-nowrap'>
												{formatDateTime(city.updatedAt)}
											</td>
											<td>
												<StatusToggle
													active={city.active}
													pending={
														setActive.isPending &&
														setActive.variables
															?.city.id === city.id
													}
													onToggle={() =>
														setActive.mutate({
															city,
															active: !city.active
														})
													}
												/>
											</td>
											<td>
												<div className='flex justify-end gap-2'>
													<button
														className='btn btn-soft !p-2'
														onClick={() =>
															setEditor({
																mode: 'edit',
																city
															})
														}
														aria-label='Редактировать'
														title='Редактировать'
													>
														<Pencil size={16} />
													</button>
													<button
														className='btn btn-soft !p-2 text-red-600'
														onClick={() =>
															setConfirmDelete(
																city
															)
														}
														aria-label='Удалить'
														title='Удалить'
													>
														<Trash2 size={16} />
													</button>
												</div>
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
					pageSizeOptions={PAGE_SIZE_OPTIONS}
				/>
			</section>

			{editor && (
				<CityFormModal
					editor={editor}
					onClose={() => setEditor(null)}
					onSaved={() => {
						setEditor(null)
						queryClient.invalidateQueries({ queryKey: ['cities'] })
					}}
				/>
			)}

			{confirmDelete && (
				<div className='fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-5'>
					<div
						className='card w-full max-w-md p-6'
						role='dialog'
						aria-modal='true'
						aria-labelledby='city-delete-title'
					>
						<h2
							id='city-delete-title'
							className='text-xl font-bold'
						>
							Удалить город?
						</h2>
						<p className='my-3 text-slate-500'>
							Город «{confirmDelete.name}» (
							{providerLabel(confirmDelete.provider)},{' '}
							{confirmDelete.cityCode}) будет удалён из
							справочника. Операцию нельзя отменить.
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
								onClick={() => remove.mutate(confirmDelete.id)}
							>
								{remove.isPending ? 'Удаление…' : 'Удалить'}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}

function SortableTh({
	label,
	field,
	activeField,
	activeDir,
	onSort
}: {
	label: string
	field: string
	activeField: string
	activeDir: string
	onSort: (field: string) => void
}) {
	const active = activeField === field
	const Icon = !active
		? ArrowDownUp
		: activeDir === 'asc'
			? ArrowUp
			: ArrowDown
	return (
		<th>
			<button
				className={`flex items-center gap-1 ${active ? 'text-indigo-600' : ''}`}
				onClick={() => onSort(field)}
			>
				{label} <Icon size={14} />
			</button>
		</th>
	)
}

function StatusToggle({
	active,
	pending,
	onToggle
}: {
	active: boolean
	pending: boolean
	onToggle: () => void
}) {
	return (
		<button
			className={`badge gap-1 ${active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}
			disabled={pending}
			onClick={onToggle}
			title={
				active
					? 'Нажмите, чтобы деактивировать'
					: 'Нажмите, чтобы активировать'
			}
		>
			{pending ? (
				<LoaderCircle size={12} className='animate-spin' />
			) : active ? (
				<Check size={12} />
			) : (
				<X size={12} />
			)}
			{active ? 'Активен' : 'Неактивен'}
		</button>
	)
}

type FormErrors = { name?: string; cityCode?: string; provider?: string }

function CityFormModal({
	editor,
	onClose,
	onSaved
}: {
	editor: Exclude<Editor, null>
	onClose: () => void
	onSaved: () => void
}) {
	const isEdit = editor.mode === 'edit'
	const existing = isEdit ? editor.city : null
	const [provider, setProvider] = useState<CityProvider>(
		existing?.provider ?? 'KUFAR'
	)
	const [name, setName] = useState(existing?.name ?? '')
	const [cityCode, setCityCode] = useState(existing?.cityCode ?? '')
	const [active, setActive] = useState(existing?.active ?? true)
	const [errors, setErrors] = useState<FormErrors>({})
	const [formError, setFormError] = useState<string | null>(null)
	const [errorId, setErrorId] = useState<string | undefined>()

	const save = useMutation({
		mutationFn: () =>
			isEdit
				? api
						.put<City>(`/cities/${existing!.id}`, {
							name: name.trim(),
							active
						})
						.then(response => response.data)
				: api
						.post<City>('/cities', {
							provider,
							name: name.trim(),
							cityCode: cityCode.trim(),
							active
						})
						.then(response => response.data),
		onSuccess: () => {
			toast.success(isEdit ? 'Город обновлён' : 'Город создан')
			onSaved()
		},
		onError: error => {
			const status = apiStatus(error)
			if (status === 404) {
				toast.error('Город не найден — возможно, уже удалён')
				onSaved()
				return
			}
			if (status === 400) {
				const fieldErrors = apiFieldErrors(error)
				setErrors({
					name: fieldErrors.name,
					cityCode: fieldErrors.cityCode,
					provider: fieldErrors.provider
				})
				setFormError(
					apiErrorMessage(error, 'Проверьте правильность заполнения')
				)
				setErrorId(apiErrorId(error))
				return
			}
			toast.error(apiErrorMessage(error, 'Не удалось сохранить город'))
		}
	})

	const submit = () => {
		const next: FormErrors = {}
		if (!name.trim()) next.name = 'Название города обязательно'
		else if (name.trim().length > NAME_MAX)
			next.name = `Не более ${NAME_MAX} символов`
		if (!isEdit) {
			if (!cityCode.trim()) next.cityCode = 'Код города обязателен'
			else if (cityCode.trim().length > NAME_MAX)
				next.cityCode = `Не более ${NAME_MAX} символов`
			if (!CITY_PROVIDERS.includes(provider))
				next.provider = 'Выберите провайдера'
		}
		setErrors(next)
		setFormError(null)
		setErrorId(undefined)
		if (Object.keys(next).length) return
		save.mutate()
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
				className='card flex w-full max-w-lg flex-col p-6'
				role='dialog'
				aria-modal='true'
				aria-labelledby='city-form-title'
			>
				<div className='flex items-center justify-between gap-4'>
					<h2 id='city-form-title' className='text-xl font-bold'>
						{isEdit ? 'Редактирование города' : 'Новый город'}
					</h2>
					<button
						className='btn btn-soft !p-2'
						onClick={onClose}
						aria-label='Закрыть'
					>
						<X size={18} />
					</button>
				</div>

				<div className='mt-5 space-y-4'>
					<Field label='Провайдер' error={errors.provider}>
						<select
							className='field'
							value={provider}
							disabled={isEdit}
							onChange={event =>
								setProvider(event.target.value as CityProvider)
							}
						>
							{CITY_PROVIDERS.map(value => (
								<option key={value} value={value}>
									{providerLabel(value)}
								</option>
							))}
						</select>
					</Field>

					<Field label='Название' error={errors.name}>
						<input
							className='field'
							maxLength={NAME_MAX}
							value={name}
							onChange={event => setName(event.target.value)}
							placeholder='Минск'
						/>
					</Field>

					<Field
						label='Код города'
						error={errors.cityCode}
						hint={
							isEdit
								? 'Код и провайдер не редактируются'
								: 'Код города в системе провайдера'
						}
					>
						<input
							className='field'
							maxLength={NAME_MAX}
							value={cityCode}
							disabled={isEdit}
							onChange={event => setCityCode(event.target.value)}
							placeholder='minsk'
						/>
					</Field>

					<label className='flex items-center gap-2 text-sm font-semibold'>
						<input
							type='checkbox'
							className='h-4 w-4'
							checked={active}
							onChange={event => setActive(event.target.checked)}
						/>
						Активен
					</label>

					{formError && (
						<div className='rounded-lg bg-red-50 p-3 text-sm text-red-600'>
							{formError}
							{errorId && (
								<span className='mt-1 block text-xs text-red-400'>
									ID ошибки: {errorId}
								</span>
							)}
						</div>
					)}
				</div>

				<div className='mt-5 flex justify-end gap-2 border-t border-slate-100 pt-4'>
					<button className='btn btn-soft' onClick={onClose}>
						Отмена
					</button>
					<button
						className='btn btn-primary'
						disabled={save.isPending}
						onClick={submit}
					>
						{save.isPending ? 'Сохранение…' : 'Сохранить'}
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
