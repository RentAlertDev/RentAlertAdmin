import { ChevronLeft, ChevronRight } from 'lucide-react'

export function Pagination({
	page,
	totalPages,
	onChange,
	pageSize,
	onPageSizeChange,
	pageSizeOptions = [10, 20, 50, 100]
}: {
	page: number
	totalPages: number
	onChange: (page: number) => void
	pageSize?: number
	onPageSizeChange?: (pageSize: number) => void
	pageSizeOptions?: number[]
}) {
	if (totalPages <= 0 || (totalPages <= 1 && !onPageSizeChange)) return null
	const pages = Array.from({ length: totalPages }, (_, index) => index)
	return (
		<div className='flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3'>
			<div className='flex items-center gap-2 text-sm text-slate-500'>
				<button
					className='btn btn-soft !p-2'
					disabled={page === 0}
					onClick={() => onChange(page - 1)}
					aria-label='Предыдущая'
				>
					<ChevronLeft size={18} />
				</button>
				<div className='flex items-center gap-1'>
					{pages.map(pageNumber => (
						<button
							key={pageNumber}
							className={`btn !min-w-9 !px-2 ${pageNumber === page ? 'btn-primary' : 'btn-soft'}`}
							onClick={() => onChange(pageNumber)}
							aria-label={`Страница ${pageNumber + 1}`}
							aria-current={
								pageNumber === page ? 'page' : undefined
							}
						>
							{pageNumber + 1}
						</button>
					))}
				</div>
				<button
					className='btn btn-soft !p-2'
					disabled={page + 1 >= totalPages}
					onClick={() => onChange(page + 1)}
					aria-label='Следующая'
				>
					<ChevronRight size={18} />
				</button>
			</div>
			{pageSize && onPageSizeChange && (
				<label className='flex items-center gap-2 text-sm text-slate-500'>
					Элементов на странице
					<select
						className='field !w-auto !py-2'
						value={pageSize}
						onChange={event =>
							onPageSizeChange(Number(event.target.value))
						}
					>
						{pageSizeOptions.map(option => (
							<option key={option} value={option}>
								{option}
							</option>
						))}
					</select>
				</label>
			)}
		</div>
	)
}
