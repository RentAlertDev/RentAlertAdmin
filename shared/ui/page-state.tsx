import { AlertCircle, LoaderCircle } from 'lucide-react'

export function LoadingState() {
	return (
		<div className='card flex min-h-48 items-center justify-center text-slate-500'>
			<LoaderCircle className='mr-2 animate-spin' />
			Загрузка…
		</div>
	)
}
export function ErrorState({
	message = 'Не удалось загрузить данные'
}: {
	message?: string
}) {
	return (
		<div className='card flex min-h-48 items-center justify-center text-red-600'>
			<AlertCircle className='mr-2' />
			{message}
		</div>
	)
}
export function EmptyState({ message }: { message: string }) {
	return (
		<div className='flex min-h-48 items-center justify-center p-8 text-slate-500'>
			{message}
		</div>
	)
}

export function Skeleton({ className = '' }: { className?: string }) {
	return <div className={`skeleton animate-pulse ${className}`} />
}

export function TableSkeleton({
	columns,
	rows = 6
}: {
	columns: number
	rows?: number
}) {
	return (
		<>
			{Array.from({ length: rows }, (_, rowIndex) => (
				<tr key={rowIndex}>
					{Array.from({ length: columns }, (__, colIndex) => (
						<td key={colIndex}>
							<Skeleton
								className={`h-4 ${colIndex === 0 ? 'w-32' : 'w-20'}`}
							/>
						</td>
					))}
				</tr>
			))}
		</>
	)
}

export function CardGridSkeleton({ count = 4 }: { count?: number }) {
	return (
		<div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
			{Array.from({ length: count }, (_, index) => (
				<div key={index} className='card flex items-center gap-4 p-5'>
					<Skeleton className='h-12 w-12 shrink-0 rounded-xl' />
					<div className='flex-1 space-y-2'>
						<Skeleton className='h-3 w-24' />
						<Skeleton className='h-5 w-16' />
					</div>
				</div>
			))}
		</div>
	)
}

export function DetailHeaderSkeleton() {
	return (
		<div className='card flex flex-wrap items-center gap-5 p-6'>
			<Skeleton className='h-22 w-22 shrink-0 rounded-2xl' />
			<div className='flex-1 space-y-3'>
				<Skeleton className='h-6 w-52' />
				<Skeleton className='h-4 w-72' />
			</div>
		</div>
	)
}
