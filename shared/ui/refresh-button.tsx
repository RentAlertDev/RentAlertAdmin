'use client'

import { useQueryClient } from '@tanstack/react-query'
import { RefreshCcw } from 'lucide-react'
import { useTransition } from 'react'

interface RefreshButtonProps {
	queryKey: (string | number | boolean | object)[]
	disabled?: boolean
}

export function RefreshButton({ queryKey, disabled }: RefreshButtonProps) {
	const queryClient = useQueryClient()
	const [isPending, startTransition] = useTransition()

	const handleRefresh = () => {
		startTransition(async () => {
			await queryClient.invalidateQueries({ queryKey })
		})
	}

	return (
		<button
			onClick={handleRefresh}
			disabled={disabled || isPending}
			className='btn btn-soft !p-2'
			aria-label='Перезагрузить данные'
			title='Перезагрузить данные'
		>
			<RefreshCcw size={18} className={isPending ? 'animate-spin' : ''} />
		</button>
	)
}
