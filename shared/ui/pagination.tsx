import { ChevronLeft, ChevronRight } from 'lucide-react'

export function Pagination({
	page,
	totalPages,
	onChange
}: {
	page: number
	totalPages: number
	onChange: (page: number) => void
}) {
	if (totalPages <= 1) return null
	return (
		<div className='flex items-center justify-between border-t border-slate-100 px-4 py-3'>
			<span className='text-sm text-slate-500'>
				Страница {page + 1} из {totalPages}
			</span>
			<div className='flex gap-2'>
				<button
					className='btn btn-soft !p-2'
					disabled={page === 0}
					onClick={() => onChange(page - 1)}
					aria-label='Предыдущая'
				>
					<ChevronLeft size={18} />
				</button>
				<button
					className='btn btn-soft !p-2'
					disabled={page + 1 >= totalPages}
					onClick={() => onChange(page + 1)}
					aria-label='Следующая'
				>
					<ChevronRight size={18} />
				</button>
			</div>
		</div>
	)
}
