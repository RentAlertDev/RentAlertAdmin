import { ShieldX } from 'lucide-react'
import Link from 'next/link'

import { APP_ROUTES } from '@/shared/config/routes'

export default function Forbidden() {
	return (
		<main className='grid min-h-screen place-items-center p-6'>
			<div className='text-center'>
				<ShieldX className='mx-auto mb-5 text-red-500' size={70} />
				<h1 className='text-4xl font-bold'>403</h1>
				<p className='mb-6 mt-2 text-slate-500'>
					У вас нет прав администратора для просмотра этой страницы.
				</p>
				<Link href={APP_ROUTES.LOGIN} className='btn btn-primary'>
					Вернуться ко входу
				</Link>
			</div>
		</main>
	)
}
