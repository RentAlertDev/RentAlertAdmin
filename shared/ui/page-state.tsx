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
